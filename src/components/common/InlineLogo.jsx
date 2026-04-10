import React from 'react';

export default function InlineLogo({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 400 120" 
      width="100%" 
      height="100%" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxHeight: '48px', width: 'auto' }}
    >
      <text x="10" y="60" fontFamily="Outfit, sans-serif" fontSize="48" fontWeight="800" fill="#E53935">PROPERTY</text>
      <text x="240" y="60" fontFamily="Outfit, sans-serif" fontSize="48" fontWeight="800" fill="#1565C0">EXPRESS</text>
      <text x="12" y="90" fontFamily="Outfit, sans-serif" fontSize="16" fontWeight="500" fill="#888888" letterSpacing="2">YOUR TRUSTED PROPERTY PARTNER</text>
    </svg>
  );
}
