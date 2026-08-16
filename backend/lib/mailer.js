let nodemailerInstance = null;

async function getTransporter() {
  if (nodemailerInstance) return nodemailerInstance;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user) {
    return null; // SMTP credentials unconfigured
  }

  try {
    const nodemailer = await import('nodemailer');
    nodemailerInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return nodemailerInstance;
  } catch (err) {
    console.warn('Nodemailer import failed, falling back to log mailer:', err.message);
    return null;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return false;

  const fromEmail = process.env.FROM_EMAIL || 'no-reply@smartstudenthub.edu';
  const transporter = await getTransporter();

  if (!transporter) {
    console.log(`[EMAIL LOG FALLBACK] To: ${to} | Subject: ${subject}\nText: ${text || html}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `CampusSphere <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ''),
      html,
    });
    console.log(`[EMAIL SENT] Transmitted email to ${to} via SMTP.`);
    return true;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    return false;
  }
}
