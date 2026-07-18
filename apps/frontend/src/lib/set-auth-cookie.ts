import { cookies } from 'next/headers';
import { config } from '@/lib/config';

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export async function setAuthCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(config.authCookieName, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_IN_SECONDS,
  });
}
