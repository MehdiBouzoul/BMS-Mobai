import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendInvitationEmail(
  email: string,
  name: string,
  invitationToken: string
) {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${invitationToken}`;

  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Warehouse Management System - Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f4f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f4f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #08677A 0%, #0a8299 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Warehouse Management System
              </h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">
                You've been invited to join our team
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1c1e; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">
                Hello ${name}! 👋
              </h2>
              
              <p style="color: #64748b; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                You have been invited to join our Warehouse Management System. Click the button below to accept your invitation and set up your password.
              </p>
              
              <p style="color: #64748b; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                This invitation will expire in <strong>7 days</strong>.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${invitationUrl}" style="display: inline-block; background-color: #08677A; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(8, 103, 122, 0.2);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${invitationUrl}" style="color: #08677A; word-break: break-all;">${invitationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px; line-height: 1.6;">
                This is an automated message from Warehouse Management System
                <br>
                If you didn't expect this invitation, please ignore this email.
              </p>
              <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 11px;">
                © ${new Date().getFullYear()} Warehouse Management System. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textTemplate = `
Warehouse Management System - Invitation

Hello ${name}!

You have been invited to join our Warehouse Management System.

Click the link below to accept your invitation and set up your password:
${invitationUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, please ignore this email.

© ${new Date().getFullYear()} Warehouse Management System. All rights reserved.
  `;

  await transporter.sendMail({
    from: `"Warehouse Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🎉 You\'re invited to join Warehouse Management System',
    text: textTemplate,
    html: htmlTemplate,
  });
}
