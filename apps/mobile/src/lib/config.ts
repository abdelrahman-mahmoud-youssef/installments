import Constants from 'expo-constants';

const BACKEND_PORT = 3001;

function inferDevelopmentApiUrl(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return undefined;
  }
  const host = hostUri.split(':')[0];
  return `http://${host}:${BACKEND_PORT}`;
}

export const apiBaseUrl: string =
  process.env.EXPO_PUBLIC_API_URL ?? inferDevelopmentApiUrl() ?? `http://localhost:${BACKEND_PORT}`;
