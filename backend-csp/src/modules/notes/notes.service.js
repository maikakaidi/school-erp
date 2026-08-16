import prisma from '../../config/database.js';
import { isYearArchived } from '../academic-years/academicYears.service.js';

export const upsertNote = async (schoolId, data) => {
  if (await isYearArchived(schoolId, data.anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }
  const devoir = data.devoir || null;
  const comp = data.composition || null;
  let moyenne = null;
  if (devoir !== null && comp !== null) moyenne = (devoir + comp) / 2;
  else if (devoir !== null) moyenne = devoir;
  else if (comp !== null) moyenne = comp;

  return await prisma.note.upsert({
    where: {
      eleveId_matiereId_semestre_anneeScolaire: {
        eleveId: data.eleveId,
        matiereId: data.matiereId,
        semestre: data.semestre,
        anneeScolaire: data.anneeScolaire,
      },
    },
    update: {
      devoir1: devoir,
      devoir2: null,
      composition: comp,
      moyenne,
      appreciation: data.appreciation,
    },
    create: {
      eleveId: data.eleveId,
      matiereId: data.matiereId,
      classeId: data.classeId,
      semestre: data.semestre,
      anneeScolaire: data.anneeScolaire,
      devoir1: devoir,
      devoir2: null,
      composition: comp,
      moyenne,
      appreciation: data.appreciation,
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