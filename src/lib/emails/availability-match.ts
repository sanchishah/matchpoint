import { CONTACT_EMAIL } from "@/lib/constants";

const SUPPORT_EMAIL = "support@mymatchpoint.com";

interface AvailabilityMatchVars {
  firstName: string;
  clubName: string;
  dateStr: string;
  bookUrl: string;
}

export function availabilityMatchEmailHtml({ firstName, clubName, dateStr, bookUrl }: AvailabilityMatchVars): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f7f5f2;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background-color:#0B4F6C;padding:32px 32px 24px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#ffffff;font-weight:700;">MatchPoint</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">A game matching your availability just opened up!</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;"><strong>${clubName}</strong> on <strong>${dateStr}</strong></p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr>
              <td align="center" style="background-color:#0B4F6C;border-radius:8px;">
                <a href="${bookUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Reserve Your Spot</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748B;">Spots fill up fast &mdash; don&rsquo;t miss out!</p>
          <p style="margin:0;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748B;text-decoration:none;">${SUPPORT_EMAIL}</a>
              &nbsp;&middot;&nbsp; Contact: ${CONTACT_EMAIL}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function availabilityMatchEmailText({ firstName, clubName, dateStr, bookUrl }: AvailabilityMatchVars): string {
  return `Hi ${firstName},

A game matching your availability just opened up!

${clubName} on ${dateStr}

Reserve your spot: ${bookUrl}

Spots fill up fast - don't miss out!

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL} · Contact: ${CONTACT_EMAIL}
`;
}
