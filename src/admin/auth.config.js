// auth.config.js

// Admin authentication uses a hashed password stored in an environment variable.
// Example usage:
// import.meta.env.VITE_ADMIN_HASHED_PASSWORD
//
// To check password:
// 1. Hash the user input (e.g., with SHA-256)
// 2. Compare to process.env.VITE_ADMIN_HASHED_PASSWORD

export const ADMIN_HASHED_PASSWORD = import.meta.env.VITE_ADMIN_HASHED_PASSWORD;
