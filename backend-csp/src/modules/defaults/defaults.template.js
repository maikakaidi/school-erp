export const MATIERES_CATALOGUE = [
  { libelle: 'Mathématiques', code: 'MATH', type: 'scientifique' },
  { libelle: 'Physique Chimie', code: 'PC', type: 'scientifique' },
  { libelle: 'SVT', code: 'SVT', type: 'scientifique' },
  { libelle: 'Dessin', code: 'DQ', type: '' },
  { libelle: 'Redoublement', code: 'RED', type: '' },
  { libelle: 'Anglais', code: 'ANG', type: '' },
  { libelle: 'Histoire Géographie', code: 'HG', type: 'littéraire' },
  { libelle: 'Education Civique et Morale', code: 'ECM', type: '' },
  { libelle: 'Education Physique et Sportive', code: 'EPS', type: '' },
  { libelle: 'Instruction Civique', code: 'IC', type: '' },
  { libelle: 'Arabe', code: 'ARB', type: '' },
  { libelle: 'Espagnol', code: 'ESP', type: '' },
  { libelle: 'Arabe/Espagnol', code: 'ARB_ESP', type: 'groupe' },
  { libelle: 'Français', code: 'FR', type: '' },
  { libelle: 'Philosophie', code: 'PHIL', type: '' },
  { libelle: 'Informatique', code: 'INFO', type: '' },
];

export const GROUPE_CHOIX = {
  nom: 'Arabe/Espagnol',
  options: ['Arabe', 'Espagnol'],
};

const coeff = (libelle, valeur) => ({ libelle, coefficient: valeur });

export const COLLEGE_CONFIG = {
  '6eme': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 1),
    coeff('SVT', 2),
    coeff('Dessin', 2),
    coeff('Redoublement', 2),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Civique et Morale', 1),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Arabe/Espagnol', 4),
  ],
  '5eme': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 1),
    coeff('SVT', 2),
    coeff('Dessin', 2),
    coeff('Redoublement', 2),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Civique et Morale', 1),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Arabe/Espagnol', 4),
  ],
  '4eme': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 2),
    coeff('SVT', 2),
    coeff('Dessin', 2),
    coeff('Redoublement', 2),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Civique et Morale', 1),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Arabe/Espagnol', 4),
  ],
  '3eme': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 2),
    coeff('SVT', 2),
    coeff('Dessin', 2),
    coeff('Redoublement', 2),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Civique et Morale', 1),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Arabe/Espagnol', 4),
  ],
};

export const LYCEE_CONFIG = {
  '2nde_a': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 2),
    coeff('SVT', 2),
    coeff('Anglais', 3),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 4),
    coeff('Espagnol', 2),
  ],
  '2nde_c': [
    coeff('Mathématiques', 4),
    coeff('Physique Chimie', 4),
    coeff('SVT', 3),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 3),
    coeff('Espagnol', 2),
  ],
  '1ere_a': [
    coeff('Mathématiques', 3),
    coeff('Physique Chimie', 2),
    coeff('SVT', 2),
    coeff('Anglais', 3),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 4),
    coeff('Arabe/Espagnol', 2),
    coeff('Philosophie', 1),
  ],
  '1ere_c': [
    coeff('Mathématiques', 4),
    coeff('Physique Chimie', 4),
    coeff('SVT', 3),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 2),
    coeff('Philosophie', 1),
  ],
  '1ere_d': [
    coeff('Mathématiques', 4),
    coeff('Physique Chimie', 4),
    coeff('SVT', 3),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 2),
    coeff('Philosophie', 1),
  ],
  'tle_a': [
    coeff('Mathématiques', 2),
    coeff('Anglais', 3),
    coeff('Histoire Géographie', 3),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 4),
    coeff('Arabe/Espagnol', 3),
    coeff('Philosophie', 4),
  ],
  'tle_c': [
    coeff('Mathématiques', 5),
    coeff('Physique Chimie', 5),
    coeff('SVT', 5),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 3),
    coeff('Philosophie', 2),
  ],
  'tle_d': [
    coeff('Mathématiques', 5),
    coeff('Physique Chimie', 5),
    coeff('SVT', 5),
    coeff('Anglais', 2),
    coeff('Histoire Géographie', 2),
    coeff('Education Physique et Sportive', 1),
    coeff('Instruction Civique', 1),
    coeff('Education Civique et Morale', 1),
    coeff('Français', 3),
    coeff('Philosophie', 2),
  ],
};

const NIVEAU_TO_KEY = {
  '6eme': '6eme',
  '5eme': '5eme',
  '4eme': '4eme',
  '3eme': '3eme',
  '2nde': null,
  '1ere': null,
  'Terminale': null,
};

function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractLyceeKey(classeNom, niveau) {
  const nom = classeNom.trim();
  const nomNorm = stripAccents(nom);
  if (niveau === '2nde') {
    if (nomNorm.includes('2nde C')) return '2nde_c';
    return '2nde_a';
  }
  if (niveau === '1ere') {
    if (nomNorm.includes('1ere C') || nomNorm.includes('1ère C')) return '1ere_c';
    if (nomNorm.includes('1ere D') || nomNorm.includes('1ère D')) return '1ere_d';
    return '1ere_a';
  }
  if (niveau === 'Terminale') {
    if (nomNorm.includes('Terminale C') || nomNorm.includes('Terminale D') || nomNorm.includes('Tle C') || nomNorm.includes('Tle D')) return 'tle_c';
    return 'tle_a';
  }
  return null;
}

export function getConfigKey(classe) {
  const { niveau, nom } = classe;
  const niveauNorm = stripAccents(niveau);
  const collegeKey = NIVEAU_TO_KEY[niveauNorm];
  if (collegeKey) return { type: 'college', key: collegeKey };
  const lyceeKey = extractLyceeKey(nom, niveauNorm);
  if (lyceeKey) return { type: 'lycee', key: lyceeKey };
  return null;
}
