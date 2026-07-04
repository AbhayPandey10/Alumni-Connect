import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  department: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  skills: [{ type: String }],
  projects: [{
    title: String,
    description: String,
    techStack: [String],
    link: String
  }],
  resumeUrl: { type: String, default: '' },
  atsScore: { type: Number, default: 0 },
  careerRoadmapRef: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerRoadmap' }
}, { timestamps: true });

export default mongoose.model('StudentProfile', studentProfileSchema);