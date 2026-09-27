-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'DISPATCH';

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "dispatchedToId" TEXT;

-- CreateIndex
CREATE INDEX "Delivery_dispatchedToId_idx" ON "Delivery"("dispatchedToId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_dispatchedToId_fkey" FOREIGN KEY ("dispatchedToId") REFERENCES "BusinessMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
