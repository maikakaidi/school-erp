-- AlterTable: Add anneeScolaire column to Absences
ALTER TABLE "absences" ADD COLUMN "anneeScolaire" TEXT;

-- CreateIndex: Composite index for year-filtered absence queries
CREATE INDEX "absences_schoolId_anneeScolaire_date_idx" ON "absences"("schoolId", "anneeScolaire", "date");
