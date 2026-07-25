import { renderImage } from '@/lib/render-icon';
import { ICON_BASE64 } from './icon-data';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return renderImage(`data:image/png;base64,${ICON_BASE64}`, size, size.width / 2);
}
