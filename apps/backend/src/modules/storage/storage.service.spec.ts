import { StorageProvider } from './storage-provider.interface';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  function createService() {
    const provider: jest.Mocked<StorageProvider> = {
      save: jest.fn().mockResolvedValue('https://example.com/logos/tenant-1.png'),
      deleteByPrefix: jest.fn().mockResolvedValue(undefined),
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
});
