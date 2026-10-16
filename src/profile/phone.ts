/**
 * Country calling codes with two digits. The rest follow from how the codes are assigned:
 * no code is the start of another, codes starting with 1 or 7 are one digit (+1, +7),
 * and every other code is three digits (+351, +420, +971).
 */
const TWO_DIGIT_CODES = new Set(
  '20 27 30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 60 61 62 63 64 65 66 81 82 84 86 90 91 92 93 94 95 98'.split(
    ' ',
  ),
);

function codeLength(digits: string): number {
  if (digits[0] === '1' || digits[0] === '7') return 1;
  return TWO_DIGIT_CODES.has(digits.slice(0, 2)) ? 2 : 3;
}

export interface PhoneParts {
  phoneCountryCode: string;
  phoneNumber: string;
}

/**
 * Splits a full international number ("+48791532218", "0048 791 532 218", "+49 (0)151 2345678")
 * into its country code and the rest. A number without + or 00 has no country code.
 */
export function splitPhone(full: string): PhoneParts {
  const text = full.trim();
  const international = /^(?:\+|00)\s*/.exec(text);
  if (!international) return { phoneCountryCode: '', phoneNumber: text };

  const rest = text.slice(international[0].length);
  const digits = rest.replace(/\D/g, '');
  if (!digits) return { phoneCountryCode: '', phoneNumber: text };
  const length = codeLength(digits);
  if (digits.length < length) return { phoneCountryCode: '', phoneNumber: text };

  // Step past the code's digits in the original text, keeping the formatting of what follows.
  let end = 0;
  for (let taken = 0; taken < length; end++) if (/\d/.test(rest[end])) taken++;
  const number = rest
    .slice(end)
    // A "(0)" after the code is the domestic trunk prefix, dialled only from inside the country.
    .replace(/^[\s\-./]*(?:\(0\)[\s\-./]*)?/, '')
    .trim();
  return { phoneCountryCode: `+${digits.slice(0, length)}`, phoneNumber: number };
}

/** The full number as one string, "+48 791532218". */
export function joinPhone(parts: PhoneParts): string {
  return [parts.phoneCountryCode.trim(), parts.phoneNumber.trim()].filter(Boolean).join(' ');
}
