/**
 * Formats a social media handle or fragment into a full URL.
 * @param {string} url - The URL or handle from settings.
 * @param {string} platform - 'instagram' | 'facebook'
 * @returns {string} - The full usable URL.
 */
export const formatSocialUrl = (url, platform) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  let cleanUrl = url.trim();
  
  if (platform === 'instagram') {
    // Remove leading @ if present
    cleanUrl = cleanUrl.replace(/^@/, '');
    return `https://www.instagram.com/${cleanUrl}`;
  }

  if (platform === 'facebook') {
    // Just prepend facebook domain
    return `https://www.facebook.com/${cleanUrl.replace(/^\//, '')}`;
  }

  return url;
};

/**
 * Formats a social media URL/handle for clean display.
 * @param {string} url - The URL or handle from settings.
 * @param {string} platform - 'instagram' | 'facebook'
 * @param {string} fallback - Fallback text if name cannot be parsed.
 * @returns {string} - Clean display text.
 */
export const formatSocialDisplay = (url, platform, fallback = '') => {
  if (!url) return fallback;

  // Remove domain and protocol
  let display = url
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^https?:\/\/(www\.)?facebook\.com\//, '')
    .split('?')[0] // Remove query parameters
    .replace(/\/$/, ''); // Remove trailing slash

  if (platform === 'instagram') {
    // Ensure leading @ for Instagram display
    display = display.replace(/^@/, '');
    return `@${display}`;
  }

  if (platform === 'facebook') {
    // For Facebook, if it's a "share" link or generic page path, fallback to the site name
    if (display.includes('share/') || !display || display.length < 3) {
      return fallback || 'Property Express';
    }
    return display;
  }

  return display || fallback;
};
