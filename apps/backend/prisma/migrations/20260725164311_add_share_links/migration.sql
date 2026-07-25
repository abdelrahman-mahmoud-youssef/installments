-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "targetPath" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_code_key" ON "ShareLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tenantId_targetPath_key" ON "ShareLink"("tenantId", "targetPath");

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
