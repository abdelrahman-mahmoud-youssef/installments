import { renderEmailButton, renderEmailLayout } from './email-layout';

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  logoUrl: string;
  appName: string;
  expiryMinutes: number;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}

export function buildPasswordResetEmail(data: PasswordResetEmailData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 8px;">Hi ${data.name},</p>
    <p style="margin:0 0 8px;">We got a request to reset the password on your ${data.appName} account. Click the button below to choose a new one.</p>
    ${renderEmailButton('Reset password', data.resetUrl)}
    <p style="margin:0 0 8px;">This link expires in ${data.expiryMinutes} minutes.</p>
    <p style="margin:0;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `;

  return {
    subject: `Reset your ${data.appName} password`,
    html: renderEmailLayout({
      logoUrl: data.logoUrl,
      appName: data.appName,
      heading: 'Reset your password',
      bodyHtml,
      footerNote: `Sent by ${data.appName}. If you have any questions, just reply to this email.`,
    }),
  };
}
