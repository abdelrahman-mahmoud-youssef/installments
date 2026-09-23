const EGYPT_COUNTRY_CODE = '20';
const WHATSAPP_BASE_URL = 'https://wa.me/';

function stripLeadingZero(digits: string): string {
  return digits.startsWith('0') ? digits.slice(1) : digits;
}

export function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith(EGYPT_COUNTRY_CODE) ? digits : `${EGYPT_COUNTRY_CODE}${stripLeadingZero(digits)}`;
}

export function whatsappChatUrl(phone: string, message?: string): string {
  const base = `${WHATSAPP_BASE_URL}${toWhatsappNumber(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
