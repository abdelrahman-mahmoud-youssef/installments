import { APPLE_ICON_BASE64 } from './apple-icon-data';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new Response(Buffer.from(APPLE_ICON_BASE64, 'base64'), { headers: { 'Content-Type': contentType } });
}
