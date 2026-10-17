import nodemailer from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'smtp' | 'sendgrid' | 'brevo' | 'postmark' | 'none';
  messageId?: string;
  error?: string;
}

/**
 * Checks whether any supported transactional email provider is configured.
 */
export function isEmailServiceConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && (process.env.SMTP_USER || process.env.SMTP_PASS || process.env.SMTP_PASSWORD)) ||
    process.env.SENDGRID_API_KEY ||
    process.env.BREVO_API_KEY ||
    process.env.POSTMARK_SERVER_TOKEN
  );
}

/**
 * Returns the active email provider name for logging and diagnostic reporting.
 */
export function getActiveEmailProvider(): 'resend' | 'smtp' | 'sendgrid' | 'brevo' | 'postmark' | 'none' {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_HOST) return 'smtp';
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.BREVO_API_KEY) return 'brevo';
  if (process.env.POSTMARK_SERVER_TOKEN) return 'postmark';
  return 'none';
}

function getSenderAddress(): string {
  return (
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SENDGRID_FROM ||
    process.env.BREVO_FROM ||
    process.env.POSTMARK_FROM ||
    process.env.SMTP_USER ||
    'FAWNIC <otp@fawnic.store>'
  );
}

/**
 * Generates the luxury branded HTML email template for password reset OTP.
 */
function buildPasswordResetHtml(code: string, recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName},` : 'Valued Patron,';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e7e5e4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0a09; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Top Header -->
          <tr>
            <td style="padding: 36px 36px 24px; text-align: center; border-bottom: 1px solid #292524; background: radial-gradient(ellipse at top, #292524, #1c1917);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #d97706; color: #ffffff; font-weight: 900; font-size: 20px; font-family: serif; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);">
                F
              </div>
              <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.25em; text-transform: uppercase; color: #f5f5f4; font-weight: 700;">
                FAWNIC
              </h1>
              <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #a8a29e;">
                Leather Atelier & Marketplace Pakistan
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; color: #fafaf9; font-weight: 600; letter-spacing: -0.01em;">
                Password Reset Verification
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #d6d3d1;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #d6d3d1;">
                We received a request to reset your password for your FAWNIC account. Please use the six-digit verification code below to authorize this request:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="background: #292524; border: 1px solid #44403c; border-radius: 14px; padding: 24px 20px;">
                    <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">
                      Your Verification Code
                    </div>
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #fafaf9; font-family: 'Courier New', Courier, monospace; padding-left: 12px;">
                      ${code}
                    </div>
                    <div style="font-size: 11px; color: #a8a29e; margin-top: 8px;">
                      Expires in 15 minutes • Single-use security code
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <div style="background: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fde68a;">
                  <strong>Security Note:</strong> Never share this code with anyone. FAWNIC staff and representatives will never request this verification code from you.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #a8a29e;">
                If you did not request a password reset, you can safely ignore this email. Your existing credentials remain secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 36px; border-top: 1px solid #292524; background: #141210; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #78716c;">
                FAWNIC Atelier • Lahore & Karachi, Pakistan
              </p>
              <p style="margin: 0; font-size: 11px; color: #78716c;">
                Need assistance? Contact our concierge at <a href="mailto:support@fawnic.pk" style="color: #d97706; text-decoration: none;">support@fawnic.pk</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetText(code: string, recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName},` : 'Valued Patron,';
  return `${greeting}

We received a request to reset your password for your FAWNIC account.

Your 6-Digit Verification Code: ${code}

This code expires in 15 minutes and can only be used once.

If you did not request a password reset, please ignore this email or contact support at support@fawnic.pk.

FAWNIC Leather Atelier & Marketplace Pakistan`;
}

/**
 * Sends a password reset OTP email using the configured email provider.
 * Supports Resend (REST API), SMTP (Nodemailer), SendGrid, Brevo, and Postmark.
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<EmailSendResult> {
  const normalizedEmail = recipientEmail.trim().toLowerCase();
  const subject = `Your FAWNIC Password Reset Code: ${otpCode}`;
  const html = buildPasswordResetHtml(otpCode, recipientName);
  const text = buildPasswordResetText(otpCode, recipientName);
  const from = getSenderAddress();

  // 1. RESEND (Modern HTTPS REST API — optimal for Vercel Serverless)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [normalizedEmail],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Resend returned HTTP ${res.status}`;
        console.error('[Email Service] Resend error:', errorMsg);
        return { success: false, provider: 'resend', error: errorMsg };
      }

      console.info(`[Email Service] OTP email dispatched via Resend to ${normalizedEmail} (id: ${data?.id || 'ok'})`);
      return { success: true, provider: 'resend', messageId: data?.id };
    } catch (err: any) {
      console.error('[Email Service] Resend network error:', err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  // 2. SMTP (via Nodemailer — works with Gmail, Hostinger, AWS SES, Namecheap, custom SMTP)
  if (process.env.SMTP_HOST) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: isSecure,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== 'true',
        },
      });

      const info = await transporter.sendMail({
        from,
        to: normalizedEmail,
        subject,
        html,
        text,
      });

      console.info(`[Email Service] OTP email dispatched via SMTP to ${normalizedEmail} (id: ${info.messageId})`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err: any) {
      console.error('[Email Service] SMTP error:', err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  // 3. SENDGRID (REST API)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: normalizedEmail }] }],
          from: { email: from.includes('<') ? from.replace(/.*<([^>]+)>.*/, '$1') : from },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html },
          ],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error('[Email Service] SendGrid error:', errorText);
        return { success: false, provider: 'sendgrid', error: errorText || `SendGrid HTTP ${res.status}` };
      }

      console.info(`[Email Service] OTP email dispatched via SendGrid to ${normalizedEmail}`);
      return { success: true, provider: 'sendgrid' };
    } catch (err: any) {
      console.error('[Email Service] SendGrid network error:', err.message);
      return { success: false, provider: 'sendgrid', error: err.message };
    }
  }

  // 4. BREVO (REST API)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'FAWNIC Atelier', email: from.includes('<') ? from.replace(/.*<([^>]+)>.*/, '$1') : from },
          to: [{ email: normalizedEmail }],
          subject,
          htmlContent: html,
          textContent: text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.message || `Brevo HTTP ${res.status}`;
        console.error('[Email Service] Brevo error:', errorMsg);
        return { success: false, provider: 'brevo', error: errorMsg };
      }

      console.info(`[Email Service] OTP email dispatched via Brevo to ${normalizedEmail} (id: ${data?.messageId || 'ok'})`);
      return { success: true, provider: 'brevo', messageId: data?.messageId };
    } catch (err: any) {
      console.error('[Email Service] Brevo network error:', err.message);
      return { success: false, provider: 'brevo', error: err.message };
    }
  }

  // 5. POSTMARK (REST API)
  if (process.env.POSTMARK_SERVER_TOKEN) {
    try {
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          From: from,
          To: normalizedEmail,
          Subject: subject,
          HtmlBody: html,
          TextBody: text,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = data?.Message || `Postmark HTTP ${res.status}`;
        console.error('[Email Service] Postmark error:', errorMsg);
        return { success: false, provider: 'postmark', error: errorMsg };
      }

      console.info(`[Email Service] OTP email dispatched via Postmark to ${normalizedEmail}`);
      return { success: true, provider: 'postmark', messageId: data?.MessageID };
    } catch (err: any) {
      console.error('[Email Service] Postmark network error:', err.message);
      return { success: false, provider: 'postmark', error: err.message };
    }
  }

  // No provider configured
  console.warn(
    `[Email Service Warning] No email provider configured! Set RESEND_API_KEY, SMTP_HOST/SMTP_USER/SMTP_PASS, SENDGRID_API_KEY, or BREVO_API_KEY in environment variables. OTP for ${normalizedEmail}: ${otpCode}`
  );
  return {
    success: false,
    provider: 'none',
    error: 'Email delivery service is not configured. Please add RESEND_API_KEY or SMTP credentials in your environment settings.',
  };
}
