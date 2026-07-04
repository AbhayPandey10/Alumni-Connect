import ResumeDraft from '../models/ResumeDraft.js';
import { generateResumePDF } from '../services/pdfGeneratorService.js';

export const saveDraft = async (req, res) => {
  try {
    const draft = await ResumeDraft.findOneAndUpdate(
      { student: req.user.id },
      { ...req.body, student: req.user.id },
      { returnDocument: 'after', upsert: true }
    );
    res.status(200).json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDraft = async (req, res) => {
  try {
    const draft = await ResumeDraft.findOne({ student: req.user.id });
    if (!draft) return res.status(200).json({});
    res.status(200).json(draft);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportPdf = async (req, res) => {
  try {
    const draft = await ResumeDraft.findOne({ student: req.user.id }).lean();
    if (!draft) return res.status(404).json({ message: 'No draft found to export' });

    const safeData = {
      contact: draft.contact || { fullName: '', email: '', phone: '', linkedin: '' },
      skills: draft.skills || '',
      experience: draft.experience || [],
      projects: draft.projects || [],
      education: draft.education || []
    };

    const pdfBuffer = await generateResumePDF(safeData);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Resume.pdf"',
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};