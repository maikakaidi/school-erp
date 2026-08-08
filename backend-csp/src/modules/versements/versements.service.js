import prisma from '../../config/database.js';
import { randomBytes } from 'crypto';
import { createNotification } from '../notifications/notifications.service.js';

const generateReceiptNumber = () => `REC-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

export const createVersement = async (schoolId, data) => {
  const recuNumber = generateReceiptNumber();
  const montantPaye = data.montant - (data.reduction || 0);
  // Vérifier que l'élève appartient bien à l'école
  const eleve = await prisma.eleve.findFirst({ where: { id: data.eleveId, schoolId } });
  if (!eleve) throw new Error('Élève non trouvé');

  const versement = await prisma.versement.create({
    data: {
      schoolId,
      eleveId: data.eleveId,
      anneeScolaire: data.anneeScolaire,
      tranche: data.tranche,
      montant: data.montant,
      reduction: data.reduction || 0,
      montantPaye,
      modePaiement: data.modePaiement,
      recuNumber,
      commentaire: data.commentaire,
    },
  });

  createNotification(schoolId, {
    type: 'versement',
    title: 'Paiement reçu',
    message: `${eleve.nom} ${eleve.prenom} — Tranche ${data.tranche}: ${montantPaye.toLocaleString('fr-FR')} FCFA (${data.modePaiement})`,
    link: '/versements',
  }).catch(() => {});

  return versement;
};

export const getVersementsByEleve = async (schoolId, eleveId, anneeScolaire) => {
  return await prisma.versement.findMany({
    where: { schoolId, eleveId, anneeScolaire },
    orderBy: { datePaiement: 'asc' },
  });
};

export const getSituationFinanciere = async (schoolId, eleveId, anneeScolaire, fraisTotalParAn = 300000) => {
  const versements = await getVersementsByEleve(schoolId, eleveId, anneeScolaire);
  const totalPaye = versements.reduce((sum, v) => sum + v.montantPaye, 0);
  const reste = fraisTotalParAn - totalPaye;
  return {
    eleveId,
    anneeScolaire,
    fraisTotal: fraisTotalParAn,
    totalPaye,
    resteAPayer: reste > 0 ? reste : 0,
    versements,
  };
};

export const exportVersements = async (schoolId, anneeScolaire) => {
  const where = { schoolId };
  if (anneeScolaire) where.anneeScolaire = anneeScolaire;
  const versements = await prisma.versement.findMany({
    where,
    include: { eleve: true },
    orderBy: { datePaiement: 'desc' },
  });
  return versements.map(v => ({
    Date: new Date(v.datePaiement).toLocaleDateString('fr-FR'),
    Élève: `${v.eleve.nom} ${v.eleve.prenom}`,
    Matricule: v.eleve.matricule,
    Tranche: v.tranche,
    Montant: v.montant,
    Réduction: v.reduction || 0,
    'Montant payé': v.montantPaye,
    'Mode': v.modePaiement,
    Reçu: v.recuNumber,
    Année: v.anneeScolaire,
  }));
};