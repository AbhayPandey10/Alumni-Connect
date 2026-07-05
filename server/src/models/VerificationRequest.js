import mongoose from 'mongoose';

const verificationRequestSchema = new mongoose.Schema({
  alumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyEmail: { 
    type: String, 
    required: true 
  },
  documentUrl: { 
    type: String // Optional link to an ID card or offer letter upload
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminNotes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('VerificationRequest', verificationRequestSchema);