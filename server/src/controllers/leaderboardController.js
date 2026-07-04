import Opportunity from '../models/Opportunity.js';
import User from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    // 1. Group jobs by the Alumni who posted them and count them up
    const topAlumni = await Opportunity.aggregate([
      { $group: { _id: '$postedBy', score: { $sum: 1 } } },
      { $sort: { score: -1 } },
      { $limit: 5 }
    ]);

    const populatedLeaderboard = await User.populate(topAlumni, { 
      path: '_id', 
      select: 'email' 
    });

    res.status(200).json(populatedLeaderboard);
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};