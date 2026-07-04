import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import careerGuidanceRoutes from './routes/careerGuidanceRoutes.js';
import resumeBuilderRoutes from './routes/resumeBuilderRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/career-guidance', careerGuidanceRoutes);
app.use('/api/resume-builder', resumeBuilderRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/', (req, res) => {
  res.send('AlumniConnect API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));