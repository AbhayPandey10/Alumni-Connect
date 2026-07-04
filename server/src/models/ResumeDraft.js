import mongoose from 'mongoose';

const resumeDraftSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  contact: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
  education: [{
    institution: String,
    degree: String,
    year: String,
    gpa: String
  }],
  experience: [{
    company: String,
    role: String,
    duration: String,
    description: String
  }],
  projects: [{
    title: String,
    description: String,
    techStack: String
  }],
  skills: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('ResumeDraft', resumeDraftSchema);