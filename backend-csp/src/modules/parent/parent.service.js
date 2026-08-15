import prisma from '../../config/database.js';
import {
  getNotificationsForActor,
  getUnreadCountForActor,
  markAsReadForActor,
} from '../notifications/notifications.service.js';
import {
  getAnnoncesForParent,
  getUnreadAnnoncesCountForParent,
  markAnnonceReadForParent,
} from '../annonces/annonces.service.js';
import { getHorairesByClasse } from '../horaires/horaires.service.js';

const getLatestInscription = (inscriptions) => {
  if (!inscriptions || inscriptions.length === 0) return null;
  return [...inscriptions].sort((a, b) => new Date(b.dateInscription) - new Date(a.dateInscription))[0];
};

export const getProfile = async (schoolId, parentId) => {
  const parent = await prisma.parent.findFirst({
    where: { id: parentId, schoolId },
    select: { id: true, nom: true, telephone: true, email: true, adresse: true, createdAt: true },
  });
  if (!parent) {
    const error = new Error('Parent non trouvé');
    error.status = 404;
    throw error;
  }
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true } });
  return { parent, school };
};

export const getChildren = async (schoolId, parentId) => {
  const links = await prisma.parentEleve.findMany({
    where: { parentId, schoolId },
    include: {
      eleve: {
        include: {
          inscriptions: {
            include: { classe: true },
            orderBy: { dateInscription: 'desc' },
          },
        },
      },
    },
    orderBy: { eleve: { nom: 'asc' } },
  });

  return links.map(({ eleve }) => {
    const inscription = getLatestInscription(eleve.inscriptions);
    return {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      sexe: eleve.sexe,
      dateNaissance: eleve.dateNaissance,
      photoUrl: eleve.photoUrl,
      classe: inscription?.classe?.nom || null,
      classeId: inscription?.classeId || null,
      anneeScolaire: inscription?.anneeScolaire || null,
    };
  });
};

export const getChildOwned = async (schoolId, parentId, eleveId) => {
  const link = await prisma.parentEleve.findFirst({
    where: { parentId, schoolId, eleveId },
    include: {
      eleve: {
        include: {
          inscriptions: { include: { classe: true }, orderBy: { dateInscription: 'desc' } },
        },
      },
    },
  });
  if (!link) {
    const error = new Error('Enfant non trouvé pour ce parent');
    error.status = 404;
    throw error;
  }
  return link.eleve;
};

export const computeNotesForChild = async (schoolId, eleveId, classeId, anneeScolaire) => {
  const coeffs = await prisma.coefficient.findMany({ where: { schoolId, classeId, anneeScolaire } });
  const coeffMap = new Map(coeffs.map((c) => [c.matiereId, c.coefficient]));

  const notes = await prisma.note.findMany({
    where: { schoolId, eleveId, anneeScolaire },
    include: { matiere: true },
    orderBy: { semestre: 'asc' },
  });

  const byMatiere = new Map();
  for (const n of notes) {
    if (!byMatiere.has(n.matiereId)) {
      byMatiere.set(n.matiereId, {
        matiereId: n.matiereId,
        libelle: n.matiere.libelle,
        type: n.matiere.type || null,
        coefficient: coeffMap.get(n.matiereId) || 1,
        semestre1: null,
        semestre2: null,
      });
    }
    const m = byMatiere.get(n.matiereId);
    const detail = {
      devoir1: n.devoir1,
      devoir2: n.devoir2,
      composition: n.composition,
      moyenne: n.moyenne,
      appreciation: n.appreciation,
    };
    if (n.semestre === 1) m.semestre1 = detail;
    else m.semestre2 = detail;
  }

  const calcMoyenne = (sem) => {
    let total = 0, coefs = 0;
    for (const m of byMatiere.values()) {
      const note = m[`semestre${sem}`];
      if (note && note.moyenne !== null && note.moyenne !== undefined) {
        total += note.moyenne * m.coefficient;
        coefs += m.coefficient;
      }
    }
    return coefs > 0 ? Math.round((total / coefs) * 100) / 100 : null;
  };

  const moyenneSemestre1 = calcMoyenne(1);
  const moyenneSemestre2 = calcMoyenne(2);
  const dispo = [moyenneSemestre1, moyenneSemestre2].filter((x) => x !== null);
  const moyenneGenerale = dispo.length
    ? Math.round((dispo.reduce((a, b) => a + b, 0) / dispo.length) * 100) / 100
    : null;

  return {
    matieres: [...byMatiere.values()],
    moyenneSemestre1,
    moyenneSemestre2,
    moyenneGenerale,
  };
};

export const getNotes = async (schoolId, parentId, eleveId, anneeScolaire) => {
  const eleve = await getChildOwned(schoolId, parentId, eleveId);
  const inscription = getLatestInscription(eleve.inscriptions);
  const annee = anneeScolaire || inscription?.anneeScolaire;
  if (!inscription || !annee) return { anneeScolaire: null, notes: null, message: 'Aucune inscription trouvée' };
  const notes = await computeNotesForChild(schoolId, eleveId, inscription.classeId, annee);
  return { anneeScolaire: annee, classe: inscription.classe.nom, ...notes };
};

export const getPayments = async (schoolId, parentId, eleveId, anneeScolaire) => {
  const eleve = await getChildOwned(schoolId, parentId, eleveId);
  const inscription = getLatestInscription(eleve.inscriptions);
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
  const resteAPayer = Math.max(0, fraisTotal - totalPaye);

  return {
    anneeScolaire: annee,
    classe: inscription?.classe?.nom || null,
    fraisTotal,
    totalPaye,
    resteAPayer,
    versements,
  };
};

export const getAbsences = async (schoolId, parentId, eleveId, anneeScolaire) => {
  await getChildOwned(schoolId, parentId, eleveId);

  const absences = await prisma.absence.findMany({
    where: { schoolId, eleveId },
    include: { matiere: { select: { id: true, libelle: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 60,
  });

  return {
    anneeScolaire: anneeScolaire || null,
    totalAbsences: absences.filter((a) => a.type === 'absence').length,
    totalRetards: absences.filter((a) => a.type === 'retard').length,
    justifies: absences.filter((a) => a.justifie).length,
    nonJustifies: absences.filter((a) => !a.justifie).length,
    absences,
  };
};

export const getEmploiDuTemps = async (schoolId, parentId, eleveId, mois, annee) => {
  const eleve = await getChildOwned(schoolId, parentId, eleveId);
  const inscription = getLatestInscription(eleve.inscriptions);
  if (!inscription || !inscription.classeId) {
    return { eleveId, classe: null, horaires: [] };
  }
  const horaires = await getHorairesByClasse(schoolId, inscription.classeId, mois, annee);
  return {
    eleveId,
    classe: { id: inscription.classeId, nom: inscription.classe?.nom || null },
    horaires,
  };
};

export const getNotifications = async (schoolId, parentId, { unreadOnly, limit } = {}) => {
  return await getNotificationsForActor(schoolId, 'parent', parentId, { unreadOnly, limit });
};

export const getUnreadNotificationsCount = async (schoolId, parentId) => {
  return await getUnreadCountForActor(schoolId, 'parent', parentId);
};

export const markNotificationRead = async (schoolId, parentId, notificationId) => {
  return await markAsReadForActor(schoolId, 'parent', parentId, notificationId);
};

export const getAnnonces = async (schoolId, parentId, { unreadOnly, limit } = {}) => {
  return await getAnnoncesForParent(schoolId, parentId, { unreadOnly, limit });
};

export const getUnreadAnnoncesCount = async (schoolId, parentId) => {
  return await getUnreadAnnoncesCountForParent(schoolId, parentId);
};

export const markAnnonceRead = async (schoolId, parentId, annonceId) => {
  return await markAnnonceReadForParent(schoolId, parentId, annonceId);
};

export const getDashboard = async (schoolId, parentId, eleveId, anneeScolaire) => {
  const eleve = await getChildOwned(schoolId, parentId, eleveId);
  const inscription = getLatestInscription(eleve.inscriptions);
  const annee = anneeScolaire || inscription?.anneeScolaire;

  const notes = annee && inscription
    ? await computeNotesForChild(schoolId, eleveId, inscription.classeId, annee)
    : { matieres: [], moyenneSemestre1: null, moyenneSemestre2: null, moyenneGenerale: null };
  const paiements = await getPayments(schoolId, parentId, eleveId, annee);
  const absences = await getAbsences(schoolId, parentId, eleveId, annee);

  return {
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      sexe: eleve.sexe,
      dateNaissance: eleve.dateNaissance,
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
