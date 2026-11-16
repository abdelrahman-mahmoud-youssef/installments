const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_JPEG_QUALITY = 0.8;
const SKIP_RESIZE_BELOW_BYTES = 300 * 1024;
const UPLOAD_MIME_TYPE = 'image/jpeg';
const UNRESIZABLE_MIME_TYPES: ReadonlySet<string> = new Set(['image/gif', 'image/svg+xml']);
const SERVER_ACCEPTED_MIME_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png']);

function shouldResize(file: File): boolean {
  if (!file.type.startsWith('image/') || UNRESIZABLE_MIME_TYPES.has(file.type)) {
    return false;
  }
  return file.size > SKIP_RESIZE_BELOW_BYTES || !SERVER_ACCEPTED_MIME_TYPES.has(file.type);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, UPLOAD_MIME_TYPE, UPLOAD_JPEG_QUALITY));
}

async function renderResized(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToBlob(canvas);
}

export async function shrinkImageForUpload(file: File): Promise<Blob> {
  if (!shouldResize(file)) {
    return file;
  }
  try {
    const resized = await renderResized(file);
    const mustConvert = !SERVER_ACCEPTED_MIME_TYPES.has(file.type);
    return resized && (mustConvert || resized.size < file.size) ? resized : file;
  } catch {
    return file;
  }
}
