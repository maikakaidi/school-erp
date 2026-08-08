import prisma from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { createNotification } from '../notifications/notifications.service.js';

function getOrdinalSuffix(n) {
  if (n === 1) return 'ère';
  return 'ème';
}

export const calculateBulletin = async (schoolId, eleveId, semestre, anneeScolaire) => {
  const eleve = await prisma.eleve.findFirst({
    where: { id: eleveId, schoolId },
    include: {
      inscriptions: {
        where: { anneeScolaire },
        include: { classe: true },
      },
    },
  });
  if (!eleve) throw new Error('Élève non trouvé');
  const inscription = eleve.inscriptions[0];
  if (!inscription) throw new Error('Élève non inscrit pour cette année');
  const classe = inscription.classe;
  const classeId = classe.id;

  const notesEleve = await prisma.note.findMany({
    where: { schoolId, eleveId, semestre, anneeScolaire },
    include: { matiere: true },
  });
  if (notesEleve.length === 0) throw new Error('Aucune note trouvée pour cet élève');

  const elevesClasse = await prisma.eleve.findMany({
    where: {
      schoolId,
      inscriptions: { some: { classeId, anneeScolaire } },
      isActive: true,
    },
    include: {
      notes: {
        where: { semestre, anneeScolaire },
        include: { matiere: true },
      },
    },
  });

  const coefficients = await prisma.coefficient.findMany({
    where: { schoolId, classeId, anneeScolaire },
  });
  const coeffMap = new Map();
  coefficients.forEach(c => coeffMap.set(c.matiereId, c.coefficient));

  const matieresIds = [...new Set(notesEleve.map(n => n.matiereId))];
  const moyennesClasseParMatiere = {};
  for (const matId of matieresIds) {
    let sum = 0, count = 0;
    for (const e of elevesClasse) {
      const note = e.notes.find(n => n.matiereId === matId);
      if (note && note.moyenne !== null) { sum += note.moyenne; count++; }
    }
    moyennesClasseParMatiere[matId] = count > 0 ? sum / count : 0;
  }

  let totalPoints = 0, totalCoefs = 0;
  let totalPointsScientifique = 0, totalCoefsScientifique = 0;
  let totalPointsLitteraire = 0, totalCoefsLitteraire = 0;

  const matieresDetails = [];
  for (const n of notesEleve) {
    const coeff = coeffMap.get(n.matiereId) || 1;
    const moyenneMatiere = n.moyenne || 0;
    const moyenneClasse = moyennesClasseParMatiere[n.matiereId] || 0;
    const noteCompo = n.composition || 0;
    const appreciation = n.appreciation || '';
    const pointCoef = moyenneMatiere * coeff;
    totalPoints += pointCoef;
    totalCoefs += coeff;
    const typeMatiere = n.matiere.type || '';
    if (typeMatiere === 'scientifique') {
      totalPointsScientifique += pointCoef;
      totalCoefsScientifique += coeff;
    } else if (typeMatiere === 'littéraire') {
      totalPointsLitteraire += pointCoef;
      totalCoefsLitteraire += coeff;
    }
    matieresDetails.push({
      libelle: n.matiere.libelle,
      coefficient: coeff,
      moyenneClasse,
      noteCompo,
      moyenne: moyenneMatiere,
      moyenneCoef: pointCoef,
      appreciation,
    });
  }

  const generalAverage = totalCoefs > 0 ? totalPoints / totalCoefs : 0;
  const moyenneScientifique = totalCoefsScientifique > 0 ? totalPointsScientifique / totalCoefsScientifique : 0;
  const moyenneLitteraire = totalCoefsLitteraire > 0 ? totalPointsLitteraire / totalCoefsLitteraire : 0;

  const moyennesEleves = [];
  for (const e of elevesClasse) {
    let total = 0, coefs = 0;
    for (const n of e.notes) {
      const coeff = coeffMap.get(n.matiereId) || 1;
      total += (n.moyenne || 0) * coeff;
      coefs += coeff;
    }
    moyennesEleves.push({ eleveId: e.id, moyenne: coefs > 0 ? total / coefs : 0 });
  }
  moyennesEleves.sort((a, b) => b.moyenne - a.moyenne);
  const rang = moyennesEleves.findIndex(e => e.eleveId === eleveId) + 1;
  const meilleureMoyenne = moyennesEleves[0]?.moyenne || 0;
  const moinsBonneMoyenne = moyennesEleves[moyennesEleves.length - 1]?.moyenne || 0;
  const effectif = elevesClasse.length;

  return {
    eleveId,
    nom: `${eleve.nom} ${eleve.prenom}`,
    matricule: eleve.matricule,
    dateNaissance: eleve.dateNaissance,
    lieuNaissance: eleve.lieuNaissance,
    classe: classe.nom,
    semestre,
    anneeScolaire,
    effectif,
    rang,
    generalAverage,
    meilleureMoyenne,
    moinsBonneMoyenne,
    totalPoints,
    totalCoefs,
    moyenneScientifique,
    moyenneLitteraire,
    matieres: matieresDetails,
  };
};


export const generateBulletinPDF = async (schoolId, eleveId, semestre, anneeScolaire) => {
  const bulletinData = await calculateBulletin(schoolId, eleveId, semestre, anneeScolaire);
  const eleve = await prisma.eleve.findFirst({ where: { id: eleveId, schoolId } });
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { settings: true },
  });
  if (!eleve) throw new Error('Élève non trouvé');
  const settings = school.settings || {};

  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // ─── Dimensions page A4 ───────────────────────────────────────────────────
  const PAGE_W = 595.28;
  const MARGIN = 28;
  const CONTENT_W = PAGE_W - MARGIN * 2;  // ~539

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const drawRect = (x, y, w, h) => doc.rect(x, y, w, h).stroke();
  const fillRect = (x, y, w, h, color) => {
    doc.save().rect(x, y, w, h).fill(color).restore();
  };
  const hLine = (x1, y, x2, lw = 0.5) =>
    doc.save().lineWidth(lw).moveTo(x1, y).lineTo(x2, y).stroke().restore();
  const vLine = (x, y1, y2, lw = 0.5) =>
    doc.save().lineWidth(lw).moveTo(x, y1).lineTo(x, y2).stroke().restore();

  // Dessine toutes les lignes verticales d'un tableau entre y1 et y2
  const drawTableVLines = (cols, y1, y2) => {
    let x = MARGIN;
    for (const w of cols) {
      vLine(x, y1, y2);
      x += w;
    }
    vLine(x, y1, y2); // dernière bordure droite
  };

  const cellText = (text, x, y, w, h, opts = {}) => {
    const {
      align = 'center',
      bold = false,
      fontSize = 7,
      color = 'black',
      paddingTop = 0,
    } = opts;
    doc
      .save()
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(fontSize)
      .fillColor(color)
      .text(String(text ?? ''), x + 2, y + 2 + paddingTop, {
        width: w - 4,
        height: h - 4,
        align,
        lineBreak: false,
        ellipsis: true,
      })
      .restore();
  };

  // ─── EN-TÊTE ──────────────────────────────────────────────────────────────
  let curY = MARGIN;
  const headerH = 68;

  // Bloc gauche : école
  const schoolName = settings.schoolName || school.name || 'API-SCHOOL';
  const slogan = settings.slogan || 'Excellence et Discipline';
  const phone = school.phone || settings.phone || '99 33 21 33';
  const city = 'Niamey-Niger';

  // Colonne gauche (école)
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('black')
    .text(schoolName, MARGIN, curY + 4, { width: 180, align: 'center' });
  doc.font('Helvetica').fontSize(7.5)
    .text(city, MARGIN, curY + 17, { width: 180, align: 'center' })
    .text(slogan, MARGIN, curY + 28, { width: 180, align: 'center' })
    .text(`Tel: ${phone}`, MARGIN, curY + 39, { width: 180, align: 'center' });

  // Logo centré
  let logoLoaded = false;
  if (settings.logoUrl) {
    try {
      let logoUrl = settings.logoUrl;
      if (!logoUrl.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        logoUrl = `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
      }
      const response = await fetch(logoUrl);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const logoW = 60;
        const logoX = (PAGE_W - logoW) / 2;
        doc.image(Buffer.from(buffer), logoX, curY + 2, { width: logoW, height: logoW });
        logoLoaded = true;
      }
    } catch (err) { /* logo non chargé */ }
  }
  if (!logoLoaded) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#999')
      .text('API-SCHOOL', (PAGE_W - 100) / 2, curY + 22, { width: 100, align: 'center' });
  }

  // Colonne droite (République)
  const rightX = PAGE_W - MARGIN - 180;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
    .text('REPUBLIQUE DU NIGER', rightX, curY + 4, { width: 180, align: 'center' })
    .text("MINISTERE DE L'EDUCATION NATIONALE", rightX, curY + 15, { width: 180, align: 'center' })
    .text('DREN NIAMEY', rightX, curY + 30, { width: 180, align: 'center' })
    .text('DDEN NIAMEY III', rightX, curY + 41, { width: 180, align: 'center' });

  curY += headerH;

  // ─── TITRE PRINCIPAL ──────────────────────────────────────────────────────
  const semestreLabel = semestre === 1 ? '1ER' : '2ÈME';
  const titreText = `BULLETIN DE NOTES DU ${semestreLabel} SEMESTRE ANNEE SCOLAIRE : ${anneeScolaire}`;
  hLine(MARGIN, curY, PAGE_W - MARGIN, 1);
  curY += 4;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('black')
    .text(titreText, MARGIN, curY, { width: CONTENT_W, align: 'center', underline: true });
  curY += 16;
  hLine(MARGIN, curY, PAGE_W - MARGIN, 1);
  curY += 4;

  // ─── INFOS ÉLÈVE (2 colonnes avec bordures) ───────────────────────────────
  const infoH = 14;
  const col1W = 175;
  const col2W = 195;
  const col3W = 90;
  const col4W = CONTENT_W - col1W - col2W - col3W;

  const infoStartY = curY;
  const infoRows = [
    ['Matricule:', bulletinData.matricule || '_____', 'Classe:', bulletinData.classe],
    ['Nom et Prénom:', bulletinData.nom, 'Effectif:', String(bulletinData.effectif)],
    [
      'Date.Lieu.Nais:',
      `${new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')} à ${eleve.lieuNaissance || 'Niamey'}`,
      'Moyenne:',
      bulletinData.generalAverage.toFixed(2),
    ],
    ['Moy. sur 20:', bulletinData.generalAverage.toFixed(2), '+ Forte:', bulletinData.meilleureMoyenne.toFixed(2)],
    ['Rang:', `${bulletinData.rang}${getOrdinalSuffix(bulletinData.rang)}`, '+ Faible:', bulletinData.moinsBonneMoyenne.toFixed(2)],
  ];

  for (let i = 0; i < infoRows.length; i++) {
    const row = infoRows[i];
    const y = infoStartY + i * infoH;
    // Fond gris léger sur les labels
    fillRect(MARGIN, y, col1W, infoH, '#e8e8e8');
    fillRect(MARGIN + col1W + col2W, y, col3W, infoH, '#e8e8e8');

    cellText(row[0], MARGIN, y, col1W, infoH, { bold: true, align: 'left', fontSize: 7.5 });
    cellText(row[1], MARGIN + col1W, y, col2W, infoH, { align: 'left', fontSize: 7.5 });
    cellText(row[2], MARGIN + col1W + col2W, y, col3W, infoH, { bold: true, align: 'left', fontSize: 7.5 });
    cellText(row[3], MARGIN + col1W + col2W + col3W, y, col4W, infoH, { align: 'left', fontSize: 7.5 });

    hLine(MARGIN, y, PAGE_W - MARGIN);
  }
  curY = infoStartY + infoRows.length * infoH;
  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.8);

  // Bordures verticales bloc infos
  vLine(MARGIN, infoStartY, curY);
  vLine(MARGIN + col1W, infoStartY, curY);
  vLine(MARGIN + col1W + col2W, infoStartY, curY);
  vLine(MARGIN + col1W + col2W + col3W, infoStartY, curY);
  vLine(PAGE_W - MARGIN, infoStartY, curY);

  curY += 5;

  // ─── TABLEAU DES MATIÈRES ─────────────────────────────────────────────────
  // Largeurs colonnes (total = CONTENT_W ~539)
  // DISCIPLINES | Coeff | Moy.Classe | Note.Compo | Moy/20 | Moy.coeff | Appréciation | Signature
  const tCols = [120, 32, 52, 52, 42, 52, 95, 94];
  // Vérification : somme = 539 ✓
  const ROW_H = 15;
  const tableStartY = curY;

  // En-tête tableau
  const tHeaders = ['DISCIPLINES', 'Coeff', 'Moy.Classe', 'Note.Compo', 'Moy/20', 'Moy.coeff', 'Appréciation', 'Signature'];
  fillRect(MARGIN, curY, CONTENT_W, ROW_H, '#d0d0d0');
  let xh = MARGIN;
  for (let i = 0; i < tHeaders.length; i++) {
    cellText(tHeaders[i], xh, curY, tCols[i], ROW_H, { bold: true, align: 'center', fontSize: 7 });
    xh += tCols[i];
  }
  hLine(MARGIN, curY, PAGE_W - MARGIN, 1);
  hLine(MARGIN, curY + ROW_H, PAGE_W - MARGIN, 1);
  drawTableVLines(tCols, curY, curY + ROW_H);
  curY += ROW_H;

  // Lignes matières
  let runningCoef = 0;
  let runningPoints = 0;

  for (let idx = 0; idx < bulletinData.matieres.length; idx++) {
    const m = bulletinData.matieres[idx];
    // Alternance fond
    if (idx % 2 === 1) fillRect(MARGIN, curY, CONTENT_W, ROW_H, '#f5f5f5');

    let xm = MARGIN;
    cellText(m.libelle, xm, curY, tCols[0], ROW_H, { align: 'left', fontSize: 7.5 });
    xm += tCols[0];
    cellText(m.coefficient, xm, curY, tCols[1], ROW_H, { align: 'center', fontSize: 7.5 });
    xm += tCols[1];
    cellText(m.moyenneClasse.toFixed(2), xm, curY, tCols[2], ROW_H, { align: 'center', fontSize: 7.5 });
    xm += tCols[2];
    cellText(m.noteCompo.toFixed(2), xm, curY, tCols[3], ROW_H, { align: 'center', fontSize: 7.5 });
    xm += tCols[3];
    cellText(m.moyenne.toFixed(2), xm, curY, tCols[4], ROW_H, { align: 'center', fontSize: 7.5 });
    xm += tCols[4];
    cellText(m.moyenneCoef.toFixed(2), xm, curY, tCols[5], ROW_H, { align: 'center', fontSize: 7.5 });
    xm += tCols[5];
    cellText(m.appreciation || '', xm, curY, tCols[6], ROW_H, { align: 'left', fontSize: 7.5 });
    xm += tCols[6];
    // Colonne Signature vide
    curY += ROW_H;
    hLine(MARGIN, curY, PAGE_W - MARGIN, 0.4);
    drawTableVLines(tCols, curY - ROW_H, curY);

    runningCoef += m.coefficient;
    runningPoints += m.moyenneCoef;

    if (curY > 750) { doc.addPage(); curY = MARGIN; }
  }

  // Ligne TOTAL
  fillRect(MARGIN, curY, CONTENT_W, ROW_H, '#d0d0d0');
  let xt = MARGIN;
  cellText('Total', xt, curY, tCols[0], ROW_H, { bold: true, align: 'left', fontSize: 8 });
  xt += tCols[0];
  cellText(runningCoef, xt, curY, tCols[1], ROW_H, { bold: true, align: 'center', fontSize: 8 });
  xt += tCols[1] + tCols[2] + tCols[3] + tCols[4]; // colonnes vides
  cellText(runningPoints.toFixed(2), xt, curY, tCols[5], ROW_H, { bold: true, align: 'center', fontSize: 8 });
  hLine(MARGIN, curY, PAGE_W - MARGIN, 1);
  hLine(MARGIN, curY + ROW_H, PAGE_W - MARGIN, 1);
  drawTableVLines(tCols, curY, curY + ROW_H);
  curY += ROW_H + 4;

  // ─── LIGNE MOYENNES SEMESTRES ─────────────────────────────────────────────
  const moyH = 16;
  const moy3cols = [CONTENT_W / 3, CONTENT_W / 3, CONTENT_W / 3];
  const moyStartY = curY;

  // Fond gris pour les labels
  fillRect(MARGIN, curY, CONTENT_W / 3, moyH, '#e0e0e0');
  fillRect(MARGIN + CONTENT_W / 3, curY, CONTENT_W / 3, moyH, '#eeeeee');
  fillRect(MARGIN + (2 * CONTENT_W) / 3, curY, CONTENT_W / 3, moyH, '#e0e0e0');

  const sLabel1 = semestre === 1 ? '1er' : '2ème';
  const sLabel2 = semestre === 1 ? '2ème' : '1er';
  cellText(`Moyenne du ${sLabel1} semestre`, MARGIN, curY, CONTENT_W / 3, moyH / 2, { bold: true, align: 'center', fontSize: 7 });
  cellText(`Moyenne du ${sLabel2} semestre`, MARGIN + CONTENT_W / 3, curY, CONTENT_W / 3, moyH / 2, { bold: true, align: 'center', fontSize: 7 });
  cellText('Moyenne Annuelle', MARGIN + (2 * CONTENT_W) / 3, curY, CONTENT_W / 3, moyH / 2, { bold: true, align: 'center', fontSize: 7 });

  cellText(bulletinData.generalAverage.toFixed(2), MARGIN, curY + moyH / 2, CONTENT_W / 3, moyH / 2, { bold: true, align: 'center', fontSize: 8 });
  cellText('---', MARGIN + CONTENT_W / 3, curY + moyH / 2, CONTENT_W / 3, moyH / 2, { align: 'center', fontSize: 8 });
  cellText('---', MARGIN + (2 * CONTENT_W) / 3, curY + moyH / 2, CONTENT_W / 3, moyH / 2, { align: 'center', fontSize: 8 });

  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.8);
  hLine(MARGIN, curY + moyH, PAGE_W - MARGIN, 0.8);
  drawTableVLines(moy3cols, curY, curY + moyH);
  curY += moyH;

  // ─── LIGNE SCIENTIFIQUE / LITTÉRAIRE ─────────────────────────────────────
  const sciH = 13;
  // 4 colonnes égales
  const sciW = CONTENT_W / 4;

  fillRect(MARGIN, curY, sciW, sciH, '#e8e8e8');
  fillRect(MARGIN + 2 * sciW, curY, sciW, sciH, '#e8e8e8');

  cellText(`Total scientifique sur 140 :`, MARGIN, curY, sciW, sciH, { bold: true, align: 'left', fontSize: 7 });
  cellText((bulletinData.moyenneScientifique * 7).toFixed(2), MARGIN + sciW, curY, sciW, sciH, { align: 'center', fontSize: 7.5 });
  cellText('Moyenne scientifique sur 20 :', MARGIN + 2 * sciW, curY, sciW, sciH, { bold: true, align: 'left', fontSize: 7 });
  cellText(bulletinData.moyenneScientifique.toFixed(2), MARGIN + 3 * sciW, curY, sciW, sciH, { align: 'center', fontSize: 7.5 });

  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.4);
  hLine(MARGIN, curY + sciH, PAGE_W - MARGIN, 0.4);
  [0, 1, 2, 3].forEach(i => vLine(MARGIN + i * sciW, curY, curY + sciH));
  vLine(PAGE_W - MARGIN, curY, curY + sciH);
  curY += sciH;

  fillRect(MARGIN, curY, sciW, sciH, '#e8e8e8');
  fillRect(MARGIN + 2 * sciW, curY, sciW, sciH, '#e8e8e8');
  cellText('Total littéraire sur 280 :', MARGIN, curY, sciW, sciH, { bold: true, align: 'left', fontSize: 7 });
  cellText((bulletinData.moyenneLitteraire * 14).toFixed(2), MARGIN + sciW, curY, sciW, sciH, { align: 'center', fontSize: 7.5 });
  cellText('Moyenne littéraire sur 20 :', MARGIN + 2 * sciW, curY, sciW, sciH, { bold: true, align: 'left', fontSize: 7 });
  cellText(bulletinData.moyenneLitteraire.toFixed(2), MARGIN + 3 * sciW, curY, sciW, sciH, { align: 'center', fontSize: 7.5 });

  hLine(MARGIN, curY + sciH, PAGE_W - MARGIN, 0.8);
  [0, 1, 2, 3].forEach(i => vLine(MARGIN + i * sciW, curY, curY + sciH));
  vLine(PAGE_W - MARGIN, curY, curY + sciH);
  curY += sciH + 2;

  // ─── BLOC MENTIONS (4 colonnes) ───────────────────────────────────────────
  // CONDUITE | TRAVAIL | TABLEAU D'HONNEUR | ASSIDUITE-RETARD
  const mentionCols = [
    {
      label: 'CONDUITE',
      options: ['Bien', 'Passable', 'Mal', 'Avertissement', 'Blâme'],
    },
    {
      label: 'TRAVAIL',
      options: ['Avertissement', 'Blâme'],
    },
    {
      label: "TABLEAU D'HONNEUR",
      options: ['Inscrit(e)', 'Félicitation', 'Encouragement', 'Non-Inscrit(e)'],
    },
    {
      label: 'ASSIDUITE-RETARD',
      options: ['Absence non justifiées: 0', 'Retard non justifié: 0', 'Expulsions: 0'],
    },
  ];

  const mColW = CONTENT_W / 4;
  const mHeaderH = 13;
  const mRowH = 13;
  const maxRows = Math.max(...mentionCols.map(c => c.options.length));
  const mentionBlockH = mHeaderH + maxRows * mRowH;
  const mentionStartY = curY;

  // En-têtes colonnes mentions
  mentionCols.forEach((col, i) => {
    fillRect(MARGIN + i * mColW, curY, mColW, mHeaderH, '#d0d0d0');
    cellText(col.label, MARGIN + i * mColW, curY, mColW, mHeaderH, { bold: true, align: 'center', fontSize: 7.5 });
  });
  hLine(MARGIN, curY, PAGE_W - MARGIN, 1);
  hLine(MARGIN, curY + mHeaderH, PAGE_W - MARGIN, 0.8);
  [0, 1, 2, 3].forEach(i => vLine(MARGIN + i * mColW, curY, curY + mentionBlockH));
  vLine(PAGE_W - MARGIN, curY, curY + mentionBlockH);
  curY += mHeaderH;

  // Options avec cases à cocher
  for (let row = 0; row < maxRows; row++) {
    mentionCols.forEach((col, colIdx) => {
      const option = col.options[row];
      if (option) {
        const cx = MARGIN + colIdx * mColW + 4;
        const cy = curY + 3;
        // Case à cocher
        doc.save().lineWidth(0.5).rect(cx, cy, 7, 7).stroke().restore();
        doc.font('Helvetica').fontSize(7).fillColor('black')
          .text(option, cx + 10, cy + 0.5, { width: mColW - 18, lineBreak: false });
      }
    });
    curY += mRowH;
    hLine(MARGIN, curY, PAGE_W - MARGIN, 0.3);
  }

  // Redessiner bordures verticales mentions (après les lignes internes)
  [0, 1, 2, 3].forEach(i => vLine(MARGIN + i * mColW, mentionStartY, curY));
  vLine(PAGE_W - MARGIN, mentionStartY, curY);
  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.8);
  curY += 4;

  // ─── RÉSULTAT FIN D'ANNÉE ─────────────────────────────────────────────────
  const resH = 16;
  fillRect(MARGIN, curY, 110, resH, '#e8e8e8');
  cellText('Résultat de fin d\'année :', MARGIN, curY, 110, resH, { bold: true, align: 'left', fontSize: 8 });

  const resultOptions = ['Passe', 'Redouble', 'Exclu'];
  const resOptW = (CONTENT_W - 110) / 3;
  resultOptions.forEach((opt, i) => {
    const rx = MARGIN + 110 + i * resOptW;
    doc.save().lineWidth(0.5).rect(rx + 4, curY + 4, 8, 8).stroke().restore();
    cellText(opt, rx + 16, curY, resOptW - 16, resH, { align: 'left', fontSize: 8 });
    vLine(rx, curY, curY + resH, 0.4);
  });
  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.8);
  hLine(MARGIN, curY + resH, PAGE_W - MARGIN, 0.8);
  vLine(MARGIN, curY, curY + resH);
  vLine(PAGE_W - MARGIN, curY, curY + resH);
  curY += resH;

  // ─── APPRÉCIATION DU PROVISEUR ────────────────────────────────────────────
  const appH = 50;
  const appHalfW = CONTENT_W / 2;

  hLine(MARGIN, curY, PAGE_W - MARGIN, 0.8);
  cellText('Appréciation du Proviseur', MARGIN, curY, appHalfW, 14, { bold: true, align: 'left', fontSize: 8 });
  cellText('Visa des Parents', MARGIN + appHalfW, curY, appHalfW, 14, { bold: false, align: 'left', fontSize: 8 });

  curY += 14;
  // Travail appréciation
  doc.font('Helvetica-Oblique').fontSize(8).fillColor('black')
    .text('Travail : Très Bien', MARGIN + 4, curY + 2);

  vLine(MARGIN, curY - 14, curY + appH);
  vLine(MARGIN + appHalfW, curY - 14, curY + appH);
  vLine(PAGE_W - MARGIN, curY - 14, curY + appH);
  hLine(MARGIN, curY + appH, PAGE_W - MARGIN, 0.8);

  doc.end();

  createNotification(schoolId, {
    type: 'bulletin',
    title: 'Bulletin généré',
    message: `Bulletin de ${eleve.nom} ${eleve.prenom} — Semestre ${semestre} (${anneeScolaire})`,
    link: '/bulletins',
  }).catch(() => {});

  return stream;
};


export const getClassement = async (schoolId, classeId, semestre, anneeScolaire) => {
  const eleves = await prisma.eleve.findMany({
    where: { schoolId, inscriptions: { some: { classeId, anneeScolaire } } },
    include: {
      notes: { where: { semestre, anneeScolaire } },
    },
  });
  const coeffs = await prisma.coefficient.findMany({
    where: { schoolId, classeId, anneeScolaire },
  });
  const coeffMap = new Map();
  coeffs.forEach(c => coeffMap.set(c.matiereId, c.coefficient));
  const classement = [];
  for (const eleve of eleves) {
    let total = 0, totalCoef = 0;
    for (const note of eleve.notes) {
      const coeff = coeffMap.get(note.matiereId) || 1;
      total += (note.moyenne || 0) * coeff;
      totalCoef += coeff;
    }
    classement.push({ eleve: `${eleve.nom} ${eleve.prenom}`, moyenne: totalCoef > 0 ? total / totalCoef : 0 });
  }
  classement.sort((a, b) => b.moyenne - a.moyenne);
  return classement;
};