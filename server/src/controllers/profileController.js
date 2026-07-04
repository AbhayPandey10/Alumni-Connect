import StudentProfile from '../models/StudentProfile.js';
import AlumniProfile from '../models/AlumniProfile.js';
import User from '../models/User.js';

export const upsertProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile;

    if (user.role === 'Student') {
      const { department, skills, projects, resumeUrl } = req.body;
      profile = await StudentProfile.findOneAndUpdate(
        { user: req.user.id },
        { user: req.user.id, department, graduationYear: user.graduationYear, skills, projects, resumeUrl },
        { new: true, upsert: true }
      );
    } else if (user.role === 'Alumni') {
      const { company, jobRole, industry, experienceYears, skills } = req.body;
      profile = await AlumniProfile.findOneAndUpdate(
        { user: req.user.id },
        { user: req.user.id, company, jobRole, industry, experienceYears, skills },
        { new: true, upsert: true }
      );
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = user.role === 'Student' 
      ? await StudentProfile.findOne({ user: req.user.id }).populate('user', 'email role')
      : await AlumniProfile.findOne({ user: req.user.id }).populate('user', 'email role');
      
    if (!profile) return res.status(404).json({ message: 'Profile not setup yet' });
    
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};