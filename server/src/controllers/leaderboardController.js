import User from '../models/User.js';
import { computeRankedAlumni, tierFor } from '../services/contributionService.js';

const TOP_N = 10;

export const getLeaderboard = async (req, res) => {
  try {
    const ranked = await computeRankedAlumni();
    const top = ranked.slice(0, TOP_N);

    const meId = req.user ? String(req.user.id || req.user._id) : null;
    const meIndex = meId ? ranked.findIndex((r) => r.id === meId) : -1;

    // Fetch users for the visible rows + the requesting user
    const ids = new Set(top.map((r) => r.id));
    if (meId) ids.add(meId);
    const users = await User.find({ _id: { $in: [...ids] } })
      .select('firstName lastName username email role');
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const format = (r, rank) => {
      const u = userMap.get(r.id);
      return {
        rank,
        user: u
          ? { _id: u._id, firstName: u.firstName, lastName: u.lastName, username: u.username, email: u.email }
          : null,
        points: r.points,
        posts: r.posts,
        referralPoints: r.referralPoints,
        tier: r.tier,
      };
    };

    const leaders = top.map((r, i) => format(r, i + 1));

    // "You" row — only meaningful for alumni (students earn no contribution points)
    let me = null;
    const meUser = meId ? userMap.get(meId) : null;
    if (meUser?.role === 'Alumni') {
      if (meIndex >= 0) {
        me = { ...format(ranked[meIndex], meIndex + 1), inTop: meIndex < TOP_N };
      } else {
        me = {
          rank: null, // unranked (no points yet)
          user: { _id: meUser._id, firstName: meUser.firstName, lastName: meUser.lastName, username: meUser.username, email: meUser.email },
          points: 0, posts: 0, referralPoints: 0, tier: tierFor(0), inTop: false,
        };
      }
    }

    res.status(200).json({ leaders, me, totalRanked: ranked.length });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: error.message });
  }
};
