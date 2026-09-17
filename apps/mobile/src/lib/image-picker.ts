import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  base64: string;
}

const UPLOAD_QUALITY = 0.6;

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
