import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const bytes = readFileSync(join(process.cwd(), 'public/apple-icon.png'));

export default function AppleIcon() {
  return new Response(bytes, { headers: { 'Content-Type': contentType } });
}
