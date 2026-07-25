const BRAND_DEEP = '#062559';
const BRAND_ACCENT = '#0662e6';

export interface EmailLayoutData {
  logoUrl: string;
  appName: string;
  heading: string;
  bodyHtml: string;
  footerNote: string;
}

export function renderEmailLayout(data: EmailLayoutData): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${data.appName}</title>
  </head>
  <body style="margin:0;padding:32px 16px;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr>
        <td style="background-color:${BRAND_DEEP};padding:32px;text-align:center;">
          <img src="${data.logoUrl}" alt="${data.appName}" width="48" height="48" style="border-radius:11px;display:inline-block;" />
          <div style="margin-top:12px;font-size:15px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">${data.appName}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 32px 8px;">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;letter-spacing:-0.01em;">${data.heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#374151;">${data.bodyHtml}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">${data.footerNote}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailButton(label: string, url: string): string {
  const brandAccent = BRAND_ACCENT;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:10px;background-color:${brandAccent};">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}
