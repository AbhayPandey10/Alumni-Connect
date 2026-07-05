import Opportunity from '../models/Opportunity.js';
import ReferralRequest from '../models/ReferralRequest.js';
import AlumniProfile from '../models/AlumniProfile.js';

// Points model — alumni earn points for posting opportunities and for how far
// their referrals progress. A referral contributes points for its *current*
// status tier, so a request moving Reviewed → Hired increases the score, and
// a Hired → Rejected reversal decreases it. Points are always recomputed from
// source data, so they can never drift.
export const POINTS = {
  POST: 10,
  STATUS_TIER: { Pending: 0, Reviewed: 5, Referred: 15, Interviewing: 20, Hired: 40, Rejected: 0 },
};

export const tierFor = (points) => {
  if (points >= 200) return 'Diamond';
  if (points >= 100) return 'Gold';
  if (points >= 50) return 'Silver';
  if (points >= 1) return 'Bronze';
  return 'Newcomer';
};

const referralPointsFromStatuses = (statuses = []) =>
  statuses.reduce((sum, s) => sum + (POINTS.STATUS_TIER[s] || 0), 0);

// Points for a single alumnus (used to keep their stored total current)
export const computeAlumniPoints = async (userId) => {
  const [posts, refs] = await Promise.all([
    Opportunity.countDocuments({ postedBy: userId }),
    ReferralRequest.find({ alumni: userId }).select('status').lean(),
  ]);
  const referralPoints = referralPointsFromStatuses(refs.map((r) => r.status));
  return { points: posts * POINTS.POST + referralPoints, posts, referralPoints, referrals: refs.length };
};

// Recompute + persist an alumnus's contributionPoints (fire-and-forget safe)
export const recomputeContribution = async (userId) => {
  try {
    const { points } = await computeAlumniPoints(userId);
    await AlumniProfile.findOneAndUpdate({ user: userId }, { contributionPoints: points });
    return points;
  } catch (error) {
    console.error('recomputeContribution failed:', error);
  }
};

// Full ranked list of contributing alumni — computed fresh so it's always
// accurate regardless of when stored totals were last updated.
export const computeRankedAlumni = async () => {
  const [postAgg, refAgg] = await Promise.all([
    Opportunity.aggregate([{ $group: { _id: '$postedBy', posts: { $sum: 1 } } }]),
    ReferralRequest.aggregate([{ $group: { _id: '$alumni', statuses: { $push: '$status' } } }]),
  ]);

  const rows = new Map();
  const get = (id) => {
    const k = String(id);
    if (!rows.has(k)) rows.set(k, { id: k, posts: 0, referralPoints: 0 });
    return rows.get(k);
  };
  postAgg.forEach((p) => { if (p._id) get(p._id).posts += p.posts; });
  refAgg.forEach((r) => { if (r._id) get(r._id).referralPoints += referralPointsFromStatuses(r.statuses); });

  return [...rows.values()]
    .map((r) => {
      const points = r.posts * POINTS.POST + r.referralPoints;
      return { ...r, points, tier: tierFor(points) };
    })
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points);
};

export const computeLeaderboard = async (topN = 10) => (await computeRankedAlumni()).slice(0, topN);
