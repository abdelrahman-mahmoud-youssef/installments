import { Stack } from 'expo-router';
import { useStackScreenOptions } from './use-stack-screen-options';

export function TabStack() {
  const screenOptions = useStackScreenOptions();
  return <Stack screenOptions={screenOptions} />;
}
