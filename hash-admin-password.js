// Usage: node hash-admin-password.cjs yourpassword
import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: node hash-admin-password.js yourpassword');
  process.exit(1);
}
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('SHA-256 hash:', hash);
