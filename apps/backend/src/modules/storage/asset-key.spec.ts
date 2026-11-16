import { extractAssetKey } from './asset-key';

describe('extractAssetKey', () => {
  it.each([
    ['/assets/contracts/tenant-1/abc.jpg', 'contracts/tenant-1/abc.jpg'],
    ['/uploads/customer-photos/tenant-1/abc.png', 'customer-photos/tenant-1/abc.png'],
  ])('reads the storage key from %s', (url, expectedKey) => {
    expect(extractAssetKey(url)).toBe(expectedKey);
  });

  it.each([null, undefined, '', 'https://picsum.photos/seed/x/600/400', 'contracts/tenant-1/abc.jpg'])(
    'ignores %s, which is not a stored upload',
    (url) => {
      expect(extractAssetKey(url)).toBeNull();
    },
  );
});
