/*
  Warnings:

  - You are about to drop the column `quantity` on the `PurchaseItem` table. All the data in the column will be lost.
  - Added the required column `orderedQty` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedQty` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usableQty` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PurchaseItem" DROP COLUMN "quantity",
ADD COLUMN     "defectQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "orderedQty" INTEGER NOT NULL,
ADD COLUMN     "receivedQty" INTEGER NOT NULL,
ADD COLUMN     "usableQty" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."DefectItem" (
    "id" SERIAL NOT NULL,
    "purchaseItemId" INTEGER NOT NULL,
    "reason" TEXT,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DefectItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."DefectItem" ADD CONSTRAINT "DefectItem_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "public"."PurchaseItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
