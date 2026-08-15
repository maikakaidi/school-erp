import prisma from '../../config/database.js';
import { getNotesByClasse, upsertNote } from '../notes/notes.service.js';
import { createAbsence as createAbsenceRecord } from '../absences/absences.service.js';
import {
  getNotificationsForActor,
  getUnreadCountForActor,
  markAsReadForActor,
} from '../notifications/notifications.service.js';
import {
  getAnnoncesForEnseignant,
  getUnreadAnnoncesCountForEnseignant,
  markAnnonceReadForEnseignant,
} from '../annonces/annonces.service.js';

export const getCurrentAcademicYear = async (schoolId) => {
  const current = await prisma.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    orderBy: { createdAt: 'desc' },
  });
  if (current) return current;
  const latest = await prisma.academicYear.findFirst({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });
  return latest;
};

const notFound = (msg) => {
  const err = new Error(msg);
  err.status = 404;
  return err;
};

export const getAffectations = async (schoolId, enseignantId, anneeScolaire) => {
  const annee = anneeScolaire || (await getCurrentAcademicYear(schoolId))?.name;
  const affectations = await prisma.affectation.findMany({
    where: { schoolId, enseignantId, isActive: true },
    include: {
      classe: { select: { id: true, nom: true, niveau: true, anneeScolaire: true } },
      matiere: { select: { id: true, libelle: true, code: true } },
    },
    orderBy: [{ classe: { nom: 'asc' } }, { matiere: { libelle: 'asc' } }],
  });

  let coeffs = [];
  if (annee) {
    const classeIds = [...new Set(affectations.map((a) => a.classe.id))];
    coeffs = await prisma.coefficient.findMany({
      where: { schoolId, classeId: { in: classeIds }, anneeScolaire: annee },
    });
  }
  const coeffMap = new Map(coeffs.map((c) => [`${c.classeId}:${c.matiereId}`, c.coefficient]));

  return {
    anneeScolaire: annee || null,
    affectations: affectations.map((a) => ({
      id: a.id,
      classe: a.classe,
      matiere: a.matiere,
      coefficient: coeffMap.get(`${a.classe.id}:${a.matiere.id}`) || 1,
    })),
  };
};

const assertAffectation = async (schoolId, enseignantId, classeId, matiereId) => {
  const affectation = await prisma.affectation.findFirst({
    where: { schoolId, enseignantId, classeId, isActive: true },
  });
  if (!affectation) throw notFound('Vous n\'enseignez pas dans cette classe');
  if (matiereId && affectation.matiereId !== matiereId) {
    throw notFound('Vous n\'enseignez pas cette matière dans cette classe');
  }
  return affectation;
};

export const getProfile = async (schoolId, enseignantId) => {
  const enseignant = await prisma.enseignant.findFirst({
    where: { id: enseignantId, schoolId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      telephone: true,
      email: true,
      specialite: true,
      estVacataire: true,
      tauxHoraire: true,
      salaireFixe: true,
      createdAt: true,
    },
  });
  if (!enseignant) throw notFound('Enseignant non trouvé');
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, logo: true, slogan: true },
  });
  return { enseignant, school };
};

export const getEleves = async (schoolId, enseignantId, classeId) => {
  await assertAffectation(schoolId, enseignantId, classeId);
  const annee = (await getCurrentAcademicYear(schoolId))?.name;

  const eleves = await prisma.eleve.findMany({
    where: {
      schoolId,
      isActive: true,
      ...(annee
        ? { inscriptions: { some: { classeId, anneeScolaire: annee } } }
        : { inscriptions: { some: { classeId } } }),
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      sexe: true,
      telephone: true,
      photoUrl: true,
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
  });
  return { eleves, total: eleves.length };
};

export const getNotes = async (schoolId, enseignantId, { classeId, matiereId, semestre, anneeScolaire }) => {
  await assertAffectation(schoolId, enseignantId, classeId, matiereId);
  const annee = anneeScolaire || (await getCurrentAcademicYear(schoolId))?.name;
  const sem = parseInt(semestre) || 1;

  const eleves = await getNotesByClasse(schoolId, classeId, matiereId, sem, annee);
  const coefficient = await prisma.coefficient.findFirst({
    where: { schoolId, classeId, matiereId, anneeScolaire: annee },
  });

  const rows = eleves.map((e) => {
    const note = e.notes?.[0] || null;
    return {
      eleveId: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      devoir1: note?.devoir1 ?? null,
      composition: note?.composition ?? null,
      moyenne: note?.moyenne ?? null,
      appreciation: note?.appreciation ?? null,
    };
  });

  const saisies = rows.filter((r) => r.devoir1 !== null || r.composition !== null).length;

  return {
    anneeScolaire: annee,
    semestre: sem,
    coefficient: coefficient?.coefficient || 1,
    totalEleves: rows.length,
    notesSaisies: saisies,
    notes: rows,
  };
};

export const saveNotes = async (schoolId, enseignantId, data) => {
  await assertAffectation(schoolId, enseignantId, data.classeId, data.matiereId);
  const sem = parseInt(data.semestre) || 1;

  const eleveIds = data.notes.map((n) => n.eleveId);
  const eleves = await prisma.eleve.findMany({
    where: { id: { in: eleveIds }, schoolId },
    select: { id: true },
  });
  if (eleves.length !== new Set(eleveIds).size) throw notFound('Un ou plusieurs élèves invalides');

  const saved = [];
  for (const n of data.notes) {
    const note = await upsertNote(schoolId, {
      eleveId: n.eleveId,
      matiereId: data.matiereId,
      classeId: data.classeId,
      semestre: sem,
      anneeScolaire: data.anneeScolaire,
      devoir: n.devoir,
      composition: n.composition,
      appreciation: n.appreciation,
    });
    saved.push({ eleveId: n.eleveId, moyenne: note.moyenne });
  }
  return { saved: saved.length };
};

export const getAbsences = async (schoolId, enseignantId, { classeId, dateDebut, dateFin, type, page = 1, limit = 20 } = {}) => {
  const mine = await prisma.affectation.findMany({
    where: { schoolId, enseignantId, isActive: true },
    select: { classeId: true },
  });
  const classeIds = [...new Set(mine.map((a) => a.classeId))];
  if (classeIds.length === 0) return { absences: [], total: 0, page, totalPages: 0, stats: null };

  if (classeId) {
    if (!classeIds.includes(classeId)) throw notFound('Vous n\'enseignez pas dans cette classe');
    const where = { schoolId, classeId };
    if (type && type !== 'tous') where.type = type;
    if (dateDebut) where.date = { ...(where.date || {}), gte: new Date(`${dateDebut}T12:00:00.000Z`) };
    if (dateFin) where.date = { ...(where.date || {}), lte: new Date(`${dateFin}T23:59:59.999Z`) };
    const [absences, total] = await Promise.all([
      prisma.absence.findMany({
        where,
        include: {
          eleve: { select: { id: true, nom: true, prenom: true, matricule: true } },
          matiere: { select: { id: true, libelle: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.absence.count({ where }),
    ]);
    return { absences, total, page, totalPages: Math.ceil(total / limit), stats: null };
  }

  const where = { schoolId, classeId: { in: classeIds } };
  if (type && type !== 'tous') where.type = type;
  if (dateDebut) where.date = { ...(where.date || {}), gte: new Date(`${dateDebut}T12:00:00.000Z`) };
  if (dateFin) where.date = { ...(where.date || {}), lte: new Date(`${dateFin}T23:59:59.999Z`) };

  const [absences, total, totalAbsences, totalRetards, justifies] = await Promise.all([
    prisma.absence.findMany({
      where,
      include: {
        eleve: { select: { id: true, nom: true, prenom: true, matricule: true } },
        classe: { select: { id: true, nom: true } },
        matiere: { select: { id: true, libelle: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absence.count({ where }),
    prisma.absence.count({ where: { ...where, type: 'absence' } }),
    prisma.absence.count({ where: { ...where, type: 'retard' } }),
    prisma.absence.count({ where: { ...where, justifie: true } }),
  ]);

  return {
    absences,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { totalAbsences, totalRetards, justifies, nonJustifies: total - justifies },
  };
};

export const createAbsence = async (schoolId, enseignantId, data) => {
  if (data.matiereId || data.classeId) {
    await assertAffectation(schoolId, enseignantId, data.classeId, data.matiereId);
  }
  const enseignant = await prisma.enseignant.findFirst({
    where: { id: enseignantId, schoolId },
    select: { nom: true, prenom: true },
  });
  return await createAbsenceRecord(schoolId, {
    ...data,
    enregistrePar: enseignant ? `${enseignant.nom} ${enseignant.prenom}` : 'Enseignant',
  });
};

export const deleteAbsence = async (schoolId, enseignantId, id) => {
  const absence = await prisma.absence.findFirst({ where: { id, schoolId } });
  if (!absence) throw notFound('Absence non trouvée');
  await assertAffectation(schoolId, enseignantId, absence.classeId);
  return await prisma.absence.deleteMany({ where: { id, schoolId } });
};

export const getEmploiDuTemps = async (schoolId, enseignantId, mois, annee) => {
  const m = parseInt(mois) || new Date().getMonth() + 1;
  const y = parseInt(annee) || new Date().getFullYear();
  const horaires = await prisma.horaireEnseignant.findMany({
    where: { schoolId, enseignantId, mois: m, annee: y },
    include: {
      classe: { select: { id: true, nom: true } },
      matiere: { select: { id: true, libelle: true } },
    },
    orderBy: [{ jour: 'asc' }, { heureDebut: 'asc' }],
  });
  return { mois: m, annee: y, horaires };
};

export const getNotifications = async (schoolId, enseignantId, { unreadOnly, limit } = {}) => {
  return await getNotificationsForActor(schoolId, 'enseignant', enseignantId, { unreadOnly, limit });
};

export const getUnreadNotificationsCount = async (schoolId, enseignantId) => {
  return await getUnreadCountForActor(schoolId, 'enseignant', enseignantId);
};

export const markNotificationRead = async (schoolId, enseignantId, notificationId) => {
  return await markAsReadForActor(schoolId, 'enseignant', enseignantId, notificationId);
};

export const getAnnonces = async (schoolId, enseignantId, { unreadOnly, limit } = {}) => {
  return await getAnnoncesForEnseignant(schoolId, enseignantId, { unreadOnly, limit });
};

export const getUnreadAnnoncesCount = async (schoolId, enseignantId) => {
  return await getUnreadAnnoncesCountForEnseignant(schoolId, enseignantId);
};

export const markAnnonceRead = async (schoolId, enseignantId, annonceId) => {
  return await markAnnonceReadForEnseignant(schoolId, enseignantId, annonceId);
};

export const getDashboard = async (schoolId, enseignantId) => {
  const annee = await getCurrentAcademicYear(schoolId);
  const affectations = await getAffectations(schoolId, enseignantId, annee?.name);
  const classeIds = [...new Set(affectations.affectations.map((a) => a.classe.id))];

  const eleves = classeIds.length
    ? await prisma.eleve.count({
        where: {
          schoolId,
          isActive: true,
          inscriptions: {
            some: {
              classeId: { in: classeIds },
              ...(annee ? { anneeScolaire: annee.name } : {}),
            },
          },
        },
      })
    : 0;

  const mois = new Date().getMonth() + 1;
  const an = new Date().getFullYear();
  const horaires = await prisma.horaireEnseignant.findMany({
    where: { schoolId, enseignantId, mois: mois, annee: an },
    select: { id: true },
  });

  const recentAbsences = await prisma.absence.findMany({
    where: { schoolId, classeId: { in: classeIds }, type: 'absence' },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 5,
    include: {
      eleve: { select: { id: true, nom: true, prenom: true } },
      classe: { select: { id: true, nom: true } },
      matiere: { select: { id: true, libelle: true } },
    },
  });

  return {
    anneeScolaire: annee?.name || null,
    stats: {
      nbAffectations: affectations.affectations.length,
      nbClasses: classeIds.length,
      nbEleves: eleves,
      seancesDuMois: horaires.length,
    },
    affectations: affectations.affectations,
    recentAbsences,
  };
};
