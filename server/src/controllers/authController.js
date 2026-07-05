import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/emailService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ALLOWED_DOMAIN = '@nitjsr.ac.in';
const OTP_TTL_MIN = 10;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Assign a fresh OTP to the user, email it, and (for local testing) log it.
const issueOtp = async (user) => {
  const code = generateOtp();
  user.verificationCode = code;
  user.verificationExpires = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  await user.save();

  console.log(`[otp] ${user.email} → ${code}`); // dev aid: complete login even without inbox access

  sendEmail({
    to: user.email,
    subject: 'AlumniConnect · Your verification code',
    text: `Your AlumniConnect verification code is ${code}. It expires in ${OTP_TTL_MIN} minutes.`,
    html: `<p>Your AlumniConnect verification code is:</p>
           <p style="font-size:26px;font-weight:bold;letter-spacing:6px;margin:12px 0">${code}</p>
           <p style="color:#5e5e5e">It expires in ${OTP_TTL_MIN} minutes. If you didn't request this, you can ignore it.</p>`,
  });
};

const publicUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  username: user.username,
  email: user.email,
  role: user.role,
  graduationYear: user.graduationYear,
  isEmailVerified: user.isEmailVerified,
  token: generateToken(user._id),
});

export const registerUser = async (req, res) => {
  const { firstName, lastName, username, email, password, graduationYear } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already exists' });

    const usernameExists = await User.findOne({ username });
    if (usernameExists) return res.status(400).json({ message: 'Username is already taken' });

    const currentYear = new Date().getFullYear();
    const role = graduationYear > currentYear ? 'Student' : 'Alumni';

    const user = await User.create({ firstName, lastName, username, email, password, graduationYear, role });

    // Require email verification before issuing a session
    await issueOtp(user);
    res.status(201).json({ verificationRequired: true, email: user.email, message: 'Verification code sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // First-time (unverified) accounts must confirm a one-time code.
    // Once verified, logins proceed normally.
    if (!user.isEmailVerified) {
      await issueOtp(user);
      return res.status(200).json({ verificationRequired: true, email: user.email, message: 'Verification code sent to your email.' });
    }

    res.status(200).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid request' });

    if (!user.verificationCode || !user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Your code has expired. Please request a new one.' });
    }
    if (user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.status(200).json(publicUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid request' });
    await issueOtp(user);
    res.status(200).json({ message: 'A new verification code has been sent.', email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const googleAuth = async (req, res) => {
  const { token, graduationYear, username } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, given_name, family_name } = ticket.getPayload();

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      return res.status(403).json({ message: `Please use your valid ${ALLOWED_DOMAIN} email address.` });
    }

    let user = await User.findOne({ email });

    if (!user) {
      if (!graduationYear || !username) {
        return res.status(404).json({
          message: 'First-time users must provide a Graduation Year and a Username on the Register page.'
        });
      }

      const usernameExists = await User.findOne({ username });
      if (usernameExists) return res.status(400).json({ message: 'Username is already taken' });

      const currentYear = new Date().getFullYear();
      const role = graduationYear > currentYear ? 'Student' : 'Alumni';

      user = await User.create({
        firstName: given_name,
        lastName: family_name,
        username,
        email,
        graduationYear,
        role,
        isEmailVerified: true, // Google already verified ownership of the email
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      });
    }

    // Google sign-in is trusted — no OTP step needed
    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};
