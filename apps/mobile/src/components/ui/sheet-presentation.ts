import { useSyncExternalStore } from 'react';

let closingSheetCount = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changeClosingSheetCount(delta: number): void {
  closingSheetCount += delta;
  listeners.forEach((listener) => listener());
}

export function canPresentSheet(): boolean {
  return closingSheetCount === 0;
}

export function holdSheetClosing(): () => void {
  changeClosingSheetCount(1);
  return () => changeClosingSheetCount(-1);
}

export function useCanPresentSheet(): boolean {
  return useSyncExternalStore(subscribe, canPresentSheet);
}
