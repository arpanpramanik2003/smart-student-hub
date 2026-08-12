import { initDB } from './database.js';
import { sendEmail } from './mailer.js';

export async function createNotification({ userId, type, title, message, activityId = null }) {
  try {
    const { Notification, User } = await initDB();

    const notif = await Notification.create({
      userId,
      type,
      title,
      message,
      activityId,
      isRead: false,
    });

    // Send email for high-value transactional events
    const HIGH_VALUE_EVENTS = ['activity_approved', 'activity_rejected', 'mentee_submission'];
    if (HIGH_VALUE_EVENTS.includes(type)) {
      const recipient = await User.findByPk(userId, { attributes: ['email', 'name'] });
      if (recipient?.email) {
        const subject = `[Smart Student Hub] ${title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #18181b;">
            <h2 style="color: #4f46e5;">Smart Student Hub</h2>
            <p>Dear ${recipient.name},</p>
            <p>${message}</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="font-size: 12px; color: #71717a;">This is an automated notification from your institution's Smart Student Hub.</p>
          </div>
        `;
        // Non-blocking async email sending
        sendEmail({ to: recipient.email, subject, html, text: message }).catch(err => {
          console.error('Async sendEmail error:', err);
        });
      }
    }

    return notif;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

export async function notifyAdmins({ type, title, message, activityId = null }) {
  try {
    const { User } = await initDB();
    const admins = await User.findAll({ where: { role: 'admin', isActive: true }, attributes: ['id'] });
    
    await Promise.all(
      admins.map(admin => createNotification({ userId: admin.id, type, title, message, activityId }))
    );
  } catch (error) {
    console.error('Notify admins error:', error);
  }
}
