import { useMutation } from '@tanstack/react-query';
import { getOrCreateShareLink } from '@/lib/api/share-links';

export function useCreateShareLink() {
  return useMutation({
    mutationFn: (targetPath: string) => getOrCreateShareLink(targetPath),
  });
}
