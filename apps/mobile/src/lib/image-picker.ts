import * as ImagePicker from 'expo-image-picker';
import { shrinkImageForUpload } from './image-resize';

export interface PickedImage {
  uri: string;
  base64: string;
}

const BASE64_CHARS_PER_BLOCK = 4;
const BYTES_PER_BASE64_BLOCK = 3;
const BASE64_PADDING_PATTERN = /=+$/;

interface PickImagesOptions {
  limit: number;
  square?: boolean;
}

export async function pickImages({ limit, square = false }: PickImagesOptions): Promise<PickedImage[]> {
  const allowsMultipleSelection = limit > 1;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsMultipleSelection,
    selectionLimit: limit,
    allowsEditing: square && !allowsMultipleSelection,
    aspect: square ? [1, 1] : undefined,
  });
  if (result.canceled) {
    return [];
  }
  return Promise.all(result.assets.map((asset) => shrinkImageForUpload(asset.uri)));
}

export function base64ByteLength(base64: string): number {
  const paddingLength = base64.match(BASE64_PADDING_PATTERN)?.[0].length ?? 0;
  return (base64.length / BASE64_CHARS_PER_BLOCK) * BYTES_PER_BASE64_BLOCK - paddingLength;
}
