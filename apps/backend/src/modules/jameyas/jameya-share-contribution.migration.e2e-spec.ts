import { PrismaClient, RecurrenceType } from '@prisma/client';
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getUtcToday } from '../../common/date/utc-date';
import { prepareTestDatabase } from '../../test-support/test-database';
import { buildJameyaDetail, JAMEYA_DETAIL_INCLUDE } from './jameya-detail';

const CONTRIBUTION_MIGRATION = '20261123090000_jameya_share_contribution';
const PRISMA_DIRECTORY = join(__dirname, '..', '..', '..', 'prisma');

interface LegacyShare {
  cycleSequence: number;
  customerId: string;
  halves: number;
}

interface LegacyJameya {
  id: string;
  shareAmount: number;
  shares: LegacyShare[];
}

function databaseUrl(baseUrl: string, name: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

function prepareMigrationsFolder(includeContribution: boolean): string {
  const folder = mkdtempSync(join(tmpdir(), 'jameya-migration-'));
  cpSync(join(PRISMA_DIRECTORY, 'schema.prisma'), join(folder, 'schema.prisma'));
  for (const entry of readdirSync(join(PRISMA_DIRECTORY, 'migrations'))) {
    if (includeContribution || entry !== CONTRIBUTION_MIGRATION) {
      cpSync(join(PRISMA_DIRECTORY, 'migrations', entry), join(folder, 'migrations', entry), { recursive: true });
    }
  }
  return folder;
}

function deployMigrations(url: string, includeContribution: boolean): void {
  const folder = prepareMigrationsFolder(includeContribution);
  try {
    execSync(`npx prisma migrate deploy --schema "${join(folder, 'schema.prisma')}"`, {
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'pipe',
    });
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

async function insertLegacyJameya(
  client: PrismaClient,
  tenantId: string,
  shareAmount: number,
  turns: { customerId: string; halves: number }[][],
): Promise<LegacyJameya> {
  const jameya = await client.jameya.create({
    data: {
      tenantId,
      name: `Legacy ${shareAmount}`,
      shareAmount,
      shareCount: turns.length,
      recurrenceType: RecurrenceType.MONTHLY,
      firstDueDate: new Date('2026-09-01'),
    },
  });
  const cycles = await client.jameyaCycle.createManyAndReturn({
    data: turns.map((_, index) => ({
      tenantId,
      jameyaId: jameya.id,
      sequence: index + 1,
      dueDate: new Date(Date.UTC(2026, 8 + index, 1)),
      lateAfter: new Date(Date.UTC(2026, 8 + index, 1)),
    })),
    select: { id: true, sequence: true },
  });
  const shares = turns.flatMap((holders, index) =>
    holders.map((holder) => ({ cycleSequence: index + 1, ...holder })),
  );
  for (const share of shares) {
    const cycleId = cycles.find((cycle) => cycle.sequence === share.cycleSequence)?.id;
    const shareId = `share-${jameya.id}-${share.cycleSequence}-${share.customerId}`;
    await client.$executeRaw`
      INSERT INTO "JameyaShare" ("id", "tenantId", "jameyaId", "cycleId", "customerId", "halves")
      VALUES (${shareId}, ${tenantId}, ${jameya.id}, ${cycleId}, ${share.customerId}, ${share.halves})`;
  }
  const halvesByCustomer = new Map<string, number>();
  for (const share of shares) {
    halvesByCustomer.set(share.customerId, (halvesByCustomer.get(share.customerId) ?? 0) + share.halves);
  }
  await client.jameyaDue.createMany({
    data: cycles.flatMap((cycle) =>
      [...halvesByCustomer].map(([customerId, halves]) => ({
        tenantId,
        jameyaId: jameya.id,
        cycleId: cycle.id,
        customerId,
        amount: (shareAmount * halves) / 2,
      })),
    ),
  });
  return { id: jameya.id, shareAmount, shares };
}

async function payOldestFirst(
  client: PrismaClient,
  tenantId: string,
  jameyaId: string,
  customerId: string,
  amount: number,
) {
  const dues = await client.jameyaDue.findMany({
    where: { jameyaId, customerId },
    orderBy: { cycle: { sequence: 'asc' } },
  });
  const payment = await client.jameyaPayment.create({
    data: { tenantId, jameyaId, customerId, amount, balanceAfter: 0, clientRequestId: `${jameyaId}-${customerId}` },
  });
  let left = amount;
  for (const due of dues) {
    const applied = Math.min(left, due.amount - due.paidAmount);
    if (applied === 0) {
      continue;
    }
    left -= applied;
    await client.jameyaPaymentAllocation.create({
      data: { tenantId, paymentId: payment.id, dueId: due.id, amount: applied },
    });
    await client.jameyaDue.update({
      where: { id: due.id },
      data: {
        paidAmount: due.paidAmount + applied,
        status: due.paidAmount + applied === due.amount ? 'PAID' : 'PARTIALLY_PAID',
      },
    });
  }
}

async function seedLegacyShop(client: PrismaClient, paymentAmount: number) {
  const tenant = await client.tenant.create({
    data: { name: 'Legacy shop', slug: `legacy-${Date.now()}`, subscriptionExpiresOn: new Date('2030-01-01') },
  });
  const customers = await client.customer.createManyAndReturn({
    data: ['x', 'y', 'z', 'w'].map((name, index) => ({ tenantId: tenant.id, name, phone: `0100000000${index}` })),
    select: { id: true },
  });
  const [x, y, z, w] = customers.map((customer) => customer.id);
  const halfAndFull = await insertLegacyJameya(client, tenant.id, 100_000, [
    [{ customerId: x, halves: 2 }],
    [
      { customerId: y, halves: 1 },
      { customerId: z, halves: 1 },
    ],
    [{ customerId: w, halves: 2 }],
  ]);
  const fullOnly = await insertLegacyJameya(client, tenant.id, 250_000, [
    [{ customerId: x, halves: 2 }],
    [{ customerId: w, halves: 2 }],
  ]);
  await payOldestFirst(client, tenant.id, halfAndFull.id, y, paymentAmount);
  await payOldestFirst(client, tenant.id, halfAndFull.id, x, 100_000);
  const firstCycle = await client.jameyaCycle.findFirstOrThrow({ where: { jameyaId: halfAndFull.id, sequence: 1 } });
  await client.jameyaPayout.create({
    data: {
      tenantId: tenant.id,
      jameyaId: halfAndFull.id,
      cycleId: firstCycle.id,
      customerId: x,
      amount: 180_000,
      collectedAmount: 150_000,
      coveredAmount: 30_000,
      clientRequestId: `payout-${halfAndFull.id}`,
    },
  });
  return { tenantId: tenant.id, jameyas: [halfAndFull, fullOnly] };
}

async function storedDueAmounts(client: PrismaClient, jameyaId: string) {
  const dues = await client.jameyaDue.findMany({
    where: { jameyaId },
    orderBy: [{ cycle: { sequence: 'asc' } }, { customerId: 'asc' }],
    select: { customerId: true, amount: true, paidAmount: true, status: true, cycle: { select: { sequence: true } } },
  });
  return dues;
}

describe('Migration from half shares to contributions', () => {
  const baseUrl = prepareTestDatabase();
  const admin = new PrismaClient({ datasources: { db: { url: baseUrl } } });
  const databases = ['installment_contribution_ok_test', 'installment_contribution_guard_test'];

  beforeAll(async () => {
    for (const name of databases) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    }
  }, 60_000);

  afterAll(async () => {
    for (const name of databases) {
      await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    }
    await admin.$disconnect();
  });

  it('turns every half and full share into the same monthly amount and keeps every derived amount', async () => {
    const url = databaseUrl(baseUrl, databases[0]);
    deployMigrations(url, false);
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      const shop = await seedLegacyShop(client, 120_000);
      const duesBefore = await Promise.all(shop.jameyas.map((jameya) => storedDueAmounts(client, jameya.id)));

      deployMigrations(url, true);

      for (const [index, legacy] of shop.jameyas.entries()) {
        const row = await client.jameya.findUniqueOrThrow({ where: { id: legacy.id }, include: JAMEYA_DETAIL_INCLUDE });
        const detail = buildJameyaDetail(row, getUtcToday());
        const shareCount = detail.cycles.length;

        expect(detail.potAmount).toBe(legacy.shareAmount * shareCount);
        expect(
          detail.cycles.flatMap((cycle) =>
            cycle.holders.map((holder) => [
              cycle.sequence,
              holder.customerId,
              holder.contribution,
              holder.entitlementAmount,
            ]),
          ),
        ).toEqual(
          legacy.shares.map((share) => [
            share.cycleSequence,
            share.customerId,
            (legacy.shareAmount * share.halves) / 2,
            (legacy.shareAmount * shareCount * share.halves) / 2,
          ]),
        );
        for (const cycle of detail.cycles) {
          expect(cycle.holders.reduce((total, holder) => total + holder.entitlementAmount, 0)).toBe(detail.potAmount);
        }
        for (const member of detail.members) {
          const memberDues = detail.dues.filter((due) => due.customerId === member.customerId);
          expect(member.monthlyAmount * shareCount).toBe(memberDues.reduce((total, due) => total + due.amount, 0));
        }
        expect(await storedDueAmounts(client, legacy.id)).toEqual(duesBefore[index]);
      }

      const halfAndFull = buildJameyaDetail(
        await client.jameya.findUniqueOrThrow({ where: { id: shop.jameyas[0].id }, include: JAMEYA_DETAIL_INCLUDE }),
        getUtcToday(),
      );
      expect(halfAndFull.cycles[0].holders[0]).toMatchObject({
        contribution: 100_000,
        entitlementAmount: 300_000,
        paidOutAmount: 180_000,
        remainingAmount: 120_000,
      });
      expect(halfAndFull.cycles[1].holders.map((holder) => holder.entitlementAmount)).toEqual([150_000, 150_000]);
    } finally {
      await client.$disconnect();
    }
  }, 300_000);

  it('stops before changing anything when an amount is not whole pounds', async () => {
    const url = databaseUrl(baseUrl, databases[1]);
    deployMigrations(url, false);
    const client = new PrismaClient({ datasources: { db: { url } } });
    try {
      await seedLegacyShop(client, 120_050);

      let deployOutput = '';
      try {
        deployMigrations(url, true);
      } catch (error) {
        const { stdout, stderr } = error as { stdout?: Buffer; stderr?: Buffer };
        deployOutput = `${String(stdout)}${String(stderr)}`;
      }
      expect(deployOutput).toMatch(/Jameya amounts must be whole pounds/);

      const columns = await client.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns WHERE table_name = 'JameyaShare' ORDER BY column_name`;
      const constraints = await client.$queryRaw<{ conname: string }[]>`
        SELECT conname FROM pg_constraint WHERE conname LIKE '%whole_pounds' OR conname = 'JameyaShare_halves_valid'`;
      expect(columns.map((column) => column.column_name)).toContain('halves');
      expect(columns.map((column) => column.column_name)).not.toContain('contribution');
      expect(constraints.map((constraint) => constraint.conname)).toEqual(['JameyaShare_halves_valid']);
    } finally {
      await client.$disconnect();
    }
  }, 300_000);
});
