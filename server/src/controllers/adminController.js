import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import Opportunity from '../models/Opportunity.js';
import ReferralRequest from '../models/ReferralRequest.js';
import Notification from '../models/Notification.js';

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ROLES = ['Student', 'Alumni', 'Admin'];

// ---- Platform activity overview ----
export const getOverview = async (req, res) => {
  try {
    const [students, alumni, admins, jobsTotal, jobsActive, refsTotal, refByStatus, recentUsers, recentOpps, recentRefs] = await Promise.all([
      User.countDocuments({ role: 'Student' }),
      User.countDocuments({ role: 'Alumni' }),
      User.countDocuments({ role: 'Admin' }),
      Opportunity.countDocuments({}),
      Opportunity.countDocuments({ isActive: true }),
      ReferralRequest.countDocuments({}),
      ReferralRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.find().sort({ createdAt: -1 }).limit(6).select('firstName lastName username email role createdAt'),
      Opportunity.find().sort({ createdAt: -1 }).limit(6).populate('postedBy', 'firstName lastName email').select('role company type isActive createdAt postedBy'),
      ReferralRequest.find().sort({ createdAt: -1 }).limit(6).populate('student', 'firstName lastName').populate('opportunity', 'role company').select('status createdAt student opportunity'),
    ]);

    res.status(200).json({
      counts: { students, alumni, admins, jobsTotal, jobsActive, refsTotal },
      referralsByStatus: refByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      recentUsers,
      recentOpportunities: recentOpps,
      recentReferrals: recentRefs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- User management ----
export const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 15 } = req.query;
    const q = {};
    if (role) q.role = role;
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      q.$or = [{ firstName: rx }, { lastName: rx }, { username: rx }, { email: rx }];
    }

    const total = await User.countDocuments(q);
    const users = await User.find(q)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('firstName lastName username email role graduationYear createdAt');

    res.status(200).json({ users, total, totalPages: Math.ceil(total / Number(limit)), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account here.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cascade: remove their profile, posts, referrals, and notifications
    await Promise.all([
      StudentProfile.deleteOne({ user: user._id }),
      AlumniProfile.deleteOne({ user: user._id }),
      Opportunity.deleteMany({ postedBy: user._id }),
      ReferralRequest.deleteMany({ $or: [{ student: user._id }, { alumni: user._id }] }),
      Notification.deleteMany({ recipient: user._id }),
    ]);
    await user.deleteOne();

    res.status(200).json({ message: 'User and related data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- Content moderation (opportunities) ----
export const getOpportunitiesAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    const q = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      q.$or = [{ role: rx }, { company: rx }];
    }
    const opps = await Opportunity.find(q)
      .sort({ createdAt: -1 })
      .populate('postedBy', 'firstName lastName email')
      .lean();
    res.status(200).json(opps.map((o) => ({ ...o, requestedCount: o.requestedBy?.length || 0 })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleOpportunityActive = async (req, res) => {
  try {
    const { isActive } = req.body;
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, { isActive: !!isActive }, { new: true });
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.status(200).json(opp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOpportunityAdmin = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    await ReferralRequest.deleteMany({ opportunity: opp._id });
    await opp.deleteOne();
    res.status(200).json({ message: 'Opportunity removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
