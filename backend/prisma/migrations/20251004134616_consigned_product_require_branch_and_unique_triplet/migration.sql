/*
  Warnings:

  - A unique constraint covering the columns `[shopId,branchId,productId]` on the table `ConsignedProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."ConsignedProduct_shopId_productId_key";

-- CreateIndex
CREATE INDEX "ConsignedProduct_shopId_idx" ON "public"."ConsignedProduct"("shopId");

-- CreateIndex
CREATE INDEX "ConsignedProduct_branchId_idx" ON "public"."ConsignedProduct"("branchId");

-- CreateIndex
CREATE INDEX "ConsignedProduct_productId_idx" ON "public"."ConsignedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignedProduct_shopId_branchId_productId_key" ON "public"."ConsignedProduct"("shopId", "branchId", "productId");
