import Constants from 'expo-constants';

const BACKEND_PORT = 3001;
const WEB_PORT = 3000;

function developmentHost(): string | undefined {
  return Constants.expoConfig?.hostUri?.split(':')[0];
}

function developmentUrl(port: number): string {
  return `http://${developmentHost() ?? 'localhost'}:${port}`;
}

export const apiBaseUrl: string = process.env.EXPO_PUBLIC_API_URL ?? developmentUrl(BACKEND_PORT);

export const siteUrl: string = process.env.EXPO_PUBLIC_SITE_URL ?? developmentUrl(WEB_PORT);

export const rootDomain: string | null = process.env.EXPO_PUBLIC_ROOT_DOMAIN ?? null;
