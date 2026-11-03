import { cookies } from 'next/headers';
import { config } from '@/lib/config';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

async function setSessionCookie(name: string, accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(name, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_IN_SECONDS,
  });
}

export function setAuthCookie(accessToken: string): Promise<void> {
  return setSessionCookie(config.authCookieName, accessToken);
}

export function setPlatformAuthCookie(accessToken: string): Promise<void> {
  return setSessionCookie(config.platformAuthCookieName, accessToken);
}
