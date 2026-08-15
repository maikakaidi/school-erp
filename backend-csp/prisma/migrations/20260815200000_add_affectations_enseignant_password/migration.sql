-- AlterTable
ALTER TABLE "enseignants" ADD COLUMN     "password" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "enseignants_schoolId_telephone_key" ON "enseignants"("schoolId", "telephone");

-- CreateTable
CREATE TABLE "affectations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affectations_enseignantId_classeId_matiereId_key" ON "affectations"("enseignantId", "classeId", "matiereId");

-- CreateIndex
CREATE INDEX "affectations_schoolId_idx" ON "affectations"("schoolId");

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
