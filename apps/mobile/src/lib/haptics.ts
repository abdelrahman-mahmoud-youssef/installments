import * as Haptics from 'expo-haptics';

export type FeedbackTone = 'success' | 'error';

export function selectionHaptic(): void {
  void Haptics.selectionAsync();
}

export function notificationHaptic(tone: FeedbackTone): void {
  void Haptics.notificationAsync(
    tone === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  );
}
