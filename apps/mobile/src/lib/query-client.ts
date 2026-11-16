import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

const DEFAULT_STALE_TIME_MS = 30_000;

focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: DEFAULT_STALE_TIME_MS },
  },
});
