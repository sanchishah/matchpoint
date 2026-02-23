const SUPPORT_EMAIL = "support@matchpoint.app";

interface PasswordResetTemplateVars {
  firstName: string;
  resetUrl: string;
}

export function passwordResetEmailText({
  firstName,
  resetUrl,
}: PasswordResetTemplateVars): string {
  return `Hi ${firstName},

We received a request to reset your MatchPoint password.

Click the link below to set a new password (expires in 1 hour):
${resetUrl}

If you didn't request this, you can safely ignore this email — your password won't change.

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL}
`;
}

export function passwordResetEmailHtml({
  firstName,
  resetUrl,
}: PasswordResetTemplateVars): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f7f5f2;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f2;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#0B4F6C;padding:32px 32px 24px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#ffffff;font-weight:700;">MatchPoint</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${firstName},</p>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">We received a request to reset your MatchPoint password.</p>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td align="center" style="background-color:#0B4F6C;border-radius:8px;">
                  <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Reset Password</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">If you didn&rsquo;t request this, you can safely ignore this email &mdash; your password won&rsquo;t change.</p>

            <p style="margin:0 0 4px;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
            <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748B;text-decoration:none;">${SUPPORT_EMAIL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
