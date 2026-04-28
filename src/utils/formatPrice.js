/**
 * Formats a price value into compact Indian Rupee notation.
 * Handles raw numbers AND pre-formatted strings (e.g. "0.2L", "1.5Cr", "20000").
 *
 * Examples:
 *   18000       → ₹18K
 *   20000       → ₹20K
 *   150000      → ₹1.5L
 *   6900000     → ₹69L
 *   10000000    → ₹1Cr
 *   "0.2L"      → ₹20K  (converts old format to proper value first)
 *   "1.5Cr"     → ₹1.5Cr
 */

const formatNumber = (n) => {
  if (isNaN(n) || n === null || n === undefined) return '₹0';
  const num = Number(n);

  if (num >= 1_00_00_000) {
    const val = num / 1_00_00_000;
    return `₹${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')}Cr`;
  }
  if (num >= 1_00_000) {
    const val = num / 1_00_000;
    return `₹${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')}L`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `₹${val % 1 === 0 ? val : val.toFixed(1).replace(/\.?0+$/, '')}K`;
  }
  return `₹${num}`;
};

export const formatPrice = (price) => {
  if (price === undefined || price === null || price === '') return '₹0';

  if (typeof price === 'string') {
    // Strip currency symbol and whitespace
    const cleaned = price.replace(/₹|\$/g, '').trim();

    // Detect and parse pre-formatted unit strings: e.g. "0.2L", "1.5Cr", "20K"
    const unitMatch = cleaned.match(/^([\d.]+)\s*(cr|l|k)$/i);
    if (unitMatch) {
      const numPart = parseFloat(unitMatch[1]);
      const unit = unitMatch[2].toLowerCase();
      let rawValue;
      if (unit === 'cr') rawValue = numPart * 1_00_00_000;
      else if (unit === 'l') rawValue = numPart * 1_00_000;
      else if (unit === 'k') rawValue = numPart * 1_000;
      return formatNumber(rawValue);
    }

    // Plain number string → run through formatter
    if (!isNaN(parseFloat(cleaned))) {
      return formatNumber(Number(cleaned));
    }

    // Unrecognised string — just prepend ₹
    return `₹${cleaned}`;
  }

  return formatNumber(Number(price));
};
