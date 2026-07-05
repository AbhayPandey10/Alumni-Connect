import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['System', 'Referral_Update', 'New_Opportunity', 'Badge_Status', 'Connection'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },

  actionUrl: { type: String }, 

  relatedEntityModel: { type: String, enum: ['Opportunity', 'ReferralRequest', 'VerificationRequest', 'Connection'] },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId },
  
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);