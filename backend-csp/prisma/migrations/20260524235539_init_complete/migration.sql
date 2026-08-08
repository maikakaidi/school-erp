/*
  Warnings:

  - You are about to drop the `emplois_temps` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "emplois_temps" DROP CONSTRAINT "emplois_temps_classeId_fkey";

-- DropForeignKey
ALTER TABLE "emplois_temps" DROP CONSTRAINT "emplois_temps_enseignantId_fkey";

-- DropForeignKey
ALTER TABLE "emplois_temps" DROP CONSTRAINT "emplois_temps_matiereId_fkey";

-- DropForeignKey
ALTER TABLE "frais_scolaires" DROP CONSTRAINT "frais_scolaires_classeId_fkey";

-- DropForeignKey
ALTER TABLE "salaires" DROP CONSTRAINT "salaires_enseignantId_fkey";

-- DropTable
DROP TABLE "emplois_temps";

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frais_scolaires" ADD CONSTRAINT "frais_scolaires_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
