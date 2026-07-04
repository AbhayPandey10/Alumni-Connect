import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: { type: String, required: true },
  targetCompany: { type: String },
  skillsToAcquire: [{ type: String }],
  certifications: [{ type: String }],
  timeline: [{
    phase: String,
    focus: String,
    actionItems: [{ type: String }]
  }]
}, { timestamps: true });

export default mongoose.model('CareerRoadmap', roadmapSchema);