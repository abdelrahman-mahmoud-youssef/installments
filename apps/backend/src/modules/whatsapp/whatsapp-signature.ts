import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX = 'sha256=';
const SIGNATURE_ALGORITHM = 'sha256';

export function verifyWhatsappSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }
  const provided = Buffer.from(signatureHeader.slice(SIGNATURE_PREFIX.length), 'hex');
  const expected = createHmac(SIGNATURE_ALGORITHM, appSecret).update(rawBody).digest();
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
