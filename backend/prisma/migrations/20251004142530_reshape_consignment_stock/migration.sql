/*
  Warnings:

  - The values [CONSIGN] on the enum `StockLocation` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StockLocation_new" AS ENUM ('MAIN', 'BRANCH');
ALTER TABLE "public"."PurchaseItem" ALTER COLUMN "StockLocation" DROP DEFAULT;
ALTER TABLE "public"."Stock" ALTER COLUMN "StockLocation" DROP DEFAULT;
ALTER TABLE "public"."Stock" ALTER COLUMN "StockLocation" TYPE "public"."StockLocation_new" USING ("StockLocation"::text::"public"."StockLocation_new");
ALTER TABLE "public"."PurchaseItem" ALTER COLUMN "StockLocation" TYPE "public"."StockLocation_new" USING ("StockLocation"::text::"public"."StockLocation_new");
ALTER TYPE "public"."StockLocation" RENAME TO "StockLocation_old";
ALTER TYPE "public"."StockLocation_new" RENAME TO "StockLocation";
DROP TYPE "public"."StockLocation_old";
ALTER TABLE "public"."PurchaseItem" ALTER COLUMN "StockLocation" SET DEFAULT 'MAIN';
ALTER TABLE "public"."Stock" ALTER COLUMN "StockLocation" SET DEFAULT 'MAIN';
COMMIT;

-- CreateTable
CREATE TABLE "public"."ConsignmentStock" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsignmentStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsignmentStock_shopId_idx" ON "public"."ConsignmentStock"("shopId");

-- CreateIndex
CREATE INDEX "ConsignmentStock_productId_idx" ON "public"."ConsignmentStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentStock_shopId_productId_key" ON "public"."ConsignmentStock"("shopId", "productId");

-- AddForeignKey
ALTER TABLE "public"."ConsignmentStock" ADD CONSTRAINT "ConsignmentStock_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentStock" ADD CONSTRAINT "ConsignmentStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
