import React from 'react';

// Flat: Multi-floor building with stacked windows grid
export const FlatIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="2" width="12" height="20" rx="1" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
    <path d="M6 22h12" />
  </svg>
);

// Villa: Single detached house with pitched roof, chimney
export const VillaIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10L12 3l9 7" />
    <path d="M5 10v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
    <path d="M16 4v3" />
    <rect x="10" y="14" width="4" height="8" />
  </svg>
);

// Warehouse: Wide low-profile industrial building with flat roof
export const WarehouseIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21h18" />
    <path d="M4 21V9l8-4 8 4v12" />
    <rect x="9" y="14" width="6" height="7" />
    <path d="M7 12h1" />
    <path d="M16 12h1" />
  </svg>
);

// Plot: Top-down view of land parcel square with corner markers
export const PlotIcon = ({ size = 24, color = "currentColor", className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 8h4" />
    <path d="M4 16h4" />
    <path d="M20 8h-4" />
    <path d="M20 16h-4" />
    <path d="M8 4v4" />
    <path d="M16 4v4" />
    <path d="M8 20v-4" />
    <path d="M16 20v-4" />
  </svg>
);
