import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  actionUrl,
  relatedEntityModel,
  relatedEntityId,
  recipientEmail // optional: pass when the caller already has the email (avoids a lookup)
}) => {
  try {
    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      actionUrl,
      relatedEntityModel,
      relatedEntityId
    });

    await notification.save();

    // Mirror to email — non-blocking and dev-safe (logs when SMTP isn't configured)
    (async () => {
      let email = recipientEmail;
      if (!email) {
        const user = await User.findById(recipient).select('email');
        email = user?.email;
      }
      if (!email) return;
      const link = actionUrl ? `${CLIENT_URL}${actionUrl}` : null;
      sendEmail({
        to: email,
        subject: `AlumniConnect · ${title}`,
        text: `${message}${link ? `\n\nOpen: ${link}` : ''}`,
        html: `<p>${message}</p>${link ? `<p><a href="${link}">Open in AlumniConnect</a></p>` : ''}`,
      });
    })().catch((err) => console.error('Email mirror failed:', err.message));

    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error);
    throw error;
  }
};
