import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: { type: String, required: true },
  targetCompany: { type: String },

  summary: { type: String },

  skillsToAcquire: [{
    skill: { type: String },
    reason: { type: String },
    priority: { type: String } // High | Medium | Low
  }],

  certifications: [{
    name: { type: String },
    provider: { type: String }
  }],

  learningResources: [{
    title: { type: String },
    type: { type: String }, // Course | Book | Documentation | Video | Practice
    provider: { type: String }
  }],

  projectSuggestions: [{
    title: { type: String },
    description: { type: String },
    skills: [{ type: String }]
  }],

  timeline: [{
    phase: String,
    focus: String,
    actionItems: [{ type: String }]
  }]
}, { timestamps: true });

export default mongoose.model('CareerRoadmap', roadmapSchema);
