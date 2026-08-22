import prisma from '../../config/database.js';
import { isYearArchived } from '../academic-years/academicYears.service.js';

export const upsertNote = async (schoolId, data) => {
  if (await isYearArchived(schoolId, data.anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }
  const whereKey = {
    eleveId_matiereId_semestre_anneeScolaire: {
      eleveId: data.eleveId,
      matiereId: data.matiereId,
      semestre: data.semestre,
      anneeScolaire: data.anneeScolaire,
    },
  };
  const existing = await prisma.note.findUnique({ where: whereKey });

  // Sémantique WYSIWYG :
  // - champ envoyé (nombre ou null explicite) -> remplace la valeur (null = effacement volontaire)
  // - champ omis (undefined) -> valeur existante préservée
  const devoir1 = data.devoir !== undefined ? data.devoir : existing?.devoir1 ?? null;
  const composition = data.composition !== undefined ? data.composition : existing?.composition ?? null;
  const devoir2 = existing ? existing.devoir2 ?? null : null;
  const appreciation =
    data.appreciation !== undefined ? data.appreciation : existing?.appreciation ?? null;

  let moyenne = null;
  if (devoir1 !== null && composition !== null) moyenne = (devoir1 + composition) / 2;
  else if (devoir1 !== null) moyenne = devoir1;
  else if (composition !== null) moyenne = composition;

  return await prisma.note.upsert({
    where: whereKey,
    update: {
      devoir1,
      devoir2,
      composition,
      moyenne,
      appreciation,
    },
    create: {
      eleveId: data.eleveId,
      matiereId: data.matiereId,
      classeId: data.classeId,
      semestre: data.semestre,
      anneeScolaire: data.anneeScolaire,
      devoir1,
      devoir2,
      composition,
      moyenne,
      appreciation,
      schoolId,
    },
  });
};

export const getNotesByClasse = async (schoolId, classeId, matiereId, semestre, anneeScolaire) => {
  const eleves = await prisma.eleve.findMany({
    where: {
      schoolId,
      inscriptions: { some: { classeId, anneeScolaire } },
      isActive: true,
    },
    include: {
      notes: {
        where: { matiereId, semestre, anneeScolaire },
      },
    },
    orderBy: { nom: 'asc' },
  });
  return eleves;
};

export const getNotesByEleve = async (schoolId, eleveId, semestre, anneeScolaire) => {
  return await prisma.note.findMany({
    where: { schoolId, eleveId, semestre, anneeScolaire },
    include: { matiere: true },
  });
};

export const exportNotes = async (schoolId, classeId, semestre, anneeScolaire) => {
  const eleves = await prisma.eleve.findMany({
    where: { schoolId, inscriptions: { some: { classeId, anneeScolaire } }, isActive: true },
    include: {
      notes: { where: { semestre, anneeScolaire }, include: { matiere: true } },
    },
    orderBy: { nom: 'asc' },
  });
  const rows = [];
  for (const e of eleves) {
    const row = { Matricule: e.matricule, Nom: e.nom, Prénom: e.prenom };
    for (const n of e.notes) {
      row[n.matiere.libelle] = n.moyenne ?? '';
    }
    rows.push(row);
  }
  return rows;
};