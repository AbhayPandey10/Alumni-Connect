import CareerRoadmap from '../models/CareerRoadmap.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateCareerRoadmapWithAI, generateInterviewPrepWithAI } from '../services/aiService.js';

export const generateRoadmap = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can generate roadmaps' });
    }

    const { targetRole, targetCompany } = req.body;

    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({ message: 'A target role is required' });
    }

    // Fetch student's current skills
    const profile = await StudentProfile.findOne({ user: req.user.id });
    const currentSkills = profile ? profile.skills : [];

    // Generate Roadmap using Gemini
    const roadmapData = await generateCareerRoadmapWithAI(currentSkills, targetRole, targetCompany);

    // Save to Database
    const newRoadmap = await CareerRoadmap.create({
      student: req.user.id,
      targetRole,
      targetCompany,
      summary: roadmapData.summary,
      skillsToAcquire: roadmapData.skillsToAcquire,
      certifications: roadmapData.certifications,
      learningResources: roadmapData.learningResources,
      projectSuggestions: roadmapData.projectSuggestions,
      timeline: roadmapData.timeline
    });

    // Link roadmap to profile
    if (profile) {
      profile.careerRoadmapRef = newRoadmap._id;
      await profile.save();
    }

    res.status(201).json(newRoadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateInterviewPrep = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ message: 'Only students can use interview prep' });
    }

    const { targetRole, targetCompany, experienceLevel } = req.body;
    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({ message: 'A target role is required' });
    }

    const profile = await StudentProfile.findOne({ user: req.user.id });
    const skills = profile ? profile.skills : [];

    const data = await generateInterviewPrepWithAI({
      targetRole: targetRole.trim(),
      targetCompany: targetCompany?.trim() || 'Any',
      skills,
      experienceLevel: experienceLevel || 'Entry-level',
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyRoadmap = async (req, res) => {
  try {
    const roadmap = await CareerRoadmap.findOne({ student: req.user.id }).sort({ createdAt: -1 });
    if (!roadmap) {
      return res.status(404).json({ message: 'No roadmap found' });
    }
    res.status(200).json(roadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};