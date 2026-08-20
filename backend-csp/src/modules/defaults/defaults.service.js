import prisma from '../../config/database.js';
import {
  MATIERES_CATALOGUE,
  GROUPE_CHOIX,
  COLLEGE_CONFIG,
  LYCEE_CONFIG,
  getConfigKey,
} from './defaults.template.js';

export const initializeDefaults = async (schoolId, anneeScolaire) => {
  const classes = await prisma.classe.findMany({
    where: { schoolId, isActive: true },
  });

  if (classes.length === 0) return { message: 'Aucune classe — rien à initialiser', created: 0 };

  const allMatiereNames = [
    ...new Set([
      ...Object.values(COLLEGE_CONFIG).flat().map(c => c.libelle),
      ...Object.values(LYCEE_CONFIG).flat().map(c => c.libelle),
    ]),
  ];

  const catalogueMap = new Map();
  for (const m of MATIERES_CATALOGUE) {
    const existing = await prisma.matiere.findFirst({ where: { schoolId, libelle: m.libelle } });
    if (existing) {
      catalogueMap.set(m.libelle, existing);
    } else {
      const created = await prisma.matiere.create({ data: { schoolId, ...m } });
      catalogueMap.set(m.libelle, created);
    }
  }

  let groupe = await prisma.matiereGroupe.findFirst({ where: { schoolId, nom: GROUPE_CHOIX.nom } });
  if (!groupe) {
    groupe = await prisma.matiereGroupe.create({ data: { schoolId, nom: GROUPE_CHOIX.nom } });
  }

  for (const optLibelle of GROUPE_CHOIX.options) {
    const optMatiere = catalogueMap.get(optLibelle);
    if (optMatiere && !optMatiere.groupeId) {
      await prisma.matiere.update({ where: { id: optMatiere.id }, data: { groupeId: groupe.id } });
    }
  }

  let created = 0;

  for (const classe of classes) {
    const configKey = getConfigKey(classe);
    if (!configKey) continue;

    const config = configKey.type === 'college' ? COLLEGE_CONFIG[configKey.key] : LYCEE_CONFIG[configKey.key];
    if (!config) continue;

    for (const entry of config) {
      const matiere = catalogueMap.get(entry.libelle);
      if (!matiere) continue;

      const existing = await prisma.coefficient.findFirst({
        where: {
          schoolId,
          classeId: classe.id,
          matiereId: matiere.id,
          anneeScolaire,
        },
      });

      if (!existing) {
        await prisma.coefficient.create({
          data: {
            schoolId,
            classeId: classe.id,
            matiereId: matiere.id,
            anneeScolaire,
            coefficient: entry.coefficient,
          },
        });
        created++;
      }
    }
  }

  return { message: 'Initialisation terminée', created, classesCount: classes.length };
};
