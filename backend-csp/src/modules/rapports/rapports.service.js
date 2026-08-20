import prisma from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { drawPdfFooter, formatFCFA } from '../../utils/pdf.generator.js';

const yearBounds = (anneeScolaire) => {
  const m = (anneeScolaire || '').match(/^(\d{4})-(\d{4})$/);
  if (!m) return null;
  return {
    start: new Date(`${m[1]}-09-01T00:00:00.000Z`),
    end: new Date(`${Number(m[2]) + 1}-09-01T00:00:00.000Z`),
  };
};

export const getAssiduiteParClasse = async (schoolId, anneeScolaire, classeId = null) => {
  const bounds = yearBounds(anneeScolaire);
  if (!bounds) {
    const error = new Error('Année scolaire invalide');
    error.status = 400;
    throw error;
  }

  const inscriptions = await prisma.inscription.findMany({
    where: { schoolId, anneeScolaire, ...(classeId ? { classeId } : {}) },
    include: { classe: true },
    distinct: ['eleveId'],
  });

  const classeIds = [...new Set(inscriptions.map((i) => i.classeId))];
  const absences = await prisma.absence.findMany({
    where: { schoolId, classeId: { in: classeIds }, anneeScolaire },
    select: { classeId: true, type: true },
  });

  const compteurs = {};
  for (const a of absences) {
    if (!compteurs[a.classeId]) compteurs[a.classeId] = { absences: 0, retards: 0 };
    if (a.type === 'retard') compteurs[a.classeId].retards += 1;
    else compteurs[a.classeId].absences += 1;
  }

  const effectifParClasse = {};
  for (const i of inscriptions) {
    effectifParClasse[i.classeId] = (effectifParClasse[i.classeId] || 0) + 1;
  }

  const rows = classeIds.map((cid) => {
    const classe = inscriptions.find((i) => i.classeId === cid)?.classe;
    const effectif = effectifParClasse[cid] || 0;
    const c = compteurs[cid] || { absences: 0, retards: 0 };
    const taux = effectif ? Math.round((c.absences / effectif) * 100) / 100 : 0;
    return {
      classe: classe?.nom || '—',
      effectif,
      absences: c.absences,
      retards: c.retards,
      tauxAbsence: taux,
    };
  });

  const total = {
    effectif: Object.values(effectifParClasse).reduce((s, n) => s + n, 0),
    absences: Object.values(compteurs).reduce((s, c) => s + c.absences, 0),
    retards: Object.values(compteurs).reduce((s, c) => s + c.retards, 0),
  };

  return { anneeScolaire, rows, total };
};

export const getPaiementsEnRetard = async (schoolId, anneeScolaire) => {
  const inscriptions = await prisma.inscription.findMany({
    where: { schoolId, anneeScolaire },
    include: { classe: true, eleve: true },
    distinct: ['eleveId'],
  });

  const frais = await prisma.fraisScolaire.findMany({
    where: { schoolId, anneeScolaire },
  });

  const versements = await prisma.versement.findMany({
    where: { schoolId, anneeScolaire },
    select: { eleveId: true, montantPaye: true },
  });

  const payeParEleve = {};
  for (const v of versements) payeParEleve[v.eleveId] = (payeParEleve[v.eleveId] || 0) + v.montantPaye;

  const fraisParClasse = {};
  for (const f of frais) fraisParClasse[f.classeId] = f.total;

  const rows = [];
  for (const i of inscriptions) {
    const fraisTotal = fraisParClasse[i.classeId] || 0;
    const totalPaye = payeParEleve[i.eleveId] || 0;
    const reste = Math.max(0, fraisTotal - totalPaye);
    if (reste > 0) {
      rows.push({
        matricule: i.eleve.matricule,
        eleve: `${i.eleve.nom} ${i.eleve.prenom}`,
        classe: i.classe.nom,
        fraisTotal,
        totalPaye,
        reste,
      });
    }
  }

  rows.sort((a, b) => b.reste - a.reste);

  return {
    anneeScolaire,
    total: rows.length,
    totalReste: rows.reduce((s, r) => s + r.reste, 0),
    rows,
  };
};

const getSchoolHeader = async (schoolId) => {
  const [school, settings] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.schoolSetting.findUnique({ where: { schoolId } }),
  ]);
  return {
    name: settings?.schoolName || school?.name || 'API-SCHOOL',
    slogan: settings?.slogan || school?.slogan || '',
    address: settings?.address || school?.address || '',
    phone: school?.phone || '',
  };
};

const drawHeader = async (doc, schoolId, title) => {
  const h = await getSchoolHeader(schoolId);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('black').text(h.name, { align: 'center', width: 495 });
  doc.font('Helvetica').fontSize(9).fillColor('#333').text(
    [h.slogan, h.address, h.phone ? `Tél : ${h.phone}` : ''].filter(Boolean).join('  •  '),
    { align: 'center', width: 495 }
  );
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111').text(title, { align: 'center', width: 495 });
  doc.moveDown(0.4);
};

const drawTable = (doc, columns, rows) => {
  const pageWidth = doc.page.width - 100;
  const colWidths = columns.map((c) => (c.width || pageWidth / columns.length));
  const headerY = doc.y;

  const drawRow = (cells, y, isHeader) => {
    let x = 50;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    cells.forEach((cell, idx) => {
      if (isHeader) {
        doc.fillColor('#222').text(String(cell), x + 4, y + 4, { width: colWidths[idx] - 8, lineBreak: false });
      } else {
        doc.fillColor('#333').text(String(cell), x + 4, y + 4, { width: colWidths[idx] - 8, lineBreak: false });
      }
      x += colWidths[idx];
    });
    return Math.max(...cells.map((_, i) => colWidths[i])) ;
  };

  doc.font('Helvetica-Bold').fontSize(8);
  doc.rect(50, headerY, pageWidth, 18).fill('#e8e8e8');
  drawRow(columns.map((c) => c.label), headerY, true);
  doc.y = headerY + 18;
  doc.lineWidth(0.5).strokeColor('#bbb');

  rows.forEach((row, i) => {
    if (doc.y + 20 > doc.page.height - 60) {
      drawPdfFooter(doc, { left: 'API-SCHOOL', showPage: true, pageNumber: doc.options._pageCount || 1 });
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(8);
      doc.rect(50, doc.y, pageWidth, 18).fill('#e8e8e8');
      drawRow(columns.map((c) => c.label), doc.y, true);
      doc.y += 18;
    }
    if (i % 2 === 0) {
      doc.rect(50, doc.y, pageWidth, 18).fill('#f5f5f5');
    }
    drawRow(columns.map((c) => c.render ? c.render(row) : row[c.key]), doc.y, false);
    doc.y += 18;
  });
  doc.lineWidth(0.5);
  doc.rect(50, doc.y, pageWidth, 0.5).stroke('#bbb');
};

const finishPdf = (doc, stream, left) => {
  drawPdfFooter(doc, { left, showPage: true, pageNumber: 1 });
  doc.end();
  return stream;
};

export const generateAssiduitePDF = async (schoolId, anneeScolaire, classeId = null) => {
  const data = await getAssiduiteParClasse(schoolId, anneeScolaire, classeId);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);
  await drawHeader(doc, schoolId, `Rapport d'assiduité par classe — ${anneeScolaire}`);

  const columns = [
    { label: 'Classe', key: 'classe', width: 120 },
    { label: 'Effectif', key: 'effectif', width: 80, render: (r) => r.effectif },
    { label: 'Absences', key: 'absences', width: 90, render: (r) => r.absences },
    { label: 'Retards', key: 'retards', width: 90, render: (r) => r.retards },
    { label: 'Taux abs./élève', key: 'tauxAbsence', width: 115, render: (r) => `${r.tauxAbsence}` },
  ];
  drawTable(doc, columns, data.rows);

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111').text(
    `Total : ${data.total.effectif} élèves, ${data.total.absences} absences, ${data.total.retards} retards`
  );

  return finishPdf(doc, stream, `API-SCHOOL — Assiduité ${anneeScolaire}`);
};

export const generatePaiementsPDF = async (schoolId, anneeScolaire) => {
  const data = await getPaiementsEnRetard(schoolId, anneeScolaire);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);
  await drawHeader(doc, schoolId, `Paiements en retard — ${anneeScolaire}`);

  const columns = [
    { label: 'Matricule', key: 'matricule', width: 100 },
    { label: 'Élève', key: 'eleve', width: 150 },
    { label: 'Classe', key: 'classe', width: 80 },
    { label: 'Frais', key: 'fraisTotal', width: 85, render: (r) => formatFCFA(r.fraisTotal) },
    { label: 'Payé', key: 'totalPaye', width: 85, render: (r) => formatFCFA(r.totalPaye) },
    { label: 'Reste', key: 'reste', width: 95, render: (r) => formatFCFA(r.reste) },
  ];
  drawTable(doc, columns, data.rows);

  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#111').text(
    `Total : ${data.total} élèves en retard — ${formatFCFA(data.totalReste)} à recouvrer`
  );

  return finishPdf(doc, stream, `API-SCHOOL — Paiements ${anneeScolaire}`);
};
