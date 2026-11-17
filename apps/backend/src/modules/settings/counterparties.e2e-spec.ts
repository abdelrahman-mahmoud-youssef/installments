import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { prepareTestDatabase } from '../../test-support/test-database';
import { StorageService } from '../storage/storage.service';
import { CounterpartiesService } from './counterparties.service';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';

describe('CounterpartiesService pinning', () => {
  let prisma: PrismaService;
  let counterpartiesService: CounterpartiesService;

  beforeAll(async () => {
    prepareTestDatabase();
    const moduleRef = await Test.createTestingModule({
      providers: [PrismaService, CounterpartiesService, { provide: StorageService, useValue: {} }],
    }).compile();
    prisma = moduleRef.get(PrismaService);
    counterpartiesService = moduleRef.get(CounterpartiesService);
  }, 120_000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createShop(): Promise<string> {
    const suffix = randomUUID();
    const tenant = await prisma.tenant.create({
      data: { name: `Shop ${suffix}`, slug: `shop-${suffix}`, subscriptionExpiresOn: new Date('2099-01-01') },
    });
    return tenant.id;
  }

  function listNames(tenantId: string): Promise<string[]> {
    return counterpartiesService
      .findAll(tenantId, Object.assign(new CounterpartyQueryDto(), { page: 1, limit: 20 }))
      .then((result) => result.data.map((contact) => contact.name));
  }

  it('lists pinned contacts first, each group by name', async () => {
    const tenantId = await createShop();
    const [, , zeinab, mona] = await Promise.all(
      ['Ahmed', 'Karim', 'Zeinab', 'Mona'].map((name) => counterpartiesService.create(tenantId, { name })),
    );

    await counterpartiesService.update(tenantId, zeinab.id, { isPinned: true });
    await counterpartiesService.update(tenantId, mona.id, { isPinned: true });

    expect(await listNames(tenantId)).toEqual(['Mona', 'Zeinab', 'Ahmed', 'Karim']);
  });

  it('pins and unpins without touching the contact details', async () => {
    const tenantId = await createShop();
    const contact = await counterpartiesService.create(tenantId, {
      name: 'Ahmed',
      phone: '01000000000',
      notes: 'Supplier',
    });

    const pinned = await counterpartiesService.update(tenantId, contact.id, { isPinned: true });
    expect(pinned).toMatchObject({ name: 'Ahmed', phone: '01000000000', notes: 'Supplier', isPinned: true });

    const unpinned = await counterpartiesService.update(tenantId, contact.id, { isPinned: false });
    expect(unpinned).toMatchObject({ name: 'Ahmed', phone: '01000000000', notes: 'Supplier', isPinned: false });
  });
});
