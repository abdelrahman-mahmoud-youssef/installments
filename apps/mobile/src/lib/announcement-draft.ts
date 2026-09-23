import {
  ANNOUNCEMENT_IMAGE_MAX_BYTES,
  AnnouncementAudience,
  CreateAnnouncementInput,
} from '@/api/announcements';
import { base64ByteLength } from '@/lib/image-picker';

export interface AnnouncementDraft {
  body: string;
  imageBase64: string | null;
  audience: AnnouncementAudience;
  selectedIds: ReadonlySet<string>;
}

export type AnnouncementDraftError = 'contentRequired' | 'imageTooLarge' | 'selectionRequired';

export function findAnnouncementDraftError(draft: AnnouncementDraft): AnnouncementDraftError | null {
  if (!draft.body.trim() && !draft.imageBase64) {
    return 'contentRequired';
  }
  if (draft.imageBase64 && base64ByteLength(draft.imageBase64) > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
    return 'imageTooLarge';
  }
  if (draft.audience === 'SELECTED' && draft.selectedIds.size === 0) {
    return 'selectionRequired';
  }
  return null;
}

export function toCreateAnnouncementInput(draft: AnnouncementDraft): CreateAnnouncementInput {
  return {
    body: draft.body.trim(),
    image: draft.imageBase64 ?? undefined,
    audience: draft.audience,
    customerIds: draft.audience === 'SELECTED' ? [...draft.selectedIds] : undefined,
  };
}
