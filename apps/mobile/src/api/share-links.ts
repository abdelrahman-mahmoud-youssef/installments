import { apiClient } from './client';

export function createShareLink(targetPath: string): Promise<{ code: string }> {
  return apiClient.post('share-links', { targetPath });
}
