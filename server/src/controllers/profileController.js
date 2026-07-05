import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ReferralRequest from '../models/ReferralRequest.js';
import CareerRoadmap from '../models/CareerRoadmap.js';
import User from '../models/User.js'; // Added to keep graduation year in sync
import { computeAlumniPoints } from '../services/contributionService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // server/src/controllers
const SERVER_ROOT = path.join(__dirname, '../..'); // server/
const RESUME_DIR = path.join(SERVER_ROOT, 'uploads/resumes');

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SUCCESS_STATUSES = ['Referred', 'Interviewing', 'Hired'];

export const getStudentProfile = async (req, res) => {
  try {
    // Updated populate to fetch the new first and last names
    const profile = await StudentProfile.findOne({ user: req.params.userId }).populate('user', 'firstName lastName username email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const { university, graduationYear, major, skills, githubUrl, portfolioUrl, projects, resumeUrl } = req.body;
    const userId = req.user.id || req.user._id;

    // Update main user account's graduation year if it changed
    if (graduationYear) {
      await User.findByIdAndUpdate(userId, { graduationYear });
    }
    
    let profile = await StudentProfile.findOne({ user: userId });
    
    if (profile) {
      profile.university = university || profile.university;
      profile.graduationYear = graduationYear || profile.graduationYear;
      profile.major = major || profile.major;
      profile.skills = skills || profile.skills;
      profile.githubUrl = githubUrl || profile.githubUrl;
      profile.portfolioUrl = portfolioUrl || profile.portfolioUrl;
      profile.projects = projects || profile.projects;
      profile.resumeUrl = resumeUrl || profile.resumeUrl;
      
      const updatedProfile = await profile.save();
      return res.status(200).json(updatedProfile);
    }

    profile = new StudentProfile({
      user: userId,
      university,
      graduationYear,
      major,
      skills,
      githubUrl,
      portfolioUrl,
      projects,
      resumeUrl
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Upload / replace the logged-in student's resume PDF
// @route POST /api/profiles/student/resume
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload a PDF resume' });
    const userId = req.user.id || req.user._id;

    await fs.promises.mkdir(RESUME_DIR, { recursive: true });
    const filename = `${userId}-${Date.now()}.pdf`;
    await fs.promises.writeFile(path.join(RESUME_DIR, filename), req.file.buffer);
    const resumeUrl = `/uploads/resumes/${filename}`;

    // Persist on the profile if it exists; best-effort remove the previous file
    const profile = await StudentProfile.findOne({ user: userId });
    if (profile) {
      if (profile.resumeUrl) {
        fs.promises.unlink(path.join(SERVER_ROOT, profile.resumeUrl)).catch(() => {});
      }
      profile.resumeUrl = resumeUrl;
      await profile.save();
    }

    res.status(200).json({ resumeUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Remove the logged-in student's resume
// @route DELETE /api/profiles/student/resume
export const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const profile = await StudentProfile.findOne({ user: userId });
    if (profile?.resumeUrl) {
      fs.promises.unlink(path.join(SERVER_ROOT, profile.resumeUrl)).catch(() => {});
      profile.resumeUrl = '';
      await profile.save();
    }
    res.status(200).json({ message: 'Resume removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAlumniProfile = async (req, res) => {
  try {
    // Updated populate to fetch the new first and last names
    const profile = await AlumniProfile.findOne({ user: req.params.userId }).populate('user', 'firstName lastName username email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Keep contribution points accurate (compute fresh + self-heal the stored value)
    const { points } = await computeAlumniPoints(req.params.userId);
    if (points !== profile.contributionPoints) {
      profile.contributionPoints = points;
      profile.save().catch((e) => console.error('Failed to persist contributionPoints:', e));
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAlumniProfile = async (req, res) => {
  try {
    // Added college, department, and graduationYear to the destructuring
    const { college, department, graduationYear, currentCompany, jobTitle, industry, yearsOfExperience, skills, linkedinUrl } = req.body;
    const userId = req.user.id || req.user._id;

    // Update main user account's graduation year if it changed
    if (graduationYear) {
      await User.findByIdAndUpdate(userId, { graduationYear });
    }
    
    let profile = await AlumniProfile.findOne({ user: userId });
    
    if (profile) {
      profile.college = college || profile.college;
      profile.department = department || profile.department;
      profile.currentCompany = currentCompany || profile.currentCompany;
      profile.jobTitle = jobTitle || profile.jobTitle;
      profile.industry = industry || profile.industry;
      profile.yearsOfExperience = yearsOfExperience || profile.yearsOfExperience;
      profile.skills = skills || profile.skills;
      profile.linkedinUrl = linkedinUrl || profile.linkedinUrl;

      const updatedProfile = await profile.save();
      return res.status(200).json(updatedProfile);
    }

    profile = new AlumniProfile({
      user: userId,
      college,
      department,
      currentCompany,
      jobTitle,
      industry,
      yearsOfExperience,
      skills,
      linkedinUrl
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc  Recommend alumni a student should reach out to (intelligent matching)
// @route GET /api/profiles/alumni/recommended
//
// Scores alumni for the requesting student on: shared skills, referral success
// rate, responsiveness, and — if the student has generated a career roadmap —
// whether the alumnus works at their target company. Returns the top matches
// with human-readable reasons.
export const getRecommendedAlumni = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const me = await StudentProfile.findOne({ user: userId }).select('skills major');
    const mySkills = (me?.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

    const roadmap = await CareerRoadmap.findOne({ student: userId }).sort({ createdAt: -1 }).select('targetCompany');
    const targetCompany = roadmap?.targetCompany ? roadmap.targetCompany.toLowerCase().trim() : '';

    if (!mySkills.length && !targetCompany) {
      return res.status(200).json({ hasBasis: false, alumni: [] });
    }

    const profiles = await AlumniProfile.find()
      .populate('user', 'firstName lastName username email graduationYear')
      .lean();

    const alumniIds = profiles.map((p) => p.user?._id).filter(Boolean);
    const refStats = await ReferralRequest.aggregate([
      { $match: { alumni: { $in: alumniIds } } },
      { $group: { _id: '$alumni', total: { $sum: 1 }, success: { $sum: { $cond: [{ $in: ['$status', SUCCESS_STATUSES] }, 1, 0] } } } },
    ]);
    const refMap = new Map(refStats.map((r) => [String(r._id), r]));

    const scored = profiles.map((p) => {
      const aSkills = (p.skills || []).map((s) => s.toLowerCase());
      const matched = [...new Set(mySkills.filter((qs) => aSkills.some((as) => as.includes(qs) || qs.includes(as))))];

      const ref = refMap.get(String(p.user?._id));
      const hasRef = ref && ref.total > 0;
      const successRate = hasRef ? ref.success / ref.total : 0.5;
      const responsiveness = (p.responsivenessScore ?? 100) / 100;
      const comp = (p.currentCompany || '').toLowerCase();
      const companyMatch = targetCompany && comp.includes(targetCompany);

      const score = matched.length * 10 + successRate * 20 + responsiveness * 10 + (companyMatch ? 25 : 0);

      const reasons = [];
      if (matched.length) reasons.push(`${matched.length} shared skill${matched.length > 1 ? 's' : ''}`);
      if (companyMatch) reasons.push('Works at your target company');
      if (hasRef && successRate >= 0.5) reasons.push(`${Math.round(successRate * 100)}% referral success`);
      if ((p.responsivenessScore ?? 100) >= 80) reasons.push('Responsive');

      return {
        ...p,
        match: {
          score: Math.round(score),
          matchedSkills: p.skills?.filter((s) => matched.includes(s.toLowerCase())) || [],
          companyMatch: !!companyMatch,
          reasons,
        },
      };
    })
      .filter((a) => a.match.matchedSkills.length > 0 || a.match.companyMatch)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 6);

    res.status(200).json({ hasBasis: true, alumni: scored });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search, rank, and paginate Alumni profiles
// @route   GET /api/profiles/alumni
//
// Ranking blends: skill similarity (to the searching student's skills, or an
// explicit `skills` query), referral success rate, responsiveness, and — when a
// company is searched — company relevance. The whole filtered set is ranked
// before pagination so ordering is global, not per-page.
export const searchAlumniProfiles = async (req, res) => {
  try {
    const { username, company, role, industry, department, graduationYear, skills, page = 1, limit = 9 } = req.query;

    // 1. Start from ALL alumni users (so alumni without a profile still appear)
    const userQuery = { role: 'Alumni' };
    if (username) userQuery.username = { $regex: escapeRegex(username), $options: 'i' };
    if (graduationYear) userQuery.graduationYear = Number(graduationYear);

    const alumniUsers = await User.find(userQuery)
      .select('firstName lastName username email graduationYear')
      .lean();
    if (!alumniUsers.length) {
      return res.status(200).json({ alumni: [], totalPages: 0, currentPage: Number(page), totalResults: 0 });
    }
    const userIds = alumniUsers.map((u) => u._id);

    // 2. Left-join their profiles
    const profiles = await AlumniProfile.find({ user: { $in: userIds } }).lean();
    const profByUser = new Map(profiles.map((p) => [String(p.user), p]));

    // 3. Profile-level filters exclude alumni who don't (yet) match
    const rx = (v) => new RegExp(escapeRegex(v), 'i');
    const hasProfileFilter = !!(company || role || industry || department);
    let records = alumniUsers
      .map((u) => ({ user: u, profile: profByUser.get(String(u._id)) || null }))
      .filter(({ profile }) => {
        if (!hasProfileFilter) return true;
        if (!profile) return false;
        if (company && !rx(company).test(profile.currentCompany || '')) return false;
        if (role && !rx(role).test(profile.jobTitle || '')) return false;
        if (industry && !rx(industry).test(profile.industry || '')) return false;
        if (department && !rx(department).test(profile.department || '')) return false;
        return true;
      });

    // 4. Referral success per alumnus
    const refStats = await ReferralRequest.aggregate([
      { $match: { alumni: { $in: userIds } } },
      { $group: { _id: '$alumni', total: { $sum: 1 }, success: { $sum: { $cond: [{ $in: ['$status', SUCCESS_STATUSES] }, 1, 0] } } } },
    ]);
    const refMap = new Map(refStats.map((r) => [String(r._id), r]));

    // 5. Skill-similarity basis: explicit `skills` query, else the requesting student's own skills
    let querySkills = skills ? skills.split(',').map((s) => s.toLowerCase().trim()).filter(Boolean) : [];
    if (!querySkills.length) {
      const me = await StudentProfile.findOne({ user: req.user.id || req.user._id }).select('skills');
      querySkills = (me?.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
    }
    const companyQ = company ? company.toLowerCase().trim() : '';
    const W = { skill: 0.35, success: 0.30, responsiveness: 0.20, company: 0.15 };

    // 6. Rank (profileless alumni score low and sort to the bottom)
    const ranked = records.map(({ user, profile }) => {
      const p = profile || {};
      const aSkills = (p.skills || []).map((s) => s.toLowerCase());
      const matched = querySkills.length
        ? [...new Set(querySkills.filter((qs) => aSkills.some((as) => as.includes(qs) || qs.includes(as))))]
        : [];
      const skillSim = querySkills.length ? matched.length / querySkills.length : 0;

      const ref = refMap.get(String(user._id));
      const hasRef = ref && ref.total > 0;
      const successRate = hasRef ? ref.success / ref.total : 0.5;
      const responsiveness = (p.responsivenessScore ?? 100) / 100;
      const comp = (p.currentCompany || '').toLowerCase();
      const companyRel = companyQ ? (comp === companyQ ? 1 : comp.includes(companyQ) ? 0.6 : 0) : 0;

      let score = (querySkills.length || companyQ)
        ? W.skill * skillSim + W.success * successRate + W.responsiveness * responsiveness + W.company * companyRel
        : 0.6 * successRate + 0.4 * responsiveness;
      if (!profile) score -= 0.5; // nudge incomplete profiles below completed ones

      return {
        ...p,
        _id: p._id || user._id,
        user,
        hasProfile: !!profile,
        ranking: {
          score: Math.round(score * 100),
          skillMatch: querySkills.length ? Math.round(skillSim * 100) : null,
          matchedSkills: p.skills?.filter((s) => matched.includes(s.toLowerCase())) || [],
          successRate: hasRef ? Math.round(successRate * 100) : null,
          responsiveness: Math.round(responsiveness * 100),
        },
      };
    }).sort((a, b) => b.ranking.score - a.ranking.score);

    const total = ranked.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paged = ranked.slice(skip, skip + Number(limit));

    res.status(200).json({
      alumni: paged,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      totalResults: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Public read-only profile of any user (for viewing each other)
// @route GET /api/profiles/view/:userId
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('firstName lastName username email graduationYear role isEmailVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'Student') {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    } else if (user.role === 'Alumni') {
      profile = await AlumniProfile.findOne({ user: user._id }).lean();
      if (profile) {
        const { points } = await computeAlumniPoints(user._id);
        profile.contributionPoints = points;
      }
    }

    res.status(200).json({ user, role: user.role, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};