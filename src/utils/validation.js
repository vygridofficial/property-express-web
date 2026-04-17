/**
 * Validates an email address using a standard regular expression.
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number (raw digits only, or full string).
 * @param {string} phone       — the number string (digits only or with formatting)
 * @param {string} [countryCode] — optional dial code e.g. "+91"; used to strip prefix from combined strings
 * @returns {boolean}
 */
export const isValidPhone = (phone, countryCode) => {
  if (!phone) return false;

  let normalized = phone;

  // If a countryCode is supplied and the number starts with it, strip it
  if (countryCode) {
    const dialDigits = countryCode.replace(/\D/g, '');
    const numberDigits = phone.replace(/\D/g, '');
    if (numberDigits.startsWith(dialDigits) && numberDigits.length > dialDigits.length) {
      normalized = numberDigits.slice(dialDigits.length);
    } else {
      normalized = numberDigits;
    }
  }

  // Strip non-digits to check length
  const digits = normalized.replace(/\D/g, '');
  // Accept 4–15 digits (covers all international formats)
  if (digits.length < 4 || digits.length > 15) return false;

  // Check format: starts with optional +, then only allowed chars
  const phoneRegex = /^\+?[0-9\s\-()]+$/;
  return phoneRegex.test(phone);
};
