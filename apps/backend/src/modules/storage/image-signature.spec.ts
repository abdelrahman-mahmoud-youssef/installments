import { detectImageExtension } from './image-signature';

describe('detectImageExtension', () => {
  it('detects a PNG signature', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageExtension(buffer)).toBe('png');
  });

  it('detects a JPEG signature', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectImageExtension(buffer)).toBe('jpg');
  });

  it('returns null for an unrecognized signature', () => {
    const buffer = Buffer.from('not an image');
    expect(detectImageExtension(buffer)).toBeNull();
  });
});
