-- AlterTable
ALTER TABLE "enseignants" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "conversationKey" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_schoolId_conversationKey_createdAt_idx" ON "messages"("schoolId", "conversationKey", "createdAt");

-- CreateIndex
CREATE INDEX "messages_schoolId_isRead_idx" ON "messages"("schoolId", "isRead");

-- CreateIndex
CREATE INDEX "enseignants_schoolId_idx" ON "enseignants"("schoolId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
