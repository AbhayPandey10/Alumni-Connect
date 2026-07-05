import express from 'express';
import {
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  deleteResume,
  getAlumniProfile,
  updateAlumniProfile,
  searchAlumniProfiles,
  getRecommendedAlumni,
  getPublicProfile
} from '../controllers/profileController.js';
import { protect } from '../middleware/verifyJWT.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Resume routes come before '/student/:userId' isn't an issue (different methods),
// but keep the specific resume routes grouped for clarity.
router.post('/student/resume', protect, upload.single('resume'), uploadResume);
router.delete('/student/resume', protect, deleteResume);

router.get('/view/:userId', protect, getPublicProfile);

router.get('/student/:userId', protect, getStudentProfile);
router.put('/student', protect, updateStudentProfile);

router.get('/alumni', protect, searchAlumniProfiles);
router.get('/alumni/recommended', protect, getRecommendedAlumni);
router.get('/alumni/:userId', protect, getAlumniProfile);
router.put('/alumni', protect, updateAlumniProfile);

export default router;
