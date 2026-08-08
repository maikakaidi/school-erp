export const CLASSES = [
  '6ème A','6ème B','5ème A','5ème B',
  '4ème A','4ème B','3ème A','3ème B',
  '2nde A','2nde C','1ère A','1ère D',
  'Tle A','Tle D',
];

export const MATIERES = [
  { id:1,  libelle:'Français',           type:'littéraire' },
  { id:2,  libelle:'Mathématiques',      type:'scientifique' },
  { id:3,  libelle:'Anglais',            type:'scientifique' },
  { id:4,  libelle:'Histoire-Géographie',type:'littéraire' },
  { id:5,  libelle:'Physique-Chimie',    type:'scientifique' },
  { id:6,  libelle:'S-V-T',             type:'scientifique' },
  { id:7,  libelle:'Philosophie',        type:'littéraire' },
  { id:8,  libelle:'Espagnol',           type:'littéraire' },
  { id:9,  libelle:'E-P-S',             type:'scientifique' },
  { id:10, libelle:'E-F-S',             type:'scientifique' },
  { id:11, libelle:'Conduite',           type:'autre' },
  { id:12, libelle:'Informatiques',      type:'autre' },
  { id:13, libelle:'Arabe',             type:'littéraire' },
  { id:14, libelle:'Analyse',           type:'littéraire' },
];

export const ELEVES = [
  { id:118, nom:'Abdoul Karim Ridouane',    classe:'1ère A', sexe:'M', naissance:'12/04/2008', nationalite:'Nigérienne', parent:'Ridouane Karim', tel:'91000001' },
  { id:126, nom:'Amadou Alfari Arafat',     classe:'1ère A', sexe:'M', naissance:'05/08/2008', nationalite:'Nigérienne', parent:'Alfari Amadou',  tel:'91000002' },
  { id:313, nom:'Boubacar Moussa Moustapha',classe:'1ère A', sexe:'M', naissance:'20/01/2008', nationalite:'Nigérienne', parent:'Moussa Boubacar',tel:'91000003' },
  { id:355, nom:'Issoufou Nassourou Rabi',  classe:'1ère A', sexe:'F', naissance:'14/03/2008', nationalite:'Nigérienne', parent:'Nassourou Issoufou',tel:'91000004' },
  { id:227, nom:'Marou Naméwa Nadia',       classe:'1ère A', sexe:'F', naissance:'09/11/2008', nationalite:'Nigérienne', parent:'Naméwa Marou',   tel:'91000005' },
  { id:111, nom:'Morou Seini Salmane',      classe:'1ère A', sexe:'M', naissance:'30/06/2008', nationalite:'Nigérienne', parent:'Seini Morou',    tel:'91000006' },
  { id:293, nom:'Salifou Hamidou Fayza',    classe:'1ère A', sexe:'F', naissance:'17/07/2008', nationalite:'Nigérienne', parent:'Hamidou Salifou',tel:'91000007' },
  { id:88,  nom:'Aboubacar Bilyamine',      classe:'2nde A', sexe:'M', naissance:'22/02/2009', nationalite:'Nigérienne', parent:'Bilyamine Aboubacar',tel:'91000008'},
  { id:99,  nom:'Boukar Issa Ousmane',      classe:'2nde A', sexe:'M', naissance:'11/05/2009', nationalite:'Nigérienne', parent:'Issa Boukar',    tel:'91000009' },
  { id:77,  nom:'Karimou Fadimata',         classe:'2nde A', sexe:'F', naissance:'03/09/2009', nationalite:'Nigérienne', parent:'Karimou Ali',    tel:'91000010' },
  { id:66,  nom:'Salifou Nafissa',          classe:'2nde A', sexe:'F', naissance:'28/12/2009', nationalite:'Nigérienne', parent:'Salifou Maman',  tel:'91000011' },
  { id:55,  nom:'Ibro Nana Aicha',          classe:'3ème A', sexe:'F', naissance:'06/06/2004', nationalite:'Nigérienne', parent:'Ibro Nana',      tel:'91000012' },
];

export const VERSEMENTS = [
  { eleveId:118, classe:'1ère A', frais:144000, verseTotal:86000, reduction:0 },
  { eleveId:126, classe:'1ère A', frais:144000, verseTotal:144000, reduction:0 },
  { eleveId:313, classe:'1ère A', frais:144000, verseTotal:0,      reduction:0 },
  { eleveId:355, classe:'1ère A', frais:144000, verseTotal:98000,  reduction:0 },
  { eleveId:227, classe:'1ère A', frais:144000, verseTotal:144000, reduction:0 },
  { eleveId:111, classe:'1ère A', frais:144000, verseTotal:29000,  reduction:0 },
  { eleveId:293, classe:'1ère A', frais:144000, verseTotal:144000, reduction:0 },
  { eleveId:88,  classe:'2nde A', frais:144000, verseTotal:115000, reduction:0 },
  { eleveId:99,  classe:'2nde A', frais:144000, verseTotal:144000, reduction:0 },
  { eleveId:77,  classe:'2nde A', frais:144000, verseTotal:44000,  reduction:0 },
  { eleveId:66,  classe:'2nde A', frais:144000, verseTotal:144000, reduction:0 },
];

export const STATS_VERSEMENTS = [
  { classe:'6ème',  attendu:128000, percu:89600  },
  { classe:'5ème',  attendu:128000, percu:102400 },
  { classe:'4ème',  attendu:128000, percu:76800  },
  { classe:'3ème',  attendu:128000, percu:115200 },
  { classe:'2nde',  attendu:144000, percu:86400  },
  { classe:'1ère',  attendu:144000, percu:108000 },
  { classe:'Tle',   attendu:176000, percu:158400 },
];

export const EXAMENS_PROCHAINS = [
  { exam:'BECP Blanc N°2', date:'18/11/2025', niveau:'3ème',  salle:'Salle A' },
  { exam:'BAC Blanc N°1',  date:'25/11/2025', niveau:'Tle A', salle:'Salle B' },
  { exam:'BAC Blanc N°1',  date:'25/11/2025', niveau:'Tle D', salle:'Salle C' },
];

export const FRAIS_SCOLAIRES = [
  { niveau:'6ème',  v1:51000, v2:38500, v3:38500, total:128000 },
  { niveau:'5ème',  v1:51000, v2:38500, v3:38500, total:128000 },
  { niveau:'4ème',  v1:51000, v2:38500, v3:38500, total:128000 },
  { niveau:'3ème',  v1:77000, v2:26000, v3:25000, total:128000 },
  { niveau:'2nde A',v1:86000, v2:29000, v3:29000, total:144000 },
  { niveau:'1ère A',v1:86000, v2:29000, v3:29000, total:144000 },
  { niveau:'Tle A', v1:105000,v2:36000, v3:35000, total:176000 },
  { niveau:'Tle D', v1:105000,v2:36000, v3:35000, total:176000 },
];
