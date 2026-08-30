import argon2 from 'argon2';
import { createInterface } from 'node:readline/promises';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = await rl.question('Mot de passe admin : ');
rl.close();

if (password.length < 12) {
  console.error('Le mot de passe doit faire au moins 12 caractères.');
  process.exit(1);
}

console.log(`\nADMIN_PASSWORD_HASH=${await argon2.hash(password)}`);
