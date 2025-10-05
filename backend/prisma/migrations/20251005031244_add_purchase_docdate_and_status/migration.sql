-- Placeholder to realign local migrations with DB state.
-- Safe to keep even if DB already has these changes.

-- Ensure Purchase.docDate exists
ALTER TABLE "Purchase"
ADD COLUMN IF NOT EXISTS "docDate" TIMESTAMP NOT NULL DEFAULT NOW();

-- Ensure enum value PENDING exists
ALTER TYPE "PurchaseStatus" ADD VALUE IF NOT EXISTS 'PENDING';
