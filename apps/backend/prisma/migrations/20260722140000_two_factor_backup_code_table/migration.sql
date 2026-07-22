-- CreateTable
CREATE TABLE "TwoFactorBackupCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TwoFactorBackupCode_userId_usedAt_idx" ON "TwoFactorBackupCode"("userId", "usedAt");

-- AddForeignKey
ALTER TABLE "TwoFactorBackupCode" ADD CONSTRAINT "TwoFactorBackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing hashes were always unconsumed (the array was spliced on
-- use), so every backfilled row is unused.
INSERT INTO "TwoFactorBackupCode" ("id", "userId", "codeHash", "createdAt")
SELECT gen_random_uuid()::text, u."id", hash, u."createdAt"
FROM "User" u, LATERAL unnest(u."twoFactorBackupCodeHashes") AS hash
WHERE array_length(u."twoFactorBackupCodeHashes", 1) > 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "twoFactorBackupCodeHashes";
