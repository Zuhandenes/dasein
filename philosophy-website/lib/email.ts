/** Отправка писем: Resend (если задан ключ) или SMTP через nodemailer. */

import { env, isEmailEnabled } from "@/lib/env";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function sendViaResend(mail: Mail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mail.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.mail.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });
  if (!res.ok) {
    console.error("[email] resend failed:", res.status, await res.text());
  }
}

async function sendViaSmtp(mail: Mail): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: env.mail.smtpHost,
    port: env.mail.smtpPort,
    secure: env.mail.smtpPort === 465,
    auth: { user: env.mail.smtpUser, pass: env.mail.smtpPass },
  });
  await transport.sendMail({
    from: env.mail.from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendEmail(mail: Mail): Promise<void> {
  if (!mail.to) return;
  if (env.testMode || !isEmailEnabled()) {
    console.info(`[email] (not sent) → ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  try {
    if (env.mail.resendApiKey) {
      await sendViaResend(mail);
    } else {
      await sendViaSmtp(mail);
    }
  } catch (err) {
    console.error("[email] send error:", err);
  }
}
