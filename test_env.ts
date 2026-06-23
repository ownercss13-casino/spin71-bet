import fs from 'fs';
import path from 'path';

const keys = Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('GOOGLE') || k.includes('SERVICE_ACCOUNT') || k.includes('SECRET'));
console.log("=== ENVIRONMENT VARIABLES ===");
for (const key of keys) {
  const value = process.env[key];
  console.log(`${key}: ${value ? (value.length > 50 ? value.substring(0, 50) + '... (' + value.length + ' chars)' : value) : 'empty'}`);
}
process.exit(0);
