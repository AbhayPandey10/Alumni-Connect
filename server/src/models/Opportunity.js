import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  role: { type: String, required: true },
  company: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Full-Time', 'Internship', 'Contract', 'Freelance'],
    required: true 
  },
  eligibility: { type: String, required: true },
  deadline: { type: Date, required: true },
  applicationLink: { type: String },

  requiredSkills: [{ type: String }],
  description: { type: String },
  salary: { type: Number }, // annual CTC in LPA (optional) — powers salary analytics
  
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Anti-Spam / Tracking
  requestedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Opportunity', opportunitySchema);