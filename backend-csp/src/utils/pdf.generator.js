// Utilitaires partagés de génération PDF (pdfkit)

export const formatFCFA = (n) => `${Math.round(Number(n) || 0).toLocaleString('fr-FR')} FCFA`;

// ─── Nombre en lettres (français) ─────────────────────────────────────────────
const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];

const under100 = (n) => {
  if (n === 0) return '';
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return t === 1 ? 'dix' : ['vingt', 'trente', 'quarante', 'cinquante', 'soixante'][t - 2];
    if (u === 1) return `${['vingt', 'trente', 'quarante', 'cinquante', 'soixante'][t - 2]}-et-un`;
    return `${['vingt', 'trente', 'quarante', 'cinquante', 'soixante'][t - 2]}-${UNITS[u]}`;
  }
  if (n < 80) return n === 71 ? 'soixante-et-onze' : `soixante-${under100(n - 60)}`;
  if (n < 90) return n === 80 ? 'quatre-vingts' : `quatre-vingt-${UNITS[n - 80]}`;
  return n === 90 ? 'quatre-vingt-dix' : `quatre-vingt-${under100(n - 80)}`;
};

const under1000 = (n, beforeUnit = false) => {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const r = n % 100;
  let s = '';
  if (h > 0) s += h === 1 ? 'cent' : `${UNITS[h]} cent${r === 0 && !beforeUnit ? 's' : ''}`;
  if (r > 0) s += (s ? ' ' : '') + under100(r);
  return s;
};

export const nombreEnLettres = (n) => {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return 'zéro';
  const millions = Math.floor(n / 1000000);
  const milliers = Math.floor((n % 1000000) / 1000);
  const reste = n % 1000;
  let s = '';
  if (millions > 0) s += millions === 1 ? 'un million' : `${under1000(millions, true)} millions`;
  if (milliers > 0) {
    s += s ? ' ' : '';
    s += milliers === 1 ? 'mille' : `${under1000(milliers, true)} mille`;
  }
  if (reste > 0) {
    s += s ? ' ' : '';
    s += under1000(reste);
  }
  return s;
};

// ─── Pied de page ─────────────────────────────────────────────────────────────
// À appeler avant un saut de page et à la fin du document.
export const drawPdfFooter = (doc, { left = '', right = '', showPage = false, pageNumber = 1 } = {}) => {
  const w = doc.page.width;
  const y = doc.page.height - 26;
  doc.save()
    .lineWidth(0.5)
    .moveTo(50, y)
    .lineTo(w - 50, y)
    .stroke()
    .restore();
  doc.font('Helvetica').fontSize(7).fillColor('#555');
  if (left) doc.text(left, 50, y + 4, { width: w / 2 - 60, align: 'left', lineBreak: false });
  const rightText = showPage ? `Page ${pageNumber}` : right;
  if (rightText) doc.text(rightText, w - 150, y + 4, { width: 100, align: 'right', lineBreak: false });
};
