-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId");

-- AlterTable (make passwordHash optional for Google-only users)
ALTER TABLE "public"."User" ALTER COLUMN "passwordHash" SET DEFAULT '';
