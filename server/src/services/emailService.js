import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load env here too — this module is imported (via the route/controller chain)
// before index.js runs dotenv.config(), so we must ensure vars are available.
dotenv.config();

// Real email is sent only when SMTP is configured via env vars. Otherwise we
// use a no-op JSON transport and log what *would* have been sent — so the
// feature is fully testable locally without a mail provider or real inboxes.
const smtpConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });

const FROM = process.env.EMAIL_FROM || 'AlumniConnect <no-reply@alumniconnect.local>';

console.log(`[email] mode: ${smtpConfigured ? 'SMTP (live)' : 'dev (console only)'}`);

// Fire-and-forget: never throws into the caller, never blocks the request.
export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;
  try {
    await transporter.sendMail({ from: FROM, to, subject, text, html });
    if (!smtpConfigured) {
      console.log(`[email:dev] → ${to} · "${subject}"`);
    }
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};
