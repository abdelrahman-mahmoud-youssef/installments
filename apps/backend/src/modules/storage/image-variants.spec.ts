import { originalKeyCandidates, parseVariantKey, variantKeyFor } from './image-variants';

describe('variantKeyFor', () => {
  it('replaces the original extension with a width marker and a jpg extension', () => {
    expect(variantKeyFor('contracts/tenant-1/abc.png', 200)).toBe('contracts/tenant-1/abc.w200.jpg');
    expect(variantKeyFor('contracts/tenant-1/abc.jpg', 800)).toBe('contracts/tenant-1/abc.w800.jpg');
  });
});

describe('parseVariantKey', () => {
  it('recognises the supported widths', () => {
    expect(parseVariantKey('contracts/tenant-1/abc.w200.jpg')).toEqual({ baseKey: 'contracts/tenant-1/abc', width: 200 });
    expect(parseVariantKey('contracts/tenant-1/abc.w800.jpg')).toEqual({ baseKey: 'contracts/tenant-1/abc', width: 800 });
  });

  it('rejects widths that are not generated, so arbitrary sizes cannot be requested', () => {
    expect(parseVariantKey('contracts/tenant-1/abc.w999.jpg')).toBeNull();
  });

  it('rejects keys that are not variants', () => {
    expect(parseVariantKey('contracts/tenant-1/abc.jpg')).toBeNull();
    expect(parseVariantKey('contracts/tenant-1/abc.w200.png')).toBeNull();
  });
});

describe('originalKeyCandidates', () => {
  it('lists every extension an original upload can have', () => {
    expect(originalKeyCandidates('contracts/tenant-1/abc')).toEqual([
      'contracts/tenant-1/abc.jpg',
      'contracts/tenant-1/abc.png',
    ]);
  });
});
