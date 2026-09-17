-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "taxRemitted" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRemittedAt" TIMESTAMP(3);
