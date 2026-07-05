// Send a test email to verify SMTP (Gmail) is configured correctly.
// Usage:  node scripts/testEmail.js                 (sends to EMAIL_USER)
//         node scripts/testEmail.js you@example.com  (sends to a specific address)
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const to = process.argv[2] || process.env.EMAIL_USER;

if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
  console.error('✗ EMAIL_HOST / EMAIL_USER not set in .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

try {
  await transporter.verify();
  console.log('✓ SMTP connection & authentication OK');

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: 'AlumniConnect · test email',
    text: 'If you can read this, Gmail SMTP is working. 🎉',
    html: '<p>If you can read this, <b>Gmail SMTP is working</b>. 🎉</p>',
  });

  console.log(`✓ Sent to ${to}  (messageId: ${info.messageId})`);
} catch (error) {
  console.error('✗ Email test failed:', error.message);
}

process.exit(0);
