import AlumniProfile from '../models/AlumniProfile.js';

export const searchAlumni = async (req, res) => {
  try {
    const { company, jobRole, industry, skills } = req.query;
    
    let query = { verificationStatus: 'Approved' };
    if (company) query.company = { $regex: company, $options: 'i' };
    if (jobRole) query.jobRole = { $regex: jobRole, $options: 'i' };
    if (industry) query.industry = { $regex: industry, $options: 'i' };

    const alumni = await AlumniProfile.find(query)
      .populate('user', 'email graduationYear')
      .lean();

    const rankedAlumni = alumni.sort((a, b) => {
      let scoreA = (a.referralSuccessRate * 0.4) + (a.responsivenessScore * 0.4) + (a.contributionPoints * 0.2);
      let scoreB = (b.referralSuccessRate * 0.4) + (b.responsivenessScore * 0.4) + (b.contributionPoints * 0.2);
      
      if (skills) {
        const querySkills = skills.split(',').map(s => s.toLowerCase().trim());
        const aOverlap = a.skills.filter(s => querySkills.includes(s.toLowerCase())).length;
        const bOverlap = b.skills.filter(s => querySkills.includes(s.toLowerCase())).length;
        scoreA += (aOverlap * 10);
        scoreB += (bOverlap * 10);
      }
      
      return scoreB - scoreA;
    });

    res.status(200).json(rankedAlumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};