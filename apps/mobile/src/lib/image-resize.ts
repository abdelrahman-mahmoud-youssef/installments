import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_JPEG_QUALITY = 0.75;

export interface ResizedImage {
  uri: string;
  base64: string;
}

export async function shrinkImageForUpload(uri: string): Promise<ResizedImage> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const isLandscape = original.width >= original.height;
  const longestSide = Math.max(original.width, original.height);
  const resizeTarget = isLandscape ? { width: MAX_UPLOAD_DIMENSION } : { height: MAX_UPLOAD_DIMENSION };
  const prepared =
    longestSide > MAX_UPLOAD_DIMENSION ? await ImageManipulator.manipulate(original).resize(resizeTarget).renderAsync() : original;
  const saved = await prepared.saveAsync({ format: SaveFormat.JPEG, compress: UPLOAD_JPEG_QUALITY, base64: true });
  if (!saved.base64) {
    throw new Error('The image could not be prepared for upload.');
  }
  return { uri: saved.uri, base64: saved.base64 };
}
