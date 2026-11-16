import { cacheControlFor } from './assets.controller';

describe('cacheControlFor', () => {
  it('returns a short public cache duration for logos, which can be overwritten on re-upload', () => {
    expect(cacheControlFor('logos/tenant-1.png')).toBe('public, max-age=3600');
  });

  it.each(['about-images/tenant-1/abc.png', 'offer-images/tenant-1/abc.jpg'])(
    'returns a long public immutable cache duration for %s, which is never overwritten',
    (key) => {
      expect(cacheControlFor(key)).toBe('public, max-age=31536000, immutable');
    },
  );

  it.each(['customer-photos/tenant-1/abc.jpg', 'contact-photos/tenant-1/abc.jpg', 'contracts/tenant-1/abc.jpg'])(
    'keeps %s in private caches only, for a year',
    (key) => {
      expect(cacheControlFor(key)).toBe('private, max-age=31536000, immutable');
    },
  );

  it.each(['payment-claims/tenant-1/abc.png', 'payment-method-transactions/tenant-1/abc.jpg', 'support-images/tenant-1/abc.jpg'])(
    'keeps %s in private caches for a day',
    (key) => {
      expect(cacheControlFor(key)).toBe('private, max-age=86400');
    },
  );

  it('does not cache ID card images at all', () => {
    expect(cacheControlFor('customer-ids/tenant-1/abc.jpg')).toBeNull();
  });
});
