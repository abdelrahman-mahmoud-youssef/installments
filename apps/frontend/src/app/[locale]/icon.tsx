import { ICON_BASE64 } from './icon-data';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new Response(Buffer.from(ICON_BASE64, 'base64'), { headers: { 'Content-Type': contentType } });
}
