import mongoose from 'mongoose';

const referralRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  message: { type: String, required: true },
  resumeUrl: { type: String },
  
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Referred', 'Interviewing', 'Hired', 'Rejected'],
    default: 'Pending'
  },
  
  statusHistory: [{
    status: { type: String },
    note: { type: String },
    updatedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('ReferralRequest', referralRequestSchema);