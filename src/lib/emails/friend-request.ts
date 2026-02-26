const SUPPORT_EMAIL = "support@matchpoint.app";

export function friendRequestEmailHtml(firstName: string, senderName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
    <h1 style="font-family:'Georgia',serif;color:#0B4F6C;font-size:24px;margin-bottom:24px;">
      New Friend Request
    </h1>
    <p style="color:#333333;font-size:15px;line-height:1.6;">
      Hi ${firstName},
    </p>
    <p style="color:#333333;font-size:15px;line-height:1.6;">
      <strong>${senderName}</strong> sent you a friend request on Matchpoint!
      Connect to see each other's upcoming games and find more chances to play together.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.APP_BASE_URL || "http://localhost:3000"}/friends"
         style="display:inline-block;background-color:#0B4F6C;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:9999px;text-decoration:none;">
        View Request
      </a>
    </div>
    <p style="color:#64748B;font-size:13px;margin-top:30px;">
      Matchpoint &mdash; Where players meet their match.
    </p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
    <p style="color:#94A3B8;font-size:11px;line-height:1.5;">
      You received this email because you have a Matchpoint account.
      To manage email preferences, visit your
      <a href="${process.env.APP_BASE_URL || "http://localhost:3000"}/dashboard/settings" style="color:#0B4F6C;">settings</a>.
      <br />Questions? Contact ${SUPPORT_EMAIL}.
    </p>
  </div>
</body>
</html>`.trim();
}

export function friendRequestEmailText(firstName: string, senderName: string): string {
  return `Hi ${firstName},\n\n${senderName} sent you a friend request on Matchpoint! View it at ${process.env.APP_BASE_URL || "http://localhost:3000"}/friends\n\nMatchpoint - Where players meet their match.`;
}

export function friendAcceptedEmailHtml(firstName: string, accepterName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="font-family:'Inter',Helvetica,Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
    <h1 style="font-family:'Georgia',serif;color:#0B4F6C;font-size:24px;margin-bottom:24px;">
      Friend Request Accepted
    </h1>
    <p style="color:#333333;font-size:15px;line-height:1.6;">
      Hi ${firstName},
    </p>
    <p style="color:#333333;font-size:15px;line-height:1.6;">
      <strong>${accepterName}</strong> accepted your friend request!
      You can now see each other's upcoming games on Matchpoint.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.APP_BASE_URL || "http://localhost:3000"}/friends"
         style="display:inline-block;background-color:#0B4F6C;color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:9999px;text-decoration:none;">
        View Friends
      </a>
    </div>
    <p style="color:#64748B;font-size:13px;margin-top:30px;">
      Matchpoint &mdash; Where players meet their match.
    </p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
    <p style="color:#94A3B8;font-size:11px;line-height:1.5;">
      You received this email because you have a Matchpoint account.
      To manage email preferences, visit your
      <a href="${process.env.APP_BASE_URL || "http://localhost:3000"}/dashboard/settings" style="color:#0B4F6C;">settings</a>.
      <br />Questions? Contact ${SUPPORT_EMAIL}.
    </p>
  </div>
</body>
</html>`.trim();
}

export function friendAcceptedEmailText(firstName: string, accepterName: string): string {
  return `Hi ${firstName},\n\n${accepterName} accepted your friend request on Matchpoint! View your friends at ${process.env.APP_BASE_URL || "http://localhost:3000"}/friends\n\nMatchpoint - Where players meet their match.`;
}
