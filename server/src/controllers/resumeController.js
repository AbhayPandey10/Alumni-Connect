import pdfParse from 'pdf-parse-debugging-disabled';
import { analyzeResumeWithAI, generateReferralMessageWithAI } from '../services/aiService.js';
import StudentProfile from '../models/StudentProfile.js';


export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF resume' });
    }

    const { targetRole } = req.body;
    if (!targetRole) {
      return res.status(400).json({ message: 'Target role is required' });
    }

    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    const analysis = await analyzeResumeWithAI(resumeText, targetRole);

    if (req.user && req.user.role === 'Student') {
      await StudentProfile.findOneAndUpdate(
        { user: req.user.id },
        { atsScore: analysis.atsScore }
      );
    }

    res.status(200).json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const generateMessage = async (req, res) => {
  try {
    const { studentDetails, alumniDetails, opportunityDetails, messageType } = req.body;

    const message = await generateReferralMessageWithAI(
      studentDetails,
      alumniDetails,
      opportunityDetails,
      messageType
    );

    res.status(200).json({ generatedMessage: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};