import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: { type: String, required: true },
  role: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Internship', 'Full-Time', 'Contract'], 
    required: true 
  },
  eligibility: { type: String, required: true }, 
  requiredSkills: [{ type: String }],
  deadline: { type: Date, required: true },
  applicationLink: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  requestedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

export default mongoose.model('Opportunity', opportunitySchema);