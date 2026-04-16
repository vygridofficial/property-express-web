/**
 * Safely format a Firestore Timestamp or a Date object into a human-readable string.
 * Format: "Oct 24, 2023"
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return null;
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Check for invalid date
    if (isNaN(date.getTime())) return null;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (err) {
    console.error("Error formatting date:", err);
    return null;
  }
};
