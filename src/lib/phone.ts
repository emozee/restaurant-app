const BHUTAN_PREFIX = "+975";

function detectCarrier(digits: string): string | null {
  if (digits.startsWith('77')) return 'TashiCell';
  if (digits.startsWith('17') || digits.startsWith('16')) return 'Bmobile';
  return null;
}

export function formatPhoneDisplay(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  const digitsOnly = cleaned.startsWith('975') ? cleaned.slice(3) : cleaned;
  return BHUTAN_PREFIX + ' ' + digitsOnly.slice(0, 8);
}

export function validatePhone(input: string): { valid: boolean; error?: string; carrier?: string } {
  const cleaned = input.replace(/\D/g, '');
  const digits = cleaned.startsWith('975') ? cleaned.slice(3) : cleaned;

  if (!digits) return { valid: false, error: 'Phone number is required' };
  if (digits.length !== 8) return { valid: false, error: `Enter exactly 8 digits after ${BHUTAN_PREFIX}` };

  const carrier = detectCarrier(digits);
  return { valid: true, carrier: carrier || undefined };
}

export function getPhoneDigits(input: string): string {
  const cleaned = input.replace(/\D/g, '');
  return cleaned.startsWith('975') ? cleaned.slice(3) : cleaned;
}
