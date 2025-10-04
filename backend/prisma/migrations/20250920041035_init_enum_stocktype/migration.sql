/*
  Warnings:

  - You are about to drop the column `stockType` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `stockType` on the `Stock` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[branchProductId,StockLocation]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."StockLocation" AS ENUM ('MAIN', 'BRANCH', 'CONSIGN');

-- CreateEnum
CREATE TYPE "public"."DeliveryStockType" AS ENUM ('NORMAL', 'CONSIGNMENT');

-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('PENDING', 'SHIPPED', 'RECEIVED', 'CANCELED');

-- DropIndex
DROP INDEX "public"."Stock_branchProductId_stockType_key";

-- AlterTable
ALTER TABLE "public"."DeliveryDoc" ADD COLUMN     "status" "public"."DeliveryStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."DeliveryLine" ADD COLUMN     "deliveryStockType" "public"."DeliveryStockType" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "public"."PurchaseItem" DROP COLUMN "stockType",
ADD COLUMN     "StockLocation" "public"."StockLocation" NOT NULL DEFAULT 'MAIN';

-- AlterTable
ALTER TABLE "public"."Stock" DROP COLUMN "stockType",
ADD COLUMN     "StockLocation" "public"."StockLocation" NOT NULL DEFAULT 'MAIN';

-- DropEnum
DROP TYPE "public"."StockType";

-- CreateIndex
CREATE UNIQUE INDEX "Stock_branchProductId_StockLocation_key" ON "public"."Stock"("branchProductId", "StockLocation");
