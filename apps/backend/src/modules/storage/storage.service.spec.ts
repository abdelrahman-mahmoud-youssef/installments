import sharp from 'sharp';
import { StorageProvider } from './storage-provider.interface';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  function createService() {
    const provider: jest.Mocked<StorageProvider> = {
      save: jest.fn().mockResolvedValue('https://example.com/logos/tenant-1.png'),
      deleteByPrefix: jest.fn().mockResolvedValue(undefined),
      getAssetUrl: jest.fn().mockResolvedValue('https://signed.example.com/logos/tenant-1.png'),
      getAssetBytes: jest.fn().mockResolvedValue({ buffer: Buffer.from('image'), contentType: 'image/png' }),
    };
    return { service: new StorageService(provider), provider };
  }

  it('deletes any previous logo before saving the new one under a tenant-scoped key', async () => {
    const { service, provider } = createService();
    const buffer = Buffer.from('image');

    const url = await service.saveLogo('tenant-1', buffer, 'png');

    expect(provider.deleteByPrefix).toHaveBeenCalledWith('logos/tenant-1.');
    expect(provider.save).toHaveBeenCalledWith('logos/tenant-1.png', buffer);
    expect(url).toBe('https://example.com/logos/tenant-1.png');
  });

  it('deletes by tenant-scoped prefix', async () => {
    const { service, provider } = createService();

    await service.deleteLogo('tenant-1');

    expect(provider.deleteByPrefix).toHaveBeenCalledWith('logos/tenant-1.');
  });

  it('saves a keyed image without deleting any existing files', async () => {
    const { service, provider } = createService();
    const buffer = Buffer.from('image');

    const url = await service.saveKeyedImage('about-images/tenant-1/abc.png', buffer);

    expect(provider.deleteByPrefix).not.toHaveBeenCalled();
    expect(provider.save).toHaveBeenCalledWith('about-images/tenant-1/abc.png', buffer);
    expect(url).toBe('https://example.com/logos/tenant-1.png');
  });

  it('delegates asset URL resolution to the provider', async () => {
    const { service, provider } = createService();

    const url = await service.getAssetUrl('logos/tenant-1.png');

    expect(provider.getAssetUrl).toHaveBeenCalledWith('logos/tenant-1.png');
    expect(url).toBe('https://signed.example.com/logos/tenant-1.png');
  });

  it('delegates asset byte fetching to the provider', async () => {
    const { service, provider } = createService();

    const result = await service.getAssetBytes('logos/tenant-1.png');

    expect(provider.getAssetBytes).toHaveBeenCalledWith('logos/tenant-1.png');
    expect(result).toEqual({ buffer: Buffer.from('image'), contentType: 'image/png', isFallback: false });
  });

  describe('thumbnails', () => {
    async function createPhoto(): Promise<Buffer> {
      return sharp({ create: { width: 1200, height: 900, channels: 3, background: '#3366cc' } }).jpeg().toBuffer();
    }

    it('saves the original and a small and a large thumbnail next to it', async () => {
      const { service, provider } = createService();
      const photo = await createPhoto();

      await service.saveImageWithThumbnails('contracts/tenant-1/abc.jpg', photo);

      const savedKeys = provider.save.mock.calls.map(([key]) => key);
      expect(savedKeys).toEqual(
        expect.arrayContaining(['contracts/tenant-1/abc.jpg', 'contracts/tenant-1/abc.w200.jpg', 'contracts/tenant-1/abc.w800.jpg']),
      );
    });

    it('renders thumbnails at the requested width and never enlarges small images', async () => {
      const { service, provider } = createService();
      const smallPhoto = await sharp({ create: { width: 120, height: 80, channels: 3, background: '#cc3333' } }).jpeg().toBuffer();

      await service.saveImageWithThumbnails('contracts/tenant-1/abc.jpg', await createPhoto());
      await service.saveImageWithThumbnails('contracts/tenant-1/small.jpg', smallPhoto);

      const widthOf = async (key: string) => {
        const call = provider.save.mock.calls.find(([savedKey]) => savedKey === key);
        return (await sharp(call?.[1] as Buffer).metadata()).width;
      };
      expect(await widthOf('contracts/tenant-1/abc.w200.jpg')).toBe(200);
      expect(await widthOf('contracts/tenant-1/abc.w800.jpg')).toBe(800);
      expect(await widthOf('contracts/tenant-1/small.w200.jpg')).toBe(120);
    });

    it('still saves the original when a thumbnail cannot be created', async () => {
      const { service, provider } = createService();

      await expect(service.saveImageWithThumbnails('contracts/tenant-1/broken.jpg', Buffer.from('not an image'))).resolves.toBeDefined();

      expect(provider.save).toHaveBeenCalledWith('contracts/tenant-1/broken.jpg', expect.any(Buffer));
    });

    it('serves the original when a thumbnail does not exist yet', async () => {
      const { service, provider } = createService();
      provider.getAssetBytes.mockImplementation(async (key: string) => {
        if (key === 'contracts/tenant-1/abc.jpg') {
          return { buffer: Buffer.from('original'), contentType: 'image/jpeg' };
        }
        throw new Error('NoSuchKey');
      });

      const result = await service.getAssetBytes('contracts/tenant-1/abc.w200.jpg');

      expect(result.isFallback).toBe(true);
      expect(result.buffer.toString()).toBe('original');
    });

    it('does not fall back for a normal key', async () => {
      const { service, provider } = createService();
      provider.getAssetBytes.mockRejectedValue(new Error('NoSuchKey'));

      await expect(service.getAssetBytes('contracts/tenant-1/abc.jpg')).rejects.toThrow('NoSuchKey');
    });
  });
});
