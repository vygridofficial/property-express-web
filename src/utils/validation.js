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
 * Validates a phone number.
 * Allows +, spaces, hyphens, parentheses and digits.
 * Minimum 10 digits recommended for real-world use.
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  // Strip non-digits to check length
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return false;
  
  // Check format: starts with optional +, then only allowed chars
  const phoneRegex = /^\+?[0-9\s\-()]+$/;
  return phoneRegex.test(phone);
};
