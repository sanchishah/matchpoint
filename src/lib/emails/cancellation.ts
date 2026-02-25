const SUPPORT_EMAIL = "support@matchpoint.app";

interface CancellationTemplateVars {
  firstName: string;
  clubName: string;
  dateStr: string;
}

export function gameCancelledEmailHtml({ firstName, clubName, dateStr }: CancellationTemplateVars): string {
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
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Unfortunately, your game at <strong>${clubName}</strong> on <strong>${dateStr}</strong> has been cancelled.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">If you had already paid, a refund will be processed automatically. You should see it in your account within 5&ndash;10 business days.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We hope to see you on the court soon!</p>
          <p style="margin:0;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748B;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function gameCancelledEmailText({ firstName, clubName, dateStr }: CancellationTemplateVars): string {
  return `Hi ${firstName},

Unfortunately, your game at ${clubName} on ${dateStr} has been cancelled.

If you had already paid, a refund will be processed automatically. You should see it in your account within 5-10 business days.

We hope to see you on the court soon!

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL}
`;
}

interface RefundTemplateVars {
  firstName: string;
  clubName: string;
  amount: string;
}

export function refundConfirmationEmailHtml({ firstName, clubName, amount }: RefundTemplateVars): string {
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
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Your refund of <strong>${amount}</strong> for your game at <strong>${clubName}</strong> has been processed.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Please allow 5&ndash;10 business days for the refund to appear in your account.</p>
          <p style="margin:0;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>
        </td></tr>
        <tr><td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
          <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748B;text-decoration:none;">${SUPPORT_EMAIL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function refundConfirmationEmailText({ firstName, clubName, amount }: RefundTemplateVars): string {
  return `Hi ${firstName},

Your refund of ${amount} for your game at ${clubName} has been processed.

Please allow 5-10 business days for the refund to appear in your account.

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL}
`;
}
