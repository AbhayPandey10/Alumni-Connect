import mongoose from 'mongoose';

const alumniProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company: { type: String, required: true },
  jobRole: { type: String, required: true },
  industry: { type: String, required: true },
  experienceYears: { type: Number, required: true },
  skills: [{ type: String }],
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  badgeType: { 
    type: String, 
    enum: ['None', 'Verified', 'Top Contributor'], 
    default: 'None' 
  },
  contributionPoints: { type: Number, default: 0 },
  referralSuccessRate: { type: Number, default: 0 },
  responsivenessScore: { type: Number, default: 100 } // Out of 100
}, { timestamps: true });

export default mongoose.model('AlumniProfile', alumniProfileSchema);