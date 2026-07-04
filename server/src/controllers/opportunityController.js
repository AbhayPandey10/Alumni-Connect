import Opportunity from '../models/Opportunity.js';
import AlumniProfile from '../models/AlumniProfile.js';

export const createOpportunity = async (req, res) => {
  // Security Rule: Only Alumni can post
  if (req.user.role !== 'Alumni') {
    return res.status(403).json({ message: 'Only alumni can post opportunities' });
  }

  try {
    const opportunity = await Opportunity.create({
      ...req.body,
      postedBy: req.user.id
    });

    // Award contribution points for posting an opportunity
    await AlumniProfile.findOneAndUpdate(
      { user: req.user.id },
      { $inc: { contributionPoints: 10 } }
    );

    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find({ isActive: true })
      .populate('postedBy', 'email')
      .sort({ createdAt: -1 });
    res.status(200).json(opportunities);
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

    res.status(200).json({ message: 'Referral requested successfully!', opportunity });
  } catch (error) {
    console.error("Referral Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};