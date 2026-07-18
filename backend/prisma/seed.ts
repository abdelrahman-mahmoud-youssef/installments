import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_TENANT_NAME = 'Demo Business';
const SEED_ADMIN_EMAIL = 'admin@demo.com';
const SEED_ADMIN_PASSWORD = 'password123';

async function seed(): Promise<void> {
  const existingAdmin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (existingAdmin) {
    console.log(`Seed skipped: ${SEED_ADMIN_EMAIL} already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: SEED_TENANT_NAME,
      users: { create: { email: SEED_ADMIN_EMAIL, passwordHash } },
    },
  });

  console.log(`Seeded tenant "${tenant.name}" with admin ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
