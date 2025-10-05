/*
  Warnings:

  - A unique constraint covering the columns `[scope,name]` on the table `DeliveryTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."DeliveryTemplate" DROP CONSTRAINT "DeliveryTemplate_branchId_fkey";

-- DropIndex
DROP INDEX "public"."DeliveryTemplate_branchId_name_key";

-- AlterTable
ALTER TABLE "public"."DeliveryTemplate" ADD COLUMN     "consignmentShopId" INTEGER,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
ALTER COLUMN "branchId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DeliveryTemplate_scope_idx" ON "public"."DeliveryTemplate"("scope");

-- CreateIndex
CREATE INDEX "DeliveryTemplate_branchId_idx" ON "public"."DeliveryTemplate"("branchId");

-- CreateIndex
CREATE INDEX "DeliveryTemplate_consignmentShopId_idx" ON "public"."DeliveryTemplate"("consignmentShopId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTemplate_scope_name_key" ON "public"."DeliveryTemplate"("scope", "name");

-- AddForeignKey
ALTER TABLE "public"."DeliveryTemplate" ADD CONSTRAINT "DeliveryTemplate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryTemplate" ADD CONSTRAINT "DeliveryTemplate_consignmentShopId_fkey" FOREIGN KEY ("consignmentShopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
