import nodemailer from "nodemailer";

function appUrl() {
  return (process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`).replace(/\/$/, "");
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: process.env.SMTP_SECURE === "true", auth: { user, pass } });
}

async function sendLinkEmail(to: string, subject: string, heading: string, text: string, path: string) {
  const url = `${appUrl()}${path}`;
  const transport = createTransport();
  if (!transport) {
    console.info(`[Email:development] ${subject} for ${to}: ${url}`);
    return { delivered: false, url };
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text: `${heading}\n\n${text}\n\n${url}\n\nThis link expires soon. If you did not request this, you can ignore this email.`,
    html: `<h2>${heading}</h2><p>${text}</p><p><a href="${url}">Continue</a></p><p>This link expires soon. If you did not request this, you can ignore this email.</p>`,
  });
  return { delivered: true, url };
}

export function sendVerificationEmail(to: string, token: string) {
  return sendLinkEmail(to, "Verify your Faithful Hearts email", "Verify your email address", "Please verify your email to keep your account secure.", `/verify-email?token=${encodeURIComponent(token)}`);
}

export function sendPasswordResetEmail(to: string, token: string) {
  return sendLinkEmail(to, "Reset your Faithful Hearts password", "Reset your password", "We received a request to reset your Faithful Hearts password.", `/reset-password?token=${encodeURIComponent(token)}`);
}
