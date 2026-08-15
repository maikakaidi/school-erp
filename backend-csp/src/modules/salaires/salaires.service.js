import prisma from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// Calculer les heures d'un enseignant vacataire sur un mois
const calculerHeuresMensuelles = async (schoolId, enseignantId, mois, annee) => {
  const horaires = await prisma.horaireEnseignant.findMany({
    where: { schoolId, enseignantId, mois, annee },
  });
  let totalHeures = 0;
  for (const h of horaires) {
    const [hd, md] = h.heureDebut.split(':').map(Number);
    const [hf, mf] = h.heureFin.split(':').map(Number);
    const duree = (hf * 60 + mf - (hd * 60 + md)) / 60;
    totalHeures += duree;
  }
  return totalHeures;
};

// Calculer le salaire d'un enseignant (vacataire ou permanent)
export const calculerSalaireEnseignant = async (schoolId, enseignantId, mois, annee) => {
  const enseignant = await prisma.enseignant.findFirst({ where: { id: enseignantId, schoolId } });
  if (!enseignant) throw new Error('Enseignant non trouvé');

  let base = 0;
  let prime = 0;
  let heures = 0;
  let taux = 0;

  if (enseignant.estVacataire) {
    heures = await calculerHeuresMensuelles(schoolId, enseignantId, mois, annee);
    taux = enseignant.tauxHoraire || 0;
    base = heures * taux;
  } else {
    base = enseignant.salaireFixe || 0;
  }

  // Prime d'ancienneté (5% par an après 2 ans, max 30%)
  const anciennete = enseignant.anciennete || 0;
  if (anciennete >= 2) {
    let tauxPrime = Math.min(anciennete * 0.05, 0.30);
    prime = base * tauxPrime;
  }

  const totalBrut = base + prime;

  // Récupérer les avances non remboursées
  const avances = await prisma.avanceSalaire.findMany({
    where: { schoolId, enseignantId, rembourse: false },
  });
  let totalAvances = avances.reduce((sum, a) => sum + a.montant, 0);

  let net = totalBrut - totalAvances;
  if (net < 0) {
    // Reporter le reliquat sur la première avance
    const restant = -net;
    if (avances.length > 0) {
      await prisma.avanceSalaire.update({
        where: { id: avances[0].id },
        data: { montant: restant },
      });
    } else {
      await prisma.avanceSalaire.create({
        data: { schoolId, enseignantId, montant: restant, demandeDate: new Date(), accordDate: new Date(), remarque: 'Reliquat d\'avance' },
      });
    }
    net = 0;
  } else {
    // Rembourser toutes les avances
    for (const av of avances) {
      await prisma.avanceSalaire.update({ where: { id: av.id }, data: { rembourse: true } });
    }
  }

  const salaire = await prisma.salary.upsert({
    where: { schoolId_enseignantId_mois_annee_type: { schoolId, enseignantId, mois, annee, type: 'normale' } },
    update: { base, primeAnciennete: prime, total: net },
    create: { schoolId, enseignantId, mois, annee, type: 'normale', base, primeAnciennete: prime, total: net },
  });
  return salaire;
};

// Calculer tous les salaires d'un mois
export const calculerTousSalaires = async (schoolId, mois, annee) => {
  const enseignants = await prisma.enseignant.findMany({ where: { schoolId, isActive: true } });
  const results = [];
  for (const ens of enseignants) {
    const salaire = await calculerSalaireEnseignant(schoolId, ens.id, mois, annee);
    results.push(salaire);
  }
  return results;
};

// Récupérer les salaires
export const getSalaires = async (schoolId, mois, annee) => {
  return await prisma.salary.findMany({
    where: { schoolId, mois, annee, type: 'normale' },
    include: { enseignant: true },
    orderBy: { enseignant: { nom: 'asc' } },
  });
};

// Marquer payé et générer reçu
export const marquerPaye = async (id, schoolId) => {
  const salaire = await prisma.salary.findFirst({ where: { id, schoolId } });
  if (!salaire) throw new Error('Salaire non trouvé');
  return await prisma.salary.update({
    where: { id },
    data: { isPaid: true, paidAt: new Date() },
  });
};

// Avances
export const creerAvance = async (schoolId, enseignantId, montant, remarque = '') => {
  if (montant <= 0) throw new Error('Le montant doit être positif');
  const enseignant = await prisma.enseignant.findFirst({ where: { id: enseignantId, schoolId } });
  if (!enseignant) throw new Error('Enseignant non trouvé');
  return await prisma.avanceSalaire.create({
    data: { schoolId, enseignantId, montant, demandeDate: new Date(), accordDate: new Date(), remarque },
  });
};

export const getAvances = async (schoolId, enseignantId = null) => {
  const where = { schoolId, rembourse: false };
  if (enseignantId) where.enseignantId = enseignantId;
  return await prisma.avanceSalaire.findMany({
    where,
    include: { enseignant: true },
    orderBy: { demandeDate: 'desc' },
  });
};

// Génération reçu PDF
export const generateReçuPDF = async (salaireId, schoolId) => {
  const salaire = await prisma.salary.findFirst({
    where: { id: salaireId, schoolId },
    include: { enseignant: true, school: true },
  });
  if (!salaire) throw new Error('Salaire non trouvé');
  const school = salaire.school;
  const enseignant = salaire.enseignant;

  const doc = new PDFDocument({ margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  doc.fontSize(16).text('REÇU DE PAIEMENT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Établissement : ${school.name}`);
  doc.text(`Enseignant : ${enseignant.nom} ${enseignant.prenom}`);
  doc.text(`Mois : ${salaire.mois}/${salaire.annee}`);
  doc.text(`Type : ${salaire.type === 'normale' ? 'Salaire mensuel' : 'Avance sur salaire'}`);
  doc.text(`Montant brut : ${salaire.base} FCFA`);
  if (salaire.primeAnciennete) doc.text(`Prime ancienneté : ${salaire.primeAnciennete} FCFA`);
  doc.text(`Net à payer : ${salaire.total} FCFA`);
  doc.text(`Date de paiement : ${salaire.paidAt ? new Date(salaire.paidAt).toLocaleDateString() : 'Non encore payé'}`);
  doc.moveDown();
  doc.fontSize(10).text('Cachet et signature', { align: 'right' });

  doc.end();
  return stream;
};