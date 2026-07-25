import { apiClient } from './client';

export function getOrCreateShareLink(targetPath: string): Promise<{ code: string }> {
  return apiClient.post('share-links', { targetPath });
}
