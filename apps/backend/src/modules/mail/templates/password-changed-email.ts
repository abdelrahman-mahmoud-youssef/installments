import { renderEmailLayout } from './email-layout';
import { RenderedEmail } from './password-reset-email';

export interface PasswordChangedEmailData {
  name: string;
  logoUrl: string;
  appName: string;
}

export function buildPasswordChangedEmail(data: PasswordChangedEmailData): RenderedEmail {
  const bodyHtml = `
    <p style="margin:0 0 8px;">Hi ${data.name},</p>
    <p style="margin:0 0 8px;">Your ${data.appName} password was just changed.</p>
    <p style="margin:0;">If this wasn't you, contact us immediately to secure your account.</p>
  `;

  return {
    subject: `Your ${data.appName} password was changed`,
    html: renderEmailLayout({
      logoUrl: data.logoUrl,
      appName: data.appName,
      heading: 'Password changed',
      bodyHtml,
      footerNote: `Sent by ${data.appName}. If you have any questions, just reply to this email.`,
    }),
  };
}
