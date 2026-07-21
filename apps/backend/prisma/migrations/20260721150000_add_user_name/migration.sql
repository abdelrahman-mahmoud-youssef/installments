-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;
UPDATE "User" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "userName" TEXT;
UPDATE "AuditLog" SET "userName" = "userEmail" WHERE "userName" IS NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "userName" SET NOT NULL;
