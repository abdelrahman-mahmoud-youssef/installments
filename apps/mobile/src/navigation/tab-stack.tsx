import { Stack } from 'expo-router';
import { useStackScreenOptions } from './use-stack-screen-options';

export function TabStack() {
  const screenOptions = useStackScreenOptions({ largeTitle: true });
  return <Stack screenOptions={screenOptions} />;
}
