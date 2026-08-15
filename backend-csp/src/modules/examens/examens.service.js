import prisma from '../../config/database.js';
import { PassThrough } from 'stream';
import PDFDocument from 'pdfkit';

export const getAllExamens = async (schoolId, anneeScolaire) => {
  return await prisma.examenBlanc.findMany({
    where: { schoolId, anneeScolaire },
    include: { classe: true, salles: true },
    orderBy: { dateDebut: 'asc' },
  });
};

export const getExamenById = async (id, schoolId) => {
  return await prisma.examenBlanc.findFirst({
    where: { id, schoolId },
    include: { classe: true, salles: true, resultats: { include: { eleve: true, matiere: true } } },
  });
};

export const createExamen = async (schoolId, data) => {
  return await prisma.examenBlanc.create({ data: { ...data, schoolId } });
};

export const deleteExamen = async (id, schoolId) => {
  return await prisma.examenBlanc.deleteMany({ where: { id, schoolId } });
};

export const addSalle = async (schoolId, examenId, data) => {
  const examen = await prisma.examenBlanc.findFirst({ where: { id: examenId, schoolId }, select: { id: true } });
  if (!examen) throw new Error('Examen non trouvé');
  return await prisma.examenSalle.create({ data: { examenId, ...data } });
};

export const addResultat = async (schoolId, examenId, data) => {
  const examen = await prisma.examenBlanc.findFirst({ where: { id: examenId, schoolId }, select: { id: true } });
  if (!examen) throw new Error('Examen non trouvé');
  return await prisma.examenResultat.create({ data: { examenId, ...data } });
};

export const getResultats = async (schoolId, examenId) => {
  return await prisma.examenResultat.findMany({
    where: { examenId, examen: { is: { schoolId } } },
    include: { eleve: true, matiere: true },
    orderBy: { note: 'desc' },
  });
};

export const repartitionSalles = async (schoolId, examenId) => {
  const examenData = await prisma.examenBlanc.findFirst({
    where: { id: examenId, schoolId },
    include: {
      classe: {
        include: {
          inscriptions: {
            where: { anneeScolaire: '2025-2026' },
            include: { eleve: true },
          },
        },
      },
      salles: true,
    },
  });
  if (!examenData) throw new Error('Examen non trouvé');
  const eleves = examenData.classe.inscriptions.map(i => i.eleve);
  const salles = examenData.salles;
  const capaciteTotale = salles.reduce((sum, s) => sum + s.capacite, 0);
  if (eleves.length > capaciteTotale) throw new Error('Capacité insuffisante pour tous les élèves');
  let repartition = [];
  let index = 0;
  const nbSalles = salles.length;
  for (const salle of salles) {
    const nbEleves = Math.ceil(eleves.length / nbSalles);
    const elevesSalle = eleves.slice(index, index + nbEleves);
    repartition.push({
      salle: salle.nomSalle,
      capacite: salle.capacite,
      eleves: elevesSalle.map(e => ({ id: e.id, nom: `${e.nom} ${e.prenom}` })),
    });
    index += nbEleves;
  }
  return repartition;
};

export const getClassement = async (schoolId, examenId) => {
  const results = await prisma.examenResultat.findMany({
    where: { examenId, examen: { is: { schoolId } } },
    include: { eleve: true },
  });
  const notesParEleve = new Map();
  for (const r of results) {
    if (!notesParEleve.has(r.eleveId)) {
      notesParEleve.set(r.eleveId, {
        eleveId: r.eleveId,
        nom: `${r.eleve.nom} ${r.eleve.prenom}`,
        total: 0,
        count: 0,
      });
    }
    const entry = notesParEleve.get(r.eleveId);
    entry.total += r.note;
    entry.count++;
  }
  const classement = Array.from(notesParEleve.values()).map(e => ({
    eleveId: e.eleveId,
    nom: e.nom,
    moyenne: e.count > 0 ? e.total / e.count : 0,
  }));
  classement.sort((a, b) => b.moyenne - a.moyenne);
  return classement;
};

export const generateClassementPDF = async (schoolId, examenId) => {
  const classement = await getClassement(schoolId, examenId);
  const examen = await prisma.examenBlanc.findFirst({
    where: { id: examenId, schoolId },
    include: { classe: true, school: true },
  });
  if (!examen) throw new Error('Examen non trouvé');

  const doc = new PDFDocument({ margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  doc.fontSize(18).text(`Classement - ${examen.nom}`, { align: 'center' });
  doc.fontSize(12).text(`Établissement : ${examen.school?.name || ''}`, { align: 'center' });
  doc.text(`Classe : ${examen.classe?.nom}`, { align: 'center' });
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown();

  const tableTop = doc.y;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Rang', 50, tableTop);
  doc.text('Élève', 120, tableTop);
  doc.text('Moyenne /20', 400, tableTop);

  let y = tableTop + 15;
  classement.forEach((c, idx) => {
    doc.font('Helvetica').fontSize(10);
    doc.text((idx + 1).toString(), 50, y);
    doc.text(c.nom, 120, y);
    doc.text(c.moyenne.toFixed(2), 400, y);
    y += 18;
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });
  doc.end();
  return stream;
};