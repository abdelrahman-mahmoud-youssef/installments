function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  backendUrl: requireEnv('BACKEND_URL'),
  authCookieName: 'installment_token',
} as const;
