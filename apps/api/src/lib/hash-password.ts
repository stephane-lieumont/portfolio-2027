import argon2 from 'argon2';
import { createInterface } from 'node:readline/promises';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question('Admin password: ');
rl.close();

if (password.length < 12) {
  console.error('The password must be at least 12 characters long.');
  process.exit(1);
}

console.log(`\nADMIN_PASSWORD_HASH=${await argon2.hash(password)}`);
