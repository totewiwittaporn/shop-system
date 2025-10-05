/*
  Warnings:

  - You are about to drop the column `branchId` on the `ConsignedProduct` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ConsignedProduct` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,productId]` on the table `ConsignedProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ConsignedProduct" DROP CONSTRAINT "ConsignedProduct_branchId_fkey";

-- DropIndex
DROP INDEX "public"."ConsignedProduct_branchId_idx";

-- DropIndex
DROP INDEX "public"."ConsignedProduct_shopId_branchId_productId_key";

-- AlterTable
ALTER TABLE "public"."ConsignedProduct" DROP COLUMN "branchId",
DROP COLUMN "quantity",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "ConsignedProduct_shopId_productId_key" ON "public"."ConsignedProduct"("shopId", "productId");
