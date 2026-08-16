-- CreateTable: IdempotencyKey
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
    "key" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key")
);

-- CreateIndex: cleanup old keys
CREATE INDEX IF NOT EXISTS "idempotency_keys_createdAt_idx" ON "idempotency_keys"("createdAt");

-- D.2 Performance indexes (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS "notes_schoolId_anneeScolaire_idx" ON "notes"("schoolId", "anneeScolaire");
CREATE INDEX IF NOT EXISTS "versements_schoolId_anneeScolaire_idx" ON "versements"("schoolId", "anneeScolaire");
CREATE INDEX IF NOT EXISTS "inscriptions_schoolId_anneeScolaire_idx" ON "inscriptions"("schoolId", "anneeScolaire");
CREATE INDEX IF NOT EXISTS "eleves_schoolId_nom_idx" ON "eleves"("schoolId", "nom");
CREATE INDEX IF NOT EXISTS "annonces_schoolId_date_idx" ON "annonces"("schoolId", "date");
