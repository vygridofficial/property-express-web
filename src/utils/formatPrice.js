/**
 * Smartly formats a price value into the Indian Rupee (₹) standard.
 * Prevents redundant symbols (₹₹) and uses Indian numbering format (Lakhs/Crores).
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null) return '₹ 0';

  if (typeof price === 'string') {
    // If it's already a formatted string, just clean up and ensure it has exactly one ₹
    let cleaned = price.replace(/\$/g, '').replace(/₹/g, '').trim();
    
    // If it was just a number string, format it properly
    if (!isNaN(parseFloat(cleaned)) && !cleaned.toLowerCase().includes('cr') && !cleaned.toLowerCase().includes('l')) {
      return `₹${Number(cleaned).toLocaleString('en-IN')}`;
    }
    
    return `₹${cleaned}`;
  }

  // Handle number format with Indian numbering system (Commas at 3, 2, 2...)
  return `₹${Number(price).toLocaleString('en-IN')}`;
};
