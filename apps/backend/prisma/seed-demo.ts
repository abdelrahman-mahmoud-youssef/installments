import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getUtcToday } from '../src/common/date/utc-date';
import { ARABIC_ELECTRONICS_PROFILE } from './demo/arabic-electronics-profile';
import { ARABIC_MOBILES_PROFILE } from './demo/arabic-mobiles-profile';
import { ENGLISH_DIGITAL_HUB_PROFILE } from './demo/english-digital-hub-profile';
import { seedDemoShop } from './demo/seed-demo-shop';

const PASSWORD_HASH_ROUNDS = 10;
const DEMO_PROFILES = [ARABIC_MOBILES_PROFILE, ARABIC_ELECTRONICS_PROFILE, ENGLISH_DIGITAL_HUB_PROFILE];

const prisma = new PrismaClient();

async function seedDemoShops(): Promise<void> {
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error('Set DEMO_PASSWORD to the password the demo staff accounts should use.');
  }
  const passwordHash = await bcrypt.hash(demoPassword, PASSWORD_HASH_ROUNDS);
  const today = getUtcToday();

  for (const profile of DEMO_PROFILES) {
    const summary = await seedDemoShop(prisma, profile, today, passwordHash);
    if (!summary) {
      console.log(`Skipped "${profile.tenant.name}": it already exists.`);
      continue;
    }
    console.log(
      `Seeded "${summary.shopName}" (${summary.slug}): ${summary.customerCount} customers, ${summary.contractCount} contracts, ${summary.paymentCount} payments.`,
    );
    console.log(`  Staff logins: ${summary.staffEmails.join(', ')}`);
  }
}

seedDemoShops()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
