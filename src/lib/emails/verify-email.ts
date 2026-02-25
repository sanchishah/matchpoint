/**
 * Email verification templates (HTML + plain-text).
 *
 * Follows the same brand styling as the welcome email.
 */

const SUPPORT_EMAIL = "support@matchpoint.app";
const COMPANY_ADDRESS_PLACEHOLDER = "MatchPoint HQ, South Bay, CA";

interface VerifyEmailTemplateVars {
  firstName: string;
  verifyUrl: string;
}

// ── Plain-text version ───────────────────────────────────

export function verifyEmailText({
  firstName,
  verifyUrl,
}: VerifyEmailTemplateVars): string {
  return `Hi ${firstName},

Thanks for signing up for MatchPoint! Please verify your email address to get started.

Click the link below to verify your email:
${verifyUrl}

This link will expire in 24 hours.

If you didn't create a MatchPoint account, you can safely ignore this email.

See you on court,
The MatchPoint Team

---
${SUPPORT_EMAIL} | ${COMPANY_ADDRESS_PLACEHOLDER}
`;
}

// ── HTML version ─────────────────────────────────────────

export function verifyEmailHtml({
  firstName,
  verifyUrl,
}: VerifyEmailTemplateVars): string {
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

            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Thanks for signing up for MatchPoint! Please verify your email address so we can confirm it&rsquo;s really you.</p>

            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Click the button below to verify your email:</p>

            <!-- CTA Button -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td align="center" style="background-color:#0B4F6C;border-radius:8px;">
                  <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Verify My Email</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748B;">This link will expire in 24 hours.</p>

            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#64748B;">If the button above doesn&rsquo;t work, copy and paste this URL into your browser:</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.5;color:#0B4F6C;word-break:break-all;">
              <a href="${verifyUrl}" style="color:#0B4F6C;text-decoration:underline;">${verifyUrl}</a>
            </p>

            <p style="margin:0 0 4px;font-size:16px;line-height:1.6;">See you on court,<br><strong>The MatchPoint Team</strong></p>

            <p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#64748B;">If you didn&rsquo;t create a MatchPoint account, you can safely ignore this email.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background-color:#f7f5f2;border-top:1px solid #e8e4df;">
            <p style="margin:0 0 6px;font-size:12px;color:#999999;line-height:1.5;">
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#64748B;text-decoration:none;">${SUPPORT_EMAIL}</a>
              &nbsp;&middot;&nbsp; ${COMPANY_ADDRESS_PLACEHOLDER}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
