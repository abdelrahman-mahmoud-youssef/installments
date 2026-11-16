import { createHmac } from 'node:crypto';
import { verifyWhatsappSignature } from './whatsapp-signature';

function sign(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

describe('verifyWhatsappSignature', () => {
  const secret = 'app-secret';
  const body = JSON.stringify({ entry: [] });

  it('accepts a body signed with the app secret', () => {
    expect(verifyWhatsappSignature(Buffer.from(body), sign(body, secret), secret)).toBe(true);
  });

  it('rejects a body signed with a different secret', () => {
    expect(verifyWhatsappSignature(Buffer.from(body), sign(body, 'other-secret'), secret)).toBe(false);
  });

  it('rejects a signature that belongs to a different body', () => {
    expect(verifyWhatsappSignature(Buffer.from('{"entry":[{}]}'), sign(body, secret), secret)).toBe(false);
  });

  it.each([undefined, '', 'sha256=', 'sha256=nothex', 'md5=abc', 'abc'])('rejects the malformed header %s', (header) => {
    expect(verifyWhatsappSignature(Buffer.from(body), header, secret)).toBe(false);
  });
});
