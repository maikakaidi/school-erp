-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "logo" TEXT,
    "slogan" TEXT,
    "address" TEXT,
    "email" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "signature" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "lieuNaissance" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL,
    "telephone" TEXT,
    "photoUrl" TEXT,
    "nomParent" TEXT NOT NULL,
    "adresseParent" TEXT NOT NULL,
    "telParent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignants" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "specialite" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enseignants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "capacite" INTEGER,
    "anneeScolaire" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coefficients" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL,
    "anneeScolaire" TEXT NOT NULL,

    CONSTRAINT "coefficients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "reduction" DOUBLE PRECISION,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "devoir1" DOUBLE PRECISION,
    "devoir2" DOUBLE PRECISION,
    "composition" DOUBLE PRECISION,
    "moyenne" DOUBLE PRECISION,
    "rang" INTEGER,
    "appreciation" TEXT,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versements" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "tranche" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "reduction" DOUBLE PRECISION,
    "montantPaye" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL,
    "recuNumber" TEXT NOT NULL,
    "commentaire" TEXT,

    CONSTRAINT "versements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depenses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "rubrique" TEXT NOT NULL,
    "dateDepense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pieceJointe" TEXT,

    CONSTRAINT "depenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens_blancs" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "classeId" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,

    CONSTRAINT "examens_blancs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens_salles" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "nomSalle" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,

    CONSTRAINT "examens_salles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens_resultats" (
    "id" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "note" DOUBLE PRECISION NOT NULL,
    "rang" INTEGER,

    CONSTRAINT "examens_resultats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplois_temps" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "enseignantId" TEXT,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT,

    CONSTRAINT "emplois_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#10B981',
    "logoUrl" TEXT,
    "slogan" TEXT,
    "signature" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "bulletinFormat" TEXT,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_phone_key" ON "super_admins"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "schools_phone_key" ON "schools"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_matricule_key" ON "eleves"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_schoolId_matricule_key" ON "eleves"("schoolId", "matricule");

-- CreateIndex
CREATE UNIQUE INDEX "coefficients_classeId_matiereId_anneeScolaire_key" ON "coefficients"("classeId", "matiereId", "anneeScolaire");

-- CreateIndex
CREATE UNIQUE INDEX "notes_eleveId_matiereId_semestre_anneeScolaire_key" ON "notes"("eleveId", "matiereId", "semestre", "anneeScolaire");

-- CreateIndex
CREATE UNIQUE INDEX "versements_recuNumber_key" ON "versements"("recuNumber");

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_schoolId_key" ON "school_settings"("schoolId");

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignants" ADD CONSTRAINT "enseignants_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coefficients" ADD CONSTRAINT "coefficients_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coefficients" ADD CONSTRAINT "coefficients_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements" ADD CONSTRAINT "versements_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements" ADD CONSTRAINT "versements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depenses" ADD CONSTRAINT "depenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_blancs" ADD CONSTRAINT "examens_blancs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_blancs" ADD CONSTRAINT "examens_blancs_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_salles" ADD CONSTRAINT "examens_salles_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examens_blancs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_resultats" ADD CONSTRAINT "examens_resultats_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examens_blancs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_resultats" ADD CONSTRAINT "examens_resultats_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens_resultats" ADD CONSTRAINT "examens_resultats_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_temps" ADD CONSTRAINT "emplois_temps_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_temps" ADD CONSTRAINT "emplois_temps_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_temps" ADD CONSTRAINT "emplois_temps_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
