import prisma from '../../config/database.js';
import { getEmploiDuTempsEleve } from '../horaires/horaires.service.js';
import { computeNotesForChild } from '../parent/parent.service.js';

const getLatestInscription = (inscriptions) => {
  if (!inscriptions || inscriptions.length === 0) return null;
  return [...inscriptions].sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))[0];
};

const getEleveWithInscription = async (schoolId, eleveId) => {
  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, schoolId, isActive: true },
    include: {
      inscriptions: { include: { classe: true }, orderBy: { dateInscription: 'desc' } },
    },
  });
  if (!eleve) {
    const error = new Error('Élève non trouvé');
    error.status = 404;
    throw error;
  }
  return { eleve, inscription: getLatestInscription(eleve.inscriptions) };
};

export const getProfile = async (schoolId, eleveId) => {
  const { eleve, inscription } = await getEleveWithInscription(schoolId, eleveId);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, logo: true },
  });
  return {
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      sexe: eleve.sexe,
      dateNaissance: eleve.dateNaissance,
      lieuNaissance: eleve.lieuNaissance,
      nationalite: eleve.nationalite,
      telephone: eleve.telephone,
      photoUrl: eleve.photoUrl,
      classe: inscription?.classe || null,
      anneeScolaire: inscription?.anneeScolaire || null,
    },
    school,
  };
};

export const getNotes = async (schoolId, eleveId, anneeScolaire) => {
  const { inscription } = await getEleveWithInscription(schoolId, eleveId);
  const annee = anneeScolaire || inscription?.anneeScolaire;
  if (!inscription || !annee) {
    return { anneeScolaire: null, classe: null, matieres: [], moyenneSemestre1: null, moyenneSemestre2: null, moyenneGenerale: null };
  }
  const notes = await computeNotesForChild(schoolId, eleveId, inscription.classeId, annee);
  return { anneeScolaire: annee, classe: inscription.classe.nom, ...notes };
};

export const getEmploiDuTemps = async (schoolId, eleveId, mois, annee) => {
  return await getEmploiDuTempsEleve(schoolId, eleveId, mois, annee);
};

export const getAbsences = async (schoolId, eleveId) => {
  await getEleveWithInscription(schoolId, eleveId);
  const absences = await prisma.absence.findMany({
    where: { schoolId, eleveId },
    include: { matiere: { select: { id: true, libelle: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 60,
  });
  return {
    totalAbsences: absences.filter((a) => a.type === 'absence').length,
    totalRetards: absences.filter((a) => a.type === 'retard').length,
    justifies: absences.filter((a) => a.justifie).length,
    nonJustifies: absences.filter((a) => !a.justifie).length,
    absences,
  };
};

export const getPayments = async (schoolId, eleveId, anneeScolaire) => {
  const { inscription } = await getEleveWithInscription(schoolId, eleveId);
  const annee = anneeScolaire || inscription?.anneeScolaire;

  let fraisTotal = 0;
  if (inscription && annee) {
    const frais = await prisma.fraisScolaire.findFirst({
      where: { schoolId, classeId: inscription.classeId, anneeScolaire: annee },
    });
    fraisTotal = frais?.total || 0;
  }

  const versements = annee
    ? await prisma.versement.findMany({
        where: { schoolId, eleveId, anneeScolaire: annee },
        orderBy: { datePaiement: 'asc' },
      })
    : [];

  const totalPaye = versements.reduce((s, v) => s + v.montantPaye, 0);

  return {
    anneeScolaire: annee,
    classe: inscription?.classe?.nom || null,
    fraisTotal,
    totalPaye,
    resteAPayer: Math.max(0, fraisTotal - totalPaye),
    versements,
  };
};

export const getDashboard = async (schoolId, eleveId, anneeScolaire) => {
  const { eleve, inscription } = await getEleveWithInscription(schoolId, eleveId);
  const annee = anneeScolaire || inscription?.anneeScolaire;
  const notes = annee && inscription
    ? await computeNotesForChild(schoolId, eleveId, inscription.classeId, annee)
    : { matieres: [], moyenneSemestre1: null, moyenneSemestre2: null, moyenneGenerale: null };
  const paiements = await getPayments(schoolId, eleveId, annee);
  const absences = await getAbsences(schoolId, eleveId);

  return {
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      sexe: eleve.sexe,
      photoUrl: eleve.photoUrl,
      classe: inscription?.classe?.nom || null,
      anneeScolaire: annee,
    },
    notes,
    paiements,
    absences: {
      totalAbsences: absences.totalAbsences,
      totalRetards: absences.totalRetards,
      justifies: absences.justifies,
      nonJustifies: absences.nonJustifies,
    },
  };
};
