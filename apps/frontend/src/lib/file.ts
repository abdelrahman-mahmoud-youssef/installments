import { shrinkImageForUpload } from './image-resize';

function readAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fileToBase64(file: File): Promise<string> {
  return readAsBase64(await shrinkImageForUpload(file));
}
