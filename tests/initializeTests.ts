import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

export default async function initializeTests() {
  const envFilePath = path.resolve(__dirname, '../.env.test');
  const envResult = dotenv.config({ path: envFilePath });

  if (envResult.error) {
    throw envResult.error;
  }

  execSync('npx prisma migrate reset --force --skip-seed', {
    env: {
      ...process.env,
      ...envResult.parsed,
    },
    stdio: 'inherit',
  });
}
