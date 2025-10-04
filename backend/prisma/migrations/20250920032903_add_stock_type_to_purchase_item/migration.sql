-- AlterTable
ALTER TABLE "public"."PurchaseItem" ADD COLUMN     "stockType" "public"."StockType" NOT NULL DEFAULT 'MAIN';
