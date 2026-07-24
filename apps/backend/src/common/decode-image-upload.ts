import { BadRequestException } from '@nestjs/common';
import { detectImageExtension, ImageExtension } from '../modules/storage/image-signature';

export function decodeImageUpload(
  base64: string,
  maxBytes: number,
): { buffer: Buffer; extension: ImageExtension } {
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength > maxBytes) {
    throw new BadRequestException(`Image is too large. The maximum size is ${maxBytes / (1024 * 1024)} MB.`);
  }

  const extension = detectImageExtension(buffer);
  if (!extension) {
    throw new BadRequestException('Image must be a PNG or JPEG image.');
  }

  return { buffer, extension };
}
