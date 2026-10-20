/**
 * Resend API Email Service Utility for FAWNIC Leather Atelier
 * Dedicated service for transactional email delivery via Resend HTTPS REST API.
 */

export interface ResendSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend';
}

/**
 * Gets the configured Resend API key.
 */
export function getResendApiKey(): string {
  const envKey = process.env.RESEND_API_KEY || '';
  return envKey.trim();
}

/**
 * Validates if Resend API is configured in the environment.
 */
export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey().length > 0);
}

/**
 * Gets the configured sender address for Resend emails.
 * Defaults to 'FAWNIC <otp@fawnic.store>' per production setup.
 */
export function getResendSenderAddress(): string {
  const customFrom = process.env.RESEND_FROM;
  if (customFrom && customFrom.trim().length > 0) {
    return customFrom.trim();
  }
  return 'FAWNIC <otp@fawnic.store>';
}

/**
 * Builds high-converting luxury branded HTML email for OTP delivery.
 */
function buildResendOtpHtml(code: string, recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName},` : 'Valued Patron,';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your FAWNIC Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0a09; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #e7e5e4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0c0a09; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #1c1917; border: 1px solid #292524; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 24px; text-align: center; border-bottom: 1px solid #292524; background: radial-gradient(ellipse at top, #292524, #1c1917);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #d97706; color: #ffffff; font-weight: 900; font-size: 20px; font-family: serif; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);">
                F
              </div>
              <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.25em; text-transform: uppercase; color: #f5f5f4; font-weight: 700;">
                FAWNIC
              </h1>
              <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #a8a29e;">
                Luxury Leather Atelier & Marketplace
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; color: #fafaf9; font-weight: 600; letter-spacing: -0.01em;">
                Password Reset Verification
              </h2>
              
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #d6d3d1;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #d6d3d1;">
                We received a request to authorize a password reset for your FAWNIC account. Use the single-use six-digit verification code below:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 28px;">
                <tr>
                  <td align="center" style="background: #292524; border: 1px solid #44403c; border-radius: 14px; padding: 24px 20px;">
                    <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #fbbf24; font-weight: 700; margin-bottom: 8px;">
                      Six-Digit Verification Code
                    </div>
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #fafaf9; font-family: 'Courier New', Courier, monospace; padding-left: 12px;">
                      ${code}
                    </div>
                    <div style="font-size: 11px; color: #a8a29e; margin-top: 8px;">
                      Valid for 15 minutes • Single-use only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background: rgba(217, 119, 6, 0.08); border-left: 3px solid #d97706; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fde68a;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. FAWNIC concierges and staff will never ask for your verification code.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #a8a29e;">
                If you did not request this verification code, please ignore this email. Your existing credentials remain completely secure.
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
                Concierge Support: <a href="mailto:support@fawnic.store" style="color: #d97706; text-decoration: none;">support@fawnic.store</a>
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

/**
 * Builds plain text fallback for the OTP email.
 */
function buildResendOtpText(code: string, recipientName?: string): string {
  const greeting = recipientName ? `Dear ${recipientName},` : 'Valued Patron,';
  return `${greeting}

We received a request to reset your password for your FAWNIC account.

Your 6-Digit Verification Code: ${code}

This code expires in 15 minutes and can only be used once.

If you did not request this password reset, please ignore this email.

FAWNIC Luxury Leather Atelier & Marketplace
Concierge Support: support@fawnic.store`;
}

/**
 * Sends a password reset OTP email using the Resend REST API.
 */
export async function sendOtpViaResend(
  recipientEmail: string,
  otpCode: string,
  recipientName?: string
): Promise<ResendSendResult> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    const errorMsg = 'RESEND_API_KEY is not configured in the server environment.';
    console.error(`[Resend Service Error] ${errorMsg}`);
    return {
      success: false,
      provider: 'resend',
      error: errorMsg,
    };
  }

  const normalizedEmail = recipientEmail.trim().toLowerCase();
  const fromAddress = getResendSenderAddress();
  const subject = `Your FAWNIC Password Reset Code: ${otpCode}`;
  const html = buildResendOtpHtml(otpCode, recipientName);
  const text = buildResendOtpText(otpCode, recipientName);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [normalizedEmail],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        `Resend API request failed with HTTP ${response.status}`;
      console.error('[Resend Service Error]', errorMsg);
      return {
        success: false,
        provider: 'resend',
        error: errorMsg,
      };
    }

    console.info(`[Resend Service] Password reset OTP sent to ${normalizedEmail} (messageId: ${data?.id || 'delivered'})`);
    return {
      success: true,
      provider: 'resend',
      messageId: data?.id,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error while contacting Resend API';
    console.error('[Resend Service Network Error]', errorMsg);
    return {
      success: false,
      provider: 'resend',
      error: errorMsg,
    };
  }
}
