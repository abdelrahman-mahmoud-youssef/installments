import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(key: string): Buffer {
  return createHash('sha256').update(key).digest();
}

export function encrypt(plainText: string, key: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(key), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((part) => part.toString('base64')).join('.');
}

export function decrypt(cipherText: string, key: string): string {
  const [ivPart, authTagPart, encryptedPart] = cipherText.split('.');
  const decipher = createDecipheriv(ALGORITHM, deriveKey(key), Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagPart, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
