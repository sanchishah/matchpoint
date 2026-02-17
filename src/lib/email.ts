/**
 * Email service with provider abstraction.
 *
 * Current provider: **Resend** (default).
 *
 * To swap providers, implement the `EmailProvider` interface and set
 * `EMAIL_PROVIDER` env var accordingly. See the SendGridProvider /
 * SESProvider stubs below for guidance.
 *
 * Required env vars:
 *   RESEND_API_KEY   – Resend API key (required when using Resend)
 *   EMAIL_FROM       – Sender address, e.g. "Matchpoint <noreply@matchpoint.app>"
 *   EMAIL_PROVIDER   – (optional) "resend" | "sendgrid" | "ses". Defaults to "resend".
 *
 * To add SendGrid:
 *   1. npm install @sendgrid/mail
 *   2. Set SENDGRID_API_KEY env var
 *   3. Set EMAIL_PROVIDER=sendgrid
 *   4. Uncomment SendGridProvider below
 *
 * To add AWS SES:
 *   1. npm install @aws-sdk/client-ses
 *   2. Set standard AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 *   3. Set EMAIL_PROVIDER=ses
 *   4. Uncomment SESProvider below
 */

import { Resend } from "resend";

// ── Provider interface ───────────────────────────────────

export interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(payload: EmailPayload): Promise<void>;
}

// ── Resend provider (default) ────────────────────────────

class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send({ from, to, subject, html, text }: EmailPayload): Promise<void> {
    await this.client.emails.send({ from, to, subject, html, text });
  }
}

// ── SendGrid provider (stub — uncomment when needed) ─────
//
// import sgMail from "@sendgrid/mail";
//
// class SendGridProvider implements EmailProvider {
//   constructor(apiKey: string) {
//     sgMail.setApiKey(apiKey);
//   }
//   async send({ from, to, subject, html, text }: EmailPayload): Promise<void> {
//     await sgMail.send({ from, to, subject, html, text });
//   }
// }

// ── AWS SES provider (stub — uncomment when needed) ──────
//
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
//
// class SESProvider implements EmailProvider {
//   private client: SESClient;
//   constructor() {
//     this.client = new SESClient({});
//   }
//   async send({ from, to, subject, html, text }: EmailPayload): Promise<void> {
//     await this.client.send(new SendEmailCommand({
//       Source: from,
//       Destination: { ToAddresses: [to] },
//       Message: {
//         Subject: { Data: subject },
//         Body: {
//           Html: { Data: html },
//           ...(text ? { Text: { Data: text } } : {}),
//         },
//       },
//     }));
//   }
// }

// ── Provider factory ─────────────────────────────────────

function createProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();

  switch (provider) {
    case "resend":
      return new ResendProvider(process.env.RESEND_API_KEY || "");
    // case "sendgrid":
    //   return new SendGridProvider(process.env.SENDGRID_API_KEY || "");
    // case "ses":
    //   return new SESProvider();
    default:
      return new ResendProvider(process.env.RESEND_API_KEY || "");
  }
}

const emailProvider = createProvider();
const from = process.env.EMAIL_FROM || "Matchpoint <noreply@matchpoint.app>";

// ── Public API ───────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    await emailProvider.send({ from, to, subject, html, text });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

// ── Existing template helpers (unchanged) ────────────────

export function gameConfirmedEmail(playerName: string, clubName: string, dateStr: string, amount: string) {
  return {
    subject: "Your game is confirmed!",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: 'Georgia', serif; color: #0B4F6C; font-size: 24px;">Game Confirmed</h1>
        <p style="color: #333333;">Hi ${playerName},</p>
        <p style="color: #333333;">Great news! Your game at <strong>${clubName}</strong> on <strong>${dateStr}</strong> is confirmed.</p>
        <p style="color: #333333;">Your share: <strong>${amount}</strong> has been charged.</p>
        <p style="color: #333333;">Chat opens 15 minutes before your game. See you on the court!</p>
        <p style="color: #64748B; font-size: 13px; margin-top: 30px;">Matchpoint &mdash; Where players meet their match.</p>
      </div>
    `,
  };
}

export function spotReservedEmail(playerName: string, clubName: string, dateStr: string) {
  return {
    subject: "Spot reserved — waiting for players",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: 'Georgia', serif; color: #0B4F6C; font-size: 24px;">Spot Reserved</h1>
        <p style="color: #333333;">Hi ${playerName},</p>
        <p style="color: #333333;">You've reserved a spot at <strong>${clubName}</strong> on <strong>${dateStr}</strong>.</p>
        <p style="color: #333333;">We're waiting for more players to fill the game. You'll only be charged once confirmed.</p>
        <p style="color: #64748B; font-size: 13px; margin-top: 30px;">Matchpoint &mdash; Where players meet their match.</p>
      </div>
    `,
  };
}

export function reminderEmail(playerName: string, clubName: string, dateStr: string, hoursUntil: number) {
  return {
    subject: `Reminder: Game in ${hoursUntil} hours`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: 'Georgia', serif; color: #0B4F6C; font-size: 24px;">Game Reminder</h1>
        <p style="color: #333333;">Hi ${playerName},</p>
        <p style="color: #333333;">Your game at <strong>${clubName}</strong> on <strong>${dateStr}</strong> starts in <strong>${hoursUntil} hours</strong>.</p>
        <p style="color: #333333;">Get ready to play!</p>
        <p style="color: #64748B; font-size: 13px; margin-top: 30px;">Matchpoint &mdash; Where players meet their match.</p>
      </div>
    `,
  };
}

export function chatOpenEmail(playerName: string, clubName: string) {
  return {
    subject: "Chat is now open for your game",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-family: 'Georgia', serif; color: #0B4F6C; font-size: 24px;">Chat Open</h1>
        <p style="color: #333333;">Hi ${playerName},</p>
        <p style="color: #333333;">The game chat for your match at <strong>${clubName}</strong> is now open. Coordinate with your fellow players!</p>
        <p style="color: #64748B; font-size: 13px; margin-top: 30px;">Matchpoint &mdash; Where players meet their match.</p>
      </div>
    `,
  };
}
