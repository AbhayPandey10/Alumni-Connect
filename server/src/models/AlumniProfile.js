import mongoose from 'mongoose';

const alumniProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  college: { type: String, default: 'National Institute of Technology Jamshedpur' },
  department: { type: String },
  currentCompany: { type: String, required: true },
  jobTitle: { type: String, required: true },
  industry: { type: String },
  yearsOfExperience: { type: Number },
  skills: [{ type: String }],
  linkedinUrl: { type: String },
  
  verificationStatus: {
    type: String,
    enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
    default: 'Unverified'
  },
  badgeType: {
    type: String,
    enum: ['None', 'Standard', 'Verified_Corporate'],
    default: 'None'
  },
  
  totalReferralsGiven: { type: Number, default: 0 },
  responsivenessScore: { type: Number, default: 100 },
  contributionPoints: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('AlumniProfile', alumniProfileSchema);