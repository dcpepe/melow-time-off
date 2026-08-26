import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/app-url";

const transporter =
  process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[Email] SMTP not configured. Would send to ${to}: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@melow.ai",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[Email] Failed to send:", error);
  }
}

export async function sendRequestSubmittedEmail(
  adminEmails: string[],
  requesterName: string,
  startDate: string,
  endDate: string,
  workingDays: number,
  note?: string
) {
  const appUrl = await getAppUrl();
  const subject = `New time off request from ${requesterName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px;">
      <h2 style="color: #F5A623;">New Time Off Request</h2>
      <p><strong>${requesterName}</strong> has requested time off:</p>
      <ul>
        <li><strong>Dates:</strong> ${startDate} to ${endDate}</li>
        <li><strong>Working days:</strong> ${workingDays}</li>
        ${note ? `<li><strong>Note:</strong> ${note}</li>` : ""}
      </ul>
      <p><a href="${appUrl}/admin/pending">Review request</a></p>
    </div>
  `;

  for (const email of adminEmails) {
    await sendEmail(email, subject, html);
  }
}

export async function sendRequestReviewedEmail(
  requesterEmail: string,
  requesterName: string,
  status: "APPROVED" | "REJECTED",
  startDate: string,
  endDate: string,
  adminNote?: string
) {
  const appUrl = await getAppUrl();
  const statusText = status === "APPROVED" ? "approved" : "rejected";
  const statusColor = status === "APPROVED" ? "#4ECDC4" : "#FF6B6B";

  const subject = `Your time off request has been ${statusText}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px;">
      <h2 style="color: ${statusColor};">Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</h2>
      <p>Hi ${requesterName},</p>
      <p>Your time off request for <strong>${startDate} to ${endDate}</strong> has been <strong style="color: ${statusColor};">${statusText}</strong>.</p>
      ${adminNote ? `<p><strong>Note from admin:</strong> ${adminNote}</p>` : ""}
      <p><a href="${appUrl}/my-time-off">View your requests</a></p>
    </div>
  `;

  await sendEmail(requesterEmail, subject, html);
}
