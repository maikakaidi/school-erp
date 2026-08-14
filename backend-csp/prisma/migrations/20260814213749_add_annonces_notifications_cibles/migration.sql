-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "recipientId" TEXT,
ADD COLUMN     "recipientType" TEXT;

-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "cible" TEXT NOT NULL DEFAULT 'ecole',
    "classeId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonce_reads" (
    "id" TEXT NOT NULL,
    "annonceId" TEXT NOT NULL,
    "readerType" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonce_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annonces_schoolId_idx" ON "annonces"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "annonce_reads_annonceId_readerType_readerId_key" ON "annonce_reads"("annonceId", "readerType", "readerId");

-- CreateIndex
CREATE INDEX "notifications_recipientType_recipientId_idx" ON "notifications"("recipientType", "recipientId");

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonce_reads" ADD CONSTRAINT "annonce_reads_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
