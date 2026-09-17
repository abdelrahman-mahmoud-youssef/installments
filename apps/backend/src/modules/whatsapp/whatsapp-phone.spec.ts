import { toWhatsappRecipient } from './whatsapp-phone';

describe('toWhatsappRecipient', () => {
  it('converts a local number with a leading zero', () => {
    expect(toWhatsappRecipient('01122662426')).toBe('201122662426');
  });

  it('converts a local number without a leading zero', () => {
    expect(toWhatsappRecipient('1122662426')).toBe('201122662426');
  });

  it('does not double-prefix a number already stored with the country code', () => {
    expect(toWhatsappRecipient('+201122662426')).toBe('201122662426');
  });

  it('strips non-digit characters', () => {
    expect(toWhatsappRecipient('+20 112 266 2426')).toBe('201122662426');
  });
});
