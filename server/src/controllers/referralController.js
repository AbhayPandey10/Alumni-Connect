import ReferralRequest from '../models/ReferralRequest.js';

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

export const updateReferralStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const referral = await ReferralRequest.findById(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Request not found' });
    
    // Security Rule: Ensure only the assigned alumni can update it
    if (referral.alumni.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized access to referral' });
    }

    referral.status = status;
    referral.statusHistory.push({ status, note, timestamp: Date.now() });

    await referral.save();
    res.status(200).json(referral);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};