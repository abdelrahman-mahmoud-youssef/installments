import sharp from 'sharp';
import { ThumbnailWidth } from './image-variants';

const THUMBNAIL_JPEG_QUALITY = 75;

export function renderThumbnail(original: Buffer, width: ThumbnailWidth): Promise<Buffer> {
  return sharp(original)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: THUMBNAIL_JPEG_QUALITY })
    .toBuffer();
}
