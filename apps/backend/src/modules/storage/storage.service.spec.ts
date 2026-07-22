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
    expect(result).toEqual({ buffer: Buffer.from('image'), contentType: 'image/png' });
  });
});
