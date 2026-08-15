-- AlterTable
-- Le numéro de reçu devient unique par école (séquentiel REC-YYYY-NNNN)
-- au lieu de global, pour permettre des numéros lisibles par établissement.

-- DropIndex
DROP INDEX "versements_recuNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "versements_schoolId_recuNumber_key" ON "versements"("schoolId", "recuNumber");

-- CreateIndex
CREATE INDEX "versements_schoolId_idx" ON "versements"("schoolId");
