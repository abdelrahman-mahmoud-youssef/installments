const EGYPT_COUNTRY_CODE = '20';

export function toWhatsappRecipient(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith(EGYPT_COUNTRY_CODE)) {
    return digits;
  }
  return `${EGYPT_COUNTRY_CODE}${digits.replace(/^0/, '')}`;
}
