/**
 * Bhutanese mobile numbers are 8 digits, dialed with the +975 country code.
 * Mobile numbers conventionally start with 17 or 77 (TashiCell / Bhutan
 * Telecom); this is intentionally permissive rather than hard-coding carrier
 * prefixes, since new ranges can be issued over time.
 */
export const BHUTAN_COUNTRY_CODE = "+975" as const;
export const BHUTAN_PHONE_REGEX = /^\+975(17|77|16)\d{6}$/;

export function isValidBhutanPhone(phone: string): boolean {
  return BHUTAN_PHONE_REGEX.test(phone);
}

/**
 * Normalizes local input (e.g. "17123456", "975 17123456") to E.164
 * (+97517123456). Returns null if the result isn't a valid Bhutan number.
 */
export function normalizeBhutanPhone(raw: string): string | null {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  let candidate: string;
  if (digitsOnly.startsWith("975") && digitsOnly.length === 11) {
    candidate = `+${digitsOnly}`;
  } else if (digitsOnly.length === 8) {
    candidate = `${BHUTAN_COUNTRY_CODE}${digitsOnly}`;
  } else {
    candidate = raw.startsWith("+") ? raw : `+${digitsOnly}`;
  }
  return isValidBhutanPhone(candidate) ? candidate : null;
}
