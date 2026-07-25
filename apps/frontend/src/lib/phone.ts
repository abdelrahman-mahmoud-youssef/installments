export const DEFAULT_COUNTRY_CODE = '+20';

function stripLeadingZero(digits: string): string {
  return digits.startsWith('0') ? digits.slice(1) : digits;
}

export function normalizeLocalPhoneInput(value: string): string {
  return stripLeadingZero(value.replace(/\D/g, ''));
}

export function toLocalPhoneNumber(storedPhone: string | null | undefined): string {
  if (!storedPhone) {
    return '';
  }
  return storedPhone.startsWith(DEFAULT_COUNTRY_CODE)
    ? storedPhone.slice(DEFAULT_COUNTRY_CODE.length)
    : storedPhone;
}

export function toStoredPhoneNumber(localNumber: string): string {
  const digits = normalizeLocalPhoneInput(localNumber);
  return digits ? `${DEFAULT_COUNTRY_CODE}${digits}` : '';
}

export function toWhatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const countryCode = DEFAULT_COUNTRY_CODE.slice(1);
  return digits.startsWith(countryCode) ? digits : `${countryCode}${stripLeadingZero(digits)}`;
}
