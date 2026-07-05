import Opportunity from '../models/Opportunity.js';
import AlumniProfile from '../models/AlumniProfile.js';
import StudentProfile from '../models/StudentProfile.js';
import ReferralRequest from '../models/ReferralRequest.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';
import { recomputeContribution } from '../services/contributionService.js';

// Escape user input before using it inside a RegExp
const escapeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s = '') => s.toLowerCase().trim();

/*
 * Referral priority ranking.
 *
 * When several alumni post the same opening, we surface the strongest referrer
 * first. Each posting gets a priorityScore (0-100) blending the poster's:
 *   - seniority         (AlumniProfile.yearsOfExperience)
 *   - contribution      (opportunities they've posted + referrals given)
 *   - referralSuccess   (share of their referral requests that reached
 *                        Referred / Interviewing / Hired)
 * Identical openings (same role + company) are then clustered together and
 * ordered by that score, and the board as a whole leads with the highest
 * priority openings.
 */
const PRIORITY_WEIGHTS = { seniority: 0.34, contribution: 0.33, success: 0.33 };
const SUCCESS_STATUSES = ['Referred', 'Interviewing', 'Hired'];

const buildPriorityIndex = async (posterIds) => {
  if (!posterIds.length) return {};

  const [profiles, postCounts, referralStats] = await Promise.all([
    AlumniProfile.find({ user: { $in: posterIds } })
      .select('user yearsOfExperience totalReferralsGiven'),
    Opportunity.aggregate([
      { $match: { isActive: true, postedBy: { $in: posterIds } } },
      { $group: { _id: '$postedBy', count: { $sum: 1 } } },
    ]),
    ReferralRequest.aggregate([
      { $match: { alumni: { $in: posterIds } } },
      {
        $group: {
          _id: '$alumni',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $in: ['$status', SUCCESS_STATUSES] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const profileMap = new Map(profiles.map((p) => [String(p.user), p]));
  const postMap = new Map(postCounts.map((p) => [String(p._id), p.count]));
  const refMap = new Map(referralStats.map((r) => [String(r._id), r]));

  const index = {};
  for (const id of posterIds.map(String)) {
    const profile = profileMap.get(id);
    const years = profile?.yearsOfExperience || 0;
    const referralsGiven = profile?.totalReferralsGiven || 0;
    const posts = postMap.get(id) || 0;
    const contribution = posts + referralsGiven;

    const ref = refMap.get(id);
    const hasReferralHistory = ref && ref.total > 0;
    const successRate = hasReferralHistory ? ref.success / ref.total : 0.5; // neutral baseline

    // Normalise each component to 0..1 with sensible caps
    const seniorityN = Math.min(years, 20) / 20;
    const contributionN = Math.min(contribution, 15) / 15;
    const successN = successRate;

    const priorityScore = Math.round(
      100 * (PRIORITY_WEIGHTS.seniority * seniorityN +
             PRIORITY_WEIGHTS.contribution * contributionN +
             PRIORITY_WEIGHTS.success * successN)
    );

    index[id] = {
      priorityScore,
      yearsOfExperience: years,
      contributionScore: contribution,
      successRate: hasReferralHistory ? Math.round(successRate * 100) : null,
    };
  }
  return index;
};

// Attach poster priority signals to a list of plain opportunity objects,
// preserving their existing order (used where a custom order already applies,
// e.g. skill-based recommendations).
const attachPosterSignals = async (items) => {
  const posterIds = [...new Map(
    items.map((o) => o.postedBy?._id || o.postedBy).filter(Boolean).map((id) => [String(id), id])
  ).values()];
  const index = await buildPriorityIndex(posterIds);
  const fallback = { priorityScore: 0, yearsOfExperience: 0, contributionScore: 0, successRate: null };
  return items.map((o) => {
    const signals = index[String(o.postedBy?._id || o.postedBy)] || fallback;
    return { ...o, priorityScore: signals.priorityScore, poster: signals };
  });
};

// Attach priority signals, cluster identical openings, and order the board.
const prioritizeOpportunities = async (opportunities) => {
  // Unique poster ObjectIds (aggregation $match needs ObjectIds, not strings)
  const posterIds = [...new Map(
    opportunities
      .map((o) => o.postedBy?._id || o.postedBy)
      .filter(Boolean)
      .map((id) => [String(id), id])
  ).values()];
  const index = await buildPriorityIndex(posterIds);

  const enriched = opportunities.map((o) => {
    const posterId = String(o.postedBy?._id || o.postedBy);
    const signals = index[posterId] || { priorityScore: 0, yearsOfExperience: 0, contributionScore: 0, successRate: null };
    return { ...o.toObject(), priorityScore: signals.priorityScore, poster: signals };
  });

  // Group identical openings (role + company)
  const groups = new Map();
  for (const o of enriched) {
    const key = `${norm(o.role)}|${norm(o.company)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }

  for (const arr of groups.values()) {
    arr.sort((a, b) => b.priorityScore - a.priorityScore || new Date(b.createdAt) - new Date(a.createdAt));
    arr.forEach((o, i) => {
      o.groupSize = arr.length;
      o.groupRank = i;
      o.isTopReferral = arr.length > 1 && i === 0;
    });
  }

  // Lead with the highest-priority openings; keep each identical group together
  return [...groups.values()]
    .sort((ga, gb) => gb[0].priorityScore - ga[0].priorityScore || new Date(gb[0].createdAt) - new Date(ga[0].createdAt))
    .flat();
};

export const createOpportunity = async (req, res) => {
  try {
    const alumniId = req.user.id || req.user._id;

    // 1. Save the new job to the database
    const newOpportunity = await Opportunity.create({
      ...req.body,
      postedBy: alumniId
    });

    // 2. Respond to the frontend immediately (Don't make the user wait for notifications to process)
    res.status(201).json(newOpportunity);

    // Award contribution points for posting (background)
    recomputeContribution(alumniId);

    // 3. Process notifications in the background
    try {
      // Find all users with the student role (Check if your DB uses 'student' or 'Student')
      const students = await User.find({ role: { $regex: /^student$/i } }); 
      
      const notificationPromises = students.map(student => 
        createNotification({
          recipient: student._id,
          type: 'New_Opportunity',
          title: 'New Opportunity Posted',
          message: `A new ${newOpportunity.type || 'position'} role at ${newOpportunity.company || 'a company'} was just posted.`,
          actionUrl: `/jobs?job=${newOpportunity._id}`,
          relatedEntityModel: 'Opportunity',
          relatedEntityId: newOpportunity._id,
          recipientEmail: student.email
        })
      );

      // Execute all notification creations in parallel
      await Promise.all(notificationPromises);
      
    } catch (notificationError) {
      // Log the error but don't crash the original request since the job was already saved
      console.error('Background notification failed:', notificationError);
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getOpportunities = async (req, res) => {
  try {
    const { search, company, role, type, eligibility, skills } = req.query;

    const filter = { isActive: true };

    if (type) filter.type = type;
    if (company) filter.company = { $regex: escapeRegex(company), $options: 'i' };
    if (role) filter.role = { $regex: escapeRegex(role), $options: 'i' };
    if (eligibility) filter.eligibility = { $regex: escapeRegex(eligibility), $options: 'i' };

    // Skills filter — match any of the requested skills (case-insensitive, partial)
    if (skills) {
      const list = skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length) {
        filter.requiredSkills = { $in: list.map((s) => new RegExp(escapeRegex(s), 'i')) };
      }
    }

    // Free-text search across the main fields
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { role: rx },
        { company: rx },
        { description: rx },
        { requiredSkills: rx },
      ];
    }

    const opportunities = await Opportunity.find(filter)
      .populate('postedBy', 'firstName lastName username email');

    // Order by referrer priority, clustering identical openings together
    const prioritized = await prioritizeOpportunities(opportunities);

    res.status(200).json(prioritized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Recommend active opportunities that overlap with a student's skill set,
// ranked by how many of their skills match.
export const getRecommendedOpportunities = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const profile = await StudentProfile.findOne({ user: userId });
    const studentSkills = (profile?.skills || []).map(norm).filter(Boolean);

    if (!studentSkills.length) {
      // No skills on file — nothing to base recommendations on yet.
      return res.status(200).json({ hasSkills: false, opportunities: [] });
    }

    const skillSet = new Set(studentSkills);

    const opportunities = await Opportunity.find({ isActive: true })
      .populate('postedBy', 'firstName lastName username email')
      .sort({ createdAt: -1 });

    const scored = opportunities
      .map((opp) => {
        const oppSkills = opp.requiredSkills || [];
        const matchedSkills = oppSkills.filter((s) => skillSet.has(norm(s)));
        const matchScore = oppSkills.length
          ? Math.round((matchedSkills.length / oppSkills.length) * 100)
          : 0;
        return { ...opp.toObject(), matchedSkills, matchCount: matchedSkills.length, matchScore };
      })
      .filter((o) => o.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount || b.matchScore - a.matchScore)
      .slice(0, 6);

    // Attach referrer standing so recommended cards show the poster too
    const withPoster = await attachPosterSignals(scored);

    res.status(200).json({ hasSkills: true, opportunities: withPoster });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    const authorId = opportunity.postedBy._id ? opportunity.postedBy._id.toString() : opportunity.postedBy.toString();
    
    const requestingUserId = req.user.id || req.user._id;

    if (authorId !== requestingUserId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to edit this post' });
    }

    const updatedOpp = await Opportunity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedOpp);
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// Opportunities posted by the logged-in alumnus (incl. hidden), with request counts
export const getMyOpportunities = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const opps = await Opportunity.find({ postedBy: userId }).sort({ createdAt: -1 }).lean();
    res.status(200).json(opps.map((o) => ({ ...o, requestedCount: o.requestedBy?.length || 0 })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isOwner = (opportunity, req) => {
  const authorId = opportunity.postedBy?._id ? opportunity.postedBy._id.toString() : opportunity.postedBy.toString();
  return authorId === (req.user.id || req.user._id).toString();
};

// Toggle a posting between active and hidden (owner only)
export const setOpportunityActive = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (!isOwner(opportunity, req)) return res.status(403).json({ message: 'You are not authorized to edit this post' });

    opportunity.isActive = !!req.body.isActive;
    await opportunity.save();
    res.status(200).json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a posting (owner only) + its referral requests
export const deleteMyOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    if (!isOwner(opportunity, req)) return res.status(403).json({ message: 'You are not authorized to delete this post' });

    await ReferralRequest.deleteMany({ opportunity: opportunity._id });
    await opportunity.deleteOne();
    res.status(200).json({ message: 'Opportunity deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const requestReferral = async (req, res) => {
  try {
    const { message } = req.body;
    const opportunity = await Opportunity.findById(req.params.id);
    
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    const userId = req.user.id || req.user._id;

    if (opportunity.requestedBy.includes(userId)) {
      return res.status(400).json({ message: 'You have already requested a referral for this opportunity.' });
    }

    opportunity.requestedBy.push(userId);
    await opportunity.save();

    // Create a trackable referral request. This is what feeds the alumni inbox
    // and the referral-success-rate signal used for priority ranking.
    let referral;
    try {
      referral = await ReferralRequest.create({
        student: userId,
        alumni: opportunity.postedBy,
        opportunity: opportunity._id,
        message: message?.trim() || 'Referral requested via the board.',
        statusHistory: [{ status: 'Pending' }],
      });
    } catch (referralErr) {
      console.error('ReferralRequest creation failed:', referralErr);
    }

    res.status(200).json({ message: 'Referral requested successfully!', opportunity });

    // Notify the posting alumnus (background — don't block the response)
    if (referral) {
      createNotification({
        recipient: opportunity.postedBy,
        type: 'Referral_Update',
        title: 'New referral request',
        message: `A student requested a referral for ${opportunity.role} at ${opportunity.company}.`,
        actionUrl: '/referrals',
        relatedEntityModel: 'ReferralRequest',
        relatedEntityId: referral._id,
      }).catch((notifyErr) => console.error('Referral notification failed:', notifyErr));
    }
  } catch (error) {
    console.error("Referral Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};