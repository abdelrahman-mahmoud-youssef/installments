import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getBranding,
  removeLogo,
  TenantBranding,
  UpdateBrandingInput,
  updateBranding,
  uploadAboutImage,
  uploadLogo,
} from '@/lib/api/branding';

export const brandingKeys = {
  all: ['settings', 'branding'] as const,
};

export function useBranding() {
  return useQuery({ queryKey: brandingKeys.all, queryFn: getBranding });
}

function useBrandingMutation<TInput>(mutationFn: (input: TInput) => Promise<TenantBranding>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data: TenantBranding) => queryClient.setQueryData(brandingKeys.all, data),
  });
}

export function useUpdateBranding() {
  return useBrandingMutation((input: UpdateBrandingInput) => updateBranding(input));
}

export function useUploadLogo() {
  return useBrandingMutation((image: string) => uploadLogo(image));
}

export function useRemoveLogo() {
  return useBrandingMutation<void>(() => removeLogo());
}

export function useUploadAboutImage() {
  return useMutation({ mutationFn: (image: string) => uploadAboutImage(image) });
}

export type { TenantBranding };
