import prisma from '../../config/database.js';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { createNotification } from '../notifications/notifications.service.js';
import { drawPdfFooter, formatFCFA, nombreEnLettres } from '../../utils/pdf.generator.js';

// Numéro de reçu séquentiel lisible : REC-YYYY-NNNN (par école)
export const nextReceiptNumber = (anneeScolaire, lastRecuNumber) => {
  const year = (anneeScolaire || '').match(/^(\d{4})/)?.[1]?.slice(2) || String(new Date().getFullYear()).slice(2);
  let seq = 1;
  if (lastRecuNumber) {
    const m = lastRecuNumber.match(/^REC-(\d{2})-(\d{4})$/);
    if (m && m[1] === year) seq = parseInt(m[2], 10) + 1;
  }
  return `REC-${year}-${String(seq).padStart(4, '0')}`;
};

const generateReceiptNumber = async (schoolId, anneeScolaire) => {
  const last = await prisma.versement.findFirst({
    where: { schoolId },
    orderBy: { recuNumber: 'desc' },
    select: { recuNumber: true },
  });
  return nextReceiptNumber(anneeScolaire, last?.recuNumber);
};

export const createVersement = async (schoolId, data) => {
  const montantPaye = data.montant - (data.reduction || 0);
  const eleve = await prisma.eleve.findFirst({ where: { id: data.eleveId, schoolId } });
  if (!eleve) throw new Error('Élève non trouvé');

  let versement = null;
  for (let attempt = 0; attempt < 3 && !versement; attempt++) {
    const recuNumber = await generateReceiptNumber(schoolId, data.anneeScolaire);
    try {
      versement = await prisma.versement.create({
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
    } catch (error) {
      // Conflit sur le numéro séquentiel (rare) : on regénère
      if (error?.code === 'P2002' && attempt < 2) continue;
      throw error;
    }
  }

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

export const getVersementByRecuNumber = async (schoolId, recuNumber) => {
  return await prisma.versement.findFirst({
    where: { schoolId, recuNumber },
    include: {
      school: true,
      eleve: true,
    },
  });
};

// Récupère la classe de l'élève pour l'année du versement (inscription la plus récente sinon)
const getClasseForVersement = async (schoolId, eleveId, anneeScolaire) => {
  const inscription = await prisma.inscription.findFirst({
    where: { schoolId, eleveId, anneeScolaire },
    include: { classe: { select: { id: true, nom: true } } },
    orderBy: { dateInscription: 'desc' },
  });
  return inscription?.classe || null;
};

export const generateReçuPDF = async (schoolId, recuNumber) => {
  const versement = await getVersementByRecuNumber(schoolId, recuNumber);
  if (!versement) throw new Error('Reçu introuvable');

  const school = versement.school;
  const eleve = versement.eleve;
  const classe = await getClasseForVersement(schoolId, eleve.id, versement.anneeScolaire);
  const classeNom = classe?.nom || null;

  const frais = classe ? await prisma.fraisScolaire.findFirst({
    where: { schoolId, classeId: classe.id, anneeScolaire: versement.anneeScolaire },
  }) : null;
  const situation = await getSituationFinanciere(
    schoolId,
    eleve.id,
    versement.anneeScolaire,
    frais?.total ?? 300000
  );

  const settings = await prisma.schoolSetting.findFirst({ where: { schoolId } }).catch(() => null);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const stream = new PassThrough();
  doc.pipe(stream);

  // ─── EN-TÊTE ÉCOLE ─────────────────────────────────────────────────────────
  const schoolName = settings?.schoolName || school.name || 'API-SCHOOL';
  const slogan = settings?.slogan || school.slogan || '';
  const address = settings?.address || school.address || '';
  const phone = school.phone || settings?.phone || '';

  let logoLoaded = false;
  const logoUrl = settings?.logoUrl || school.logo;
  if (logoUrl) {
    try {
      let url = logoUrl;
      if (!url.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        doc.image(Buffer.from(buffer), 50, 42, { width: 48, height: 48 });
        logoLoaded = true;
      }
    } catch { /* logo non chargé */ }
  }
  if (logoLoaded) doc.x = 108;
  else doc.x = 50;

  doc.font('Helvetica-Bold').fontSize(16).fillColor('black').text(schoolName, { align: logoLoaded ? 'left' : 'center', width: 495 });
  doc.font('Helvetica').fontSize(9).fillColor('#333').text(
    [slogan, address, phone ? `Tél : ${phone}` : ''].filter(Boolean).join('  ·  '),
    { align: logoLoaded ? 'left' : 'center', width: 495 }
  );
  doc.moveDown(0.4);
  doc.save().lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke().restore();
  doc.moveDown(0.6);

  // ─── TITRE ─────────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(14).text('REÇU DE PAIEMENT', { align: 'center' });
  doc.moveDown(0.8);

  const dateStr = new Date(versement.datePaiement).toLocaleDateString('fr-FR');
  const label = (t, v) => {
    doc.font('Helvetica-Bold').fontSize(9).text(t);
    doc.font('Helvetica').fontSize(9).text(v || '—');
    doc.moveDown(0.2);
  };

  // ─── INFOS ÉLÈVE ───────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(10).text('ÉLÈVE');
  doc.moveDown(0.2);
  label('Reçu N°', versement.recuNumber);
  label('Élève', `${eleve.nom} ${eleve.prenom}`);
  label('Matricule', eleve.matricule);
  label('Classe', classeNom || '—');
  label('Année scolaire', versement.anneeScolaire);
  label('Date de paiement', dateStr);
  label('Tranche', `Tranche ${versement.tranche}`);

  // ─── MONTANTS ──────────────────────────────────────────────────────────────
  const row = (t, v, opts = {}) => {
    doc.save()
      .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor(opts.color || 'black')
      .text(t, 50, doc.y, { width: 300, align: 'left' })
      .text(String(v), 350, doc.y, { width: 195, align: 'right' })
      .restore();
    doc.moveDown(0.25);
  };

  doc.moveDown(0.3);
  doc.save().lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke().restore();
  doc.moveDown(0.4);
  row('Montant', formatFCFA(versement.montant));
  row('Réduction', formatFCFA(versement.reduction || 0));
  row('Montant payé', formatFCFA(versement.montantPaye), { bold: true });
  row('Mode de paiement', versement.modePaiement);
  if (versement.commentaire) row('Commentaire', versement.commentaire);
  doc.moveDown(0.4);
  doc.save().lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke().restore();
  doc.moveDown(0.4);

  row('Reste à payer', formatFCFA(situation.resteAPayer), { bold: true, color: situation.resteAPayer > 0 ? '#b00020' : '#0a7d32' });

  doc.moveDown(0.5);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#333')
    .text(`Arrêté le présent reçu à la somme de : ${nombreEnLettres(versement.montantPaye)} francs CFA.`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Cachet et signature', { align: 'right' });

  drawPdfFooter(doc, {
    left: schoolName,
    right: `Reçu ${versement.recuNumber} — ${dateStr}`,
    showPage: true,
    pageNumber: 1,
  });

  doc.end();
  return stream;
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
