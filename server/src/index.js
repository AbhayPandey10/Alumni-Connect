import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import careerGuidanceRoutes from './routes/careerGuidanceRoutes.js';
import resumeBuilderRoutes from './routes/resumeBuilderRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files (e.g. student resumes) at /uploads/*
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/career-guidance', careerGuidanceRoutes);
app.use('/api/resume-builder', resumeBuilderRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/connections', connectionRoutes);

app.get('/', (req, res) => {
  res.send('AlumniConnect API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));