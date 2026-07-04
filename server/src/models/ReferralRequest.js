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
    ref: 'Opportunity'
  },
  message: { type: String, required: true },
  resumeUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Referred', 'Rejected'],
    default: 'Pending'
  },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String } 
  }]
}, { timestamps: true });

export default mongoose.model('ReferralRequest', referralRequestSchema);