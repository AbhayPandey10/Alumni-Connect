import ReferralRequest from '../models/ReferralRequest.js';
import AlumniProfile from '../models/AlumniProfile.js';
import { createNotification } from '../services/notificationService.js';
import { recomputeContribution } from '../services/contributionService.js';

const SUCCESS_STATUSES = ['Referred', 'Interviewing', 'Hired'];

export const requestReferral = async (req, res) => {
  // Security Rule: Only Students can request
  if (req.user.role !== 'Student') {
    return res.status(403).json({ message: 'Only students can request referrals' });
  }

  try {
    const { alumniId, opportunityId, message, resumeUrl } = req.body;

    const request = await ReferralRequest.create({
      student: req.user.id,
      alumni: alumniId,
      opportunity: opportunityId,
      message,
      resumeUrl,
      statusHistory: [{ status: 'Pending' }]
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Referral requests received by the logged-in alumnus (inbox), with the
// alumnus's own aggregate success stats.
export const getReceivedReferrals = async (req, res) => {
  try {
    const alumniId = req.user.id || req.user._id;

    const requests = await ReferralRequest.find({ alumni: alumniId })
      .populate('student', 'firstName lastName username email graduationYear')
      .populate('opportunity', 'role company')
      .sort({ createdAt: -1 });

    const total = requests.length;
    const successful = requests.filter((r) => SUCCESS_STATUSES.includes(r.status)).length;
    const pending = requests.filter((r) => r.status === 'Pending').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : null;

    res.status(200).json({ requests, stats: { total, successful, pending, successRate } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Referral requests sent by the logged-in student (their "My Requests" view).
export const getSentReferrals = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const requests = await ReferralRequest.find({ student: studentId })
      .populate('alumni', 'firstName lastName username email')
      .populate('opportunity', 'role company type deadline')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReferralStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const referral = await ReferralRequest.findById(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Request not found' });

    // Security Rule: Ensure only the assigned alumni can update it
    if (referral.alumni.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to referral' });
    }

    const wasSuccess = SUCCESS_STATUSES.includes(referral.status);
    const isSuccess = SUCCESS_STATUSES.includes(status);

    referral.status = status;
    referral.statusHistory.push({ status, note, updatedAt: Date.now() });
    await referral.save();

    // Keep the alumnus's "referrals given" tally in sync when a request crosses
    // into (or out of) a successful state.
    if (isSuccess !== wasSuccess) {
      await AlumniProfile.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { totalReferralsGiven: isSuccess ? 1 : -1 } }
      );
    }

    // Recompute contribution points for the new referral status (background)
    recomputeContribution(req.user.id);

    res.status(200).json(referral);

    // Notify the student that their request moved (background)
    createNotification({
      recipient: referral.student,
      type: 'Referral_Update',
      title: 'Referral status updated',
      message: `Your referral request is now marked "${status}".`,
      actionUrl: '/my-referrals',
      relatedEntityModel: 'ReferralRequest',
      relatedEntityId: referral._id,
    }).catch((notifyErr) => console.error('Status notification failed:', notifyErr));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
