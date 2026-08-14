-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "motif" TEXT,
    "justifie" BOOLEAN NOT NULL DEFAULT false,
    "statutJustificatif" TEXT NOT NULL DEFAULT 'non_justifie',
    "enregistrePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absences_schoolId_date_idx" ON "absences"("schoolId", "date");

-- CreateIndex
CREATE INDEX "absences_eleveId_date_idx" ON "absences"("eleveId", "date");

-- CreateIndex
CREATE INDEX "absences_classeId_date_idx" ON "absences"("classeId", "date");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
