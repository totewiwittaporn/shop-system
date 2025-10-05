-- CreateTable
CREATE TABLE "public"."StockIssueDraft" (
    "id" SERIAL NOT NULL,
    "fromBranchId" INTEGER NOT NULL,
    "toShopId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockIssueDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockIssueDraftLine" (
    "id" SERIAL NOT NULL,
    "draftId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "StockIssueDraftLine_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."StockIssueDraftLine" ADD CONSTRAINT "StockIssueDraftLine_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "public"."StockIssueDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockIssueDraftLine" ADD CONSTRAINT "StockIssueDraftLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
