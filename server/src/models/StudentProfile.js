import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  university: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  major: { type: String, required: true },
  skills: [{ type: String }],
  githubUrl: { type: String },
  portfolioUrl: { type: String },
  
  projects: [{
    title: { type: String },
    techStack: [{ type: String }],
    description: { type: String },
    link: { type: String }
  }],
  resumeUrl: { type: String } 
}, { timestamps: true });

export default mongoose.model('StudentProfile', studentProfileSchema);