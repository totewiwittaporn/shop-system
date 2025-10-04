-- CreateEnum
CREATE TYPE "public"."BranchType" AS ENUM ('HEAD', 'BRANCH');

-- CreateEnum
CREATE TYPE "public"."ConsignmentShopType" AS ENUM ('HEAD', 'BRANCH');

-- AlterTable
ALTER TABLE "public"."Branch" ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "type" "public"."BranchType" NOT NULL DEFAULT 'BRANCH';

-- AlterTable
ALTER TABLE "public"."ConsignmentShop" ADD COLUMN     "type" "public"."ConsignmentShopType" NOT NULL DEFAULT 'BRANCH';
