/*
  Warnings:

  - You are about to drop the column `branchId` on the `DeliveryDoc` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `DeliveryDoc` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `DeliveryDoc` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `StockIssueDraft` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,productId]` on the table `ConsignedProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[docNo]` on the table `ConsignmentInvoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `issueDate` to the `ConsignmentInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ConsignmentInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `DeliveryLine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SaleChannel" AS ENUM ('BRANCH_POS', 'CONSIGNMENT_POS');

-- CreateEnum
CREATE TYPE "public"."DeliveryStockType" AS ENUM ('NORMAL', 'CONSIGNMENT');

-- DropForeignKey
ALTER TABLE "public"."ConsignedProduct" DROP CONSTRAINT "ConsignedProduct_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeliveryDoc" DROP CONSTRAINT "DeliveryDoc_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeliveryLine" DROP CONSTRAINT "DeliveryLine_productId_fkey";

-- AlterTable
ALTER TABLE "public"."ConsignedProduct" ALTER COLUMN "branchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ConsignmentInvoice" ADD COLUMN     "backdateReason" TEXT,
ADD COLUMN     "docNo" TEXT,
ADD COLUMN     "isBackdated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "issuedBy" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "templateId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."DeliveryDoc" DROP COLUMN "branchId",
DROP COLUMN "createdBy",
DROP COLUMN "updatedAt",
ADD COLUMN     "fromBranchId" INTEGER;

-- AlterTable
ALTER TABLE "public"."DeliveryLine" DROP COLUMN "code",
DROP COLUMN "name",
DROP COLUMN "qty",
ADD COLUMN     "deliveryStockType" "public"."DeliveryStockType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "partnerCategoryCode" TEXT,
ADD COLUMN     "partnerCategoryName" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "sku" TEXT,
ALTER COLUMN "unitPrice" DROP NOT NULL,
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Sale" ADD COLUMN     "channel" "public"."SaleChannel" NOT NULL DEFAULT 'BRANCH_POS',
ADD COLUMN     "shopId" INTEGER;

-- AlterTable
ALTER TABLE "public"."StockIssueDraft" DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "public"."ConsignmentBillTemplate" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsignmentBillTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopCategory" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopProductMap" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "shopCategoryId" INTEGER,
    "shopSku" TEXT,
    "shopName" TEXT,
    "priceOverride" DOUBLE PRECISION,

    CONSTRAINT "ShopProductMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsignmentBillTemplate_shopId_idx" ON "public"."ConsignmentBillTemplate"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentBillTemplate_shopId_name_key" ON "public"."ConsignmentBillTemplate"("shopId", "name");

-- CreateIndex
CREATE INDEX "ShopCategory_shopId_idx" ON "public"."ShopCategory"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopCategory_shopId_code_key" ON "public"."ShopCategory"("shopId", "code");

-- CreateIndex
CREATE INDEX "ShopProductMap_shopId_shopCategoryId_idx" ON "public"."ShopProductMap"("shopId", "shopCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopProductMap_shopId_productId_key" ON "public"."ShopProductMap"("shopId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignedProduct_shopId_productId_key" ON "public"."ConsignedProduct"("shopId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsignmentInvoice_docNo_key" ON "public"."ConsignmentInvoice"("docNo");

-- CreateIndex
CREATE INDEX "Sale_shopId_idx" ON "public"."Sale"("shopId");

-- CreateIndex
CREATE INDEX "Sale_channel_idx" ON "public"."Sale"("channel");

-- AddForeignKey
ALTER TABLE "public"."StockIssueDraft" ADD CONSTRAINT "StockIssueDraft_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockIssueDraft" ADD CONSTRAINT "StockIssueDraft_toShopId_fkey" FOREIGN KEY ("toShopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryDoc" ADD CONSTRAINT "DeliveryDoc_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignedProduct" ADD CONSTRAINT "ConsignedProduct_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentInvoice" ADD CONSTRAINT "ConsignmentInvoice_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentInvoice" ADD CONSTRAINT "ConsignmentInvoice_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ConsignmentBillTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsignmentBillTemplate" ADD CONSTRAINT "ConsignmentBillTemplate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopCategory" ADD CONSTRAINT "ShopCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopProductMap" ADD CONSTRAINT "ShopProductMap_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopProductMap" ADD CONSTRAINT "ShopProductMap_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopProductMap" ADD CONSTRAINT "ShopProductMap_shopCategoryId_fkey" FOREIGN KEY ("shopCategoryId") REFERENCES "public"."ShopCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
