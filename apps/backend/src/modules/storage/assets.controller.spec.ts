import { cacheControlFor } from './assets.controller';

describe('cacheControlFor', () => {
  it('returns a short cache duration for logos, which can be overwritten on re-upload', () => {
    expect(cacheControlFor('logos/tenant-1.png')).toBe('public, max-age=3600');
  });

  it('returns a long immutable cache duration for about-images, which are never overwritten', () => {
    expect(cacheControlFor('about-images/tenant-1/abc.png')).toBe('public, max-age=31536000, immutable');
  });

  it('returns null for every other key, e.g. payment-claim screenshots', () => {
    expect(cacheControlFor('payment-claims/tenant-1/abc.png')).toBeNull();
  });
});
