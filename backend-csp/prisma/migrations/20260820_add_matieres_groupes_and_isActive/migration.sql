-- CreateTable
CREATE TABLE "matieres_groupes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "matieres_groupes_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Matiere
ALTER TABLE "matieres" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "matieres" ADD COLUMN "groupeId" TEXT;

-- AlterTable: Inscription
ALTER TABLE "inscriptions" ADD COLUMN "langueChoisie" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "matieres_groupes_schoolId_nom_key" ON "matieres_groupes"("schoolId", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_schoolId_libelle_key" ON "matieres"("schoolId", "libelle");

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "matieres_groupes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres_groupes" ADD CONSTRAINT "matieres_groupes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
