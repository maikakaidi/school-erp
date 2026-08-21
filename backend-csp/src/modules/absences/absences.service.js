import prisma from '../../config/database.js';
import { createNotification, createNotificationsMany } from '../notifications/notifications.service.js';
import { resolveAcademicYear } from '../academic-years/academicYears.service.js';

const toMidday = (dateStr) => new Date(`${dateStr}T12:00:00.000Z`);

const includeAbsence = () => ({
  eleve: { select: { id: true, nom: true, prenom: true, matricule: true, sexe: true } },
  classe: { select: { id: true, nom: true } },
  matiere: { select: { id: true, libelle: true } },
});

const getLatestClasseId = async (schoolId, eleveId) => {
  const inscription = await prisma.inscription.findFirst({
    where: { schoolId, eleveId },
    orderBy: { dateInscription: 'desc' },
  });
  return inscription?.classeId || null;
};

const getStatsRow = async (schoolId, filters) => {
  const where = { schoolId };
  if (filters.anneeScolaire) where.anneeScolaire = filters.anneeScolaire;
  if (filters.classeId) where.classeId = filters.classeId;
  if (filters.matiereId) where.matiereId = filters.matiereId;
  if (filters.dateDebut) where.date = { ...(where.date || {}), gte: toMidday(filters.dateDebut) };
  if (filters.dateFin) where.date = { ...(where.date || {}), lte: new Date(`${filters.dateFin}T23:59:59.999Z`) };

  const [absences, retards, justifies, enAttente] = await Promise.all([
    prisma.absence.count({ where: { ...where, type: 'absence' } }),
    prisma.absence.count({ where: { ...where, type: 'retard' } }),
    prisma.absence.count({ where: { ...where, justifie: true } }),
    prisma.absence.count({ where: { ...where, statutJustificatif: 'en_attente' } }),
  ]);

  const parClasse = await prisma.absence.groupBy({
    by: ['classeId'],
    where,
    _count: { _all: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });
  const classeIds = parClasse.map((r) => r.classeId);
  const classes = classeIds.length
    ? await prisma.classe.findMany({ where: { id: { in: classeIds } }, select: { id: true, nom: true } })
    : [];
  const classeMap = new Map(classes.map((c) => [c.id, c.nom]));

  return {
    totalAbsences: absences,
    totalRetards: retards,
    justifies,
    enAttente,
    nonJustifies: absences + retards - justifies,
    parClasse: parClasse.map((r) => ({
      classe: classeMap.get(r.classeId) || '—',
      total: r._count._all,
    })),
  };
};

export const getAllAbsences = async (schoolId, { anneeScolaire, dateDebut, dateFin, classeId, eleveId, type, search, page = 1, limit = 20 } = {}) => {
  const where = { schoolId };
  if (anneeScolaire) where.anneeScolaire = anneeScolaire;
  if (classeId) where.classeId = classeId;
  if (eleveId) where.eleveId = eleveId;
  if (type && type !== 'tous') where.type = type;
  if (dateDebut) where.date = { ...(where.date || {}), gte: toMidday(dateDebut) };
  if (dateFin) where.date = { ...(where.date || {}), lte: new Date(`${dateFin}T23:59:59.999Z`) };
  if (search) {
    where.OR = [
      { eleve: { nom: { contains: search, mode: 'insensitive' } } },
      { eleve: { prenom: { contains: search, mode: 'insensitive' } } },
      { eleve: { matricule: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [absences, total] = await Promise.all([
    prisma.absence.findMany({
      where,
      include: includeAbsence(),
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.absence.count({ where }),
  ]);

  return {
    absences,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: await getStatsRow(schoolId, { anneeScolaire, classeId, eleveId, dateDebut, dateFin, matiereId: undefined }),
  };
};

export const getAbsenceById = async (schoolId, id) => {
  return await prisma.absence.findFirst({
    where: { id, schoolId },
    include: includeAbsence(),
  });
};

const notifyParents = async (schoolId, eleveId, { eleveNom, prenom, date, type }) => {
  try {
    const links = await prisma.parentEleve.findMany({
      where: { schoolId, eleveId },
      select: { parentId: true },
    });
    if (links.length === 0) return;
    const label = type === 'absence' ? 'Absence' : 'Retard';
    await createNotificationsMany(schoolId, links.map((l) => ({
      type: 'absence',
      title: `${label} — ${eleveNom} ${prenom}`,
      message: `${label} signalé(e) le ${date}`,
      link: '/parent/absences',
      recipientType: 'parent',
      recipientId: l.parentId,
    })));
  } catch (e) {
    // non bloquant
  }
};

export const createAbsence = async (schoolId, data) => {
  const eleve = await prisma.eleve.findFirst({ where: { id: data.eleveId, schoolId } });
  if (!eleve) throw new Error('Élève non trouvé');

  const classeId = data.classeId || (await getLatestClasseId(schoolId, data.eleveId));
  if (!classeId) throw new Error("Aucune classe trouvée pour cet élève (inscription requise)");

  const anneeScolaire = await resolveAcademicYear(schoolId, data.anneeScolaire || null, data.date);

  const absence = await prisma.absence.create({
    data: {
      schoolId,
      eleveId: data.eleveId,
      classeId,
      matiereId: data.matiereId || null,
      anneeScolaire,
      date: toMidday(data.date),
      type: data.type,
      motif: data.motif || null,
      justifie: data.justifie || false,
      statutJustificatif: data.statutJustificatif || (data.justifie ? 'justifie' : 'non_justifie'),
      enregistrePar: data.enregistrePar || 'Administration',
    },
    include: includeAbsence(),
  });

  createNotification(schoolId, {
    type: 'absence',
    title: data.type === 'absence' ? 'Absence signalée' : 'Retard signalé',
    message: `${eleve.nom} ${eleve.prenom} — ${data.type === 'absence' ? 'Absence' : 'Retard'} le ${data.date}`,
    link: '/absences',
  }).catch(() => {});

  notifyParents(schoolId, data.eleveId, {
    eleveNom: eleve.nom,
    prenom: eleve.prenom,
    date: data.date,
    type: data.type,
  });

  return absence;
};

export const bulkCreateAbsences = async (schoolId, data) => {
  const count = await prisma.eleve.count({
    where: { id: { in: data.eleveIds }, schoolId },
  });
  if (count !== data.eleveIds.length) throw new Error('Un ou plusieurs élèves invalides');

  const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
  if (!classe) throw new Error('Classe non trouvée');

  const anneeScolaire = await resolveAcademicYear(schoolId, data.anneeScolaire || null, data.date);

  const result = await prisma.absence.createMany({
    data: data.eleveIds.map((eleveId) => ({
      schoolId,
      eleveId,
      classeId: data.classeId,
      matiereId: data.matiereId || null,
      anneeScolaire,
      date: toMidday(data.date),
      type: data.type,
      motif: data.motif || null,
      justifie: data.justifie || false,
      statutJustificatif: data.justifie ? 'justifie' : 'non_justifie',
      enregistrePar: data.enregistrePar || 'Administration',
    })),
  });

  try {
    const eleves = await prisma.eleve.findMany({
      where: { id: { in: data.eleveIds }, schoolId },
      select: { id: true, nom: true, prenom: true },
    });
    for (const eleve of eleves) {
      await notifyParents(schoolId, eleve.id, {
        eleveNom: eleve.nom,
        prenom: eleve.prenom,
        date: data.date,
        type: data.type,
      });
    }
  } catch (e) {
    // non bloquant
  }

  return { count: result.count };
};

export const updateAbsence = async (schoolId, id, data) => {
  const existing = await prisma.absence.findFirst({ where: { id, schoolId } });
  if (!existing) {
    const err = new Error('Absence non trouvée');
    err.status = 404;
    throw err;
  }

  const patch = {};
  if (data.date) patch.date = toMidday(data.date);
  if (data.type) patch.type = data.type;
  if (data.eleveId) {
    const eleve = await prisma.eleve.findFirst({ where: { id: data.eleveId, schoolId } });
    if (!eleve) throw new Error('Élève non trouvé');
    patch.eleveId = data.eleveId;
    if (data.classeId) {
      const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
      if (!classe) throw new Error('Classe non trouvée');
      patch.classeId = data.classeId;
    } else {
      const classeId = await getLatestClasseId(schoolId, data.eleveId);
      if (classeId) patch.classeId = classeId;
    }
  } else if (data.classeId) {
    const classe = await prisma.classe.findFirst({ where: { id: data.classeId, schoolId } });
    if (!classe) throw new Error('Classe non trouvée');
    patch.classeId = data.classeId;
  }
  if (data.matiereId !== undefined) patch.matiereId = data.matiereId || null;
  if (data.motif !== undefined) patch.motif = data.motif || null;
  if (data.justifie !== undefined) patch.justifie = data.justifie;
  if (data.statutJustificatif !== undefined) patch.statutJustificatif = data.statutJustificatif;

  return await prisma.absence.update({
    where: { id },
    data: patch,
    include: includeAbsence(),
  });
};

export const deleteAbsence = async (schoolId, id) => {
  return await prisma.absence.deleteMany({ where: { id, schoolId } });
};

export const exportAbsences = async (schoolId, filters) => {
  const where = { schoolId };
  if (filters.anneeScolaire) where.anneeScolaire = filters.anneeScolaire;
  if (filters.classeId) where.classeId = filters.classeId;
  if (filters.type && filters.type !== 'tous') where.type = filters.type;
  if (filters.dateDebut) where.date = { ...(where.date || {}), gte: toMidday(filters.dateDebut) };
  if (filters.dateFin) where.date = { ...(where.date || {}), lte: new Date(`${filters.dateFin}T23:59:59.999Z`) };

  const absences = await prisma.absence.findMany({
    where,
    include: { eleve: true, classe: true, matiere: true },
    orderBy: [{ date: 'desc' }],
  });

  return absences.map((a) => ({
    Date: new Date(a.date).toLocaleDateString('fr-FR'),
    Élève: `${a.eleve.nom} ${a.eleve.prenom}`,
    Matricule: a.eleve.matricule,
    Classe: a.classe?.nom || '—',
    Matière: a.matiere?.libelle || '—',
    Type: a.type === 'absence' ? 'Absence' : 'Retard',
    Justifié: a.justifie ? 'Oui' : 'Non',
    'Statut': a.statutJustificatif,
    Motif: a.motif || '',
  }));
};
