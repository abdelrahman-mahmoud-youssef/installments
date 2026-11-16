import { execSync } from 'node:child_process';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const TEST_DATABASE_SUFFIX = '_test';

export function prepareTestDatabase(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL must point to a local PostgreSQL database whose name ends with _test.');
  }
  const { hostname, pathname } = new URL(url);
  if (!LOCAL_HOSTS.includes(hostname) || !pathname.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error('TEST_DATABASE_URL must be a local database whose name ends with _test.');
  }
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
  process.env.DATABASE_URL = url;
  return url;
}
