import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  base64: string;
}

const UPLOAD_QUALITY = 0.6;
const BASE64_CHARS_PER_BLOCK = 4;
const BYTES_PER_BASE64_BLOCK = 3;
const BASE64_PADDING_PATTERN = /=+$/;

interface PickImagesOptions {
  limit: number;
  square?: boolean;
}

function hasBase64(asset: ImagePicker.ImagePickerAsset): asset is ImagePicker.ImagePickerAsset & { base64: string } {
  return typeof asset.base64 === 'string' && asset.base64.length > 0;
}

export async function pickImages({ limit, square = false }: PickImagesOptions): Promise<PickedImage[]> {
  const allowsMultipleSelection = limit > 1;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: UPLOAD_QUALITY,
    allowsMultipleSelection,
    selectionLimit: limit,
    allowsEditing: square && !allowsMultipleSelection,
    aspect: square ? [1, 1] : undefined,
  });
  if (result.canceled) {
    return [];
  }
  return result.assets.filter(hasBase64).map((asset) => ({ uri: asset.uri, base64: asset.base64 }));
}

export function base64ByteLength(base64: string): number {
  const paddingLength = base64.match(BASE64_PADDING_PATTERN)?.[0].length ?? 0;
  return (base64.length / BASE64_CHARS_PER_BLOCK) * BYTES_PER_BASE64_BLOCK - paddingLength;
}
