/*
  Warnings:

  - A unique constraint covering the columns `[branchId,name]` on the table `DeliveryTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `DeliveryTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DeliveryTemplate" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryTemplate_branchId_name_key" ON "public"."DeliveryTemplate"("branchId", "name");
