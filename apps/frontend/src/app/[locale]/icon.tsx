import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const bytes = readFileSync(join(process.cwd(), 'public/icon.png'));

export default function Icon() {
  return new Response(bytes, { headers: { 'Content-Type': contentType } });
}
