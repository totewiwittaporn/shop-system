/*
  Warnings:

  - You are about to drop the column `transferId` on the `DeliveryDoc` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryStockType` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `DeliveryLine` table. All the data in the column will be lost.
  - You are about to drop the `Transfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransferItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `branchId` to the `DeliveryDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `DeliveryDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `DeliveryDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DeliveryDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `DeliveryLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `DeliveryLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qty` to the `DeliveryLine` table without a default value. This is not possible if the table is not empty.
  - Made the column `unitPrice` on table `DeliveryLine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `DeliveryLine` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `StockIssueDraft` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DeliveryDoc" DROP CONSTRAINT "DeliveryDoc_transferId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_fromBranchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transfer" DROP CONSTRAINT "Transfer_toBranchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TransferItem" DROP CONSTRAINT "TransferItem_branchProductId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TransferItem" DROP CONSTRAINT "TransferItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TransferItem" DROP CONSTRAINT "TransferItem_transferId_fkey";

-- DropIndex
DROP INDEX "public"."DeliveryDoc_transferId_key";

-- AlterTable
ALTER TABLE "public"."DeliveryDoc" DROP COLUMN "transferId",
ADD COLUMN     "branchId" INTEGER NOT NULL,
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "shopId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."DeliveryLine" DROP COLUMN "deliveryStockType",
DROP COLUMN "description",
DROP COLUMN "productName",
DROP COLUMN "quantity",
DROP COLUMN "sku",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD COLUMN     "qty" INTEGER NOT NULL,
ALTER COLUMN "unitPrice" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."StockIssueDraft" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."Transfer";

-- DropTable
DROP TABLE "public"."TransferItem";

-- DropEnum
DROP TYPE "public"."DeliveryStockType";

-- DropEnum
DROP TYPE "public"."TransferStatus";

-- AddForeignKey
ALTER TABLE "public"."DeliveryDoc" ADD CONSTRAINT "DeliveryDoc_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryDoc" ADD CONSTRAINT "DeliveryDoc_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."ConsignmentShop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryLine" ADD CONSTRAINT "DeliveryLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
