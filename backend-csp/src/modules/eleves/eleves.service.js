import prisma from '../../config/database.js';
import { randomBytes } from 'crypto';
import { createNotification } from '../notifications/notifications.service.js';

const generateMatricule = () =>
  `CSP${randomBytes(4).toString('hex').toUpperCase()}`;

/* ─────────────────────────────────────────────
   GET ALL ÉLÈVES
───────────────────────────────────────────── */
export const getAllEleves = async (
  schoolId,
  page = 1,
  limit = 20,
  search = '',
  classeId = null,
  anneeScolaire = '2025-2026'
) => {

  const where = {
    schoolId,
    isActive: true,
  };

  // Recherche
  if (search) {
    where.OR = [
      {
        nom: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        prenom: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        matricule: {
          contains: search,
        },
      },
    ];
  }

  const [eleves, total] = await Promise.all([

    prisma.eleve.findMany({
      where,

      include: {
        inscriptions: {
          where: {
            anneeScolaire,
          },

          include: {
            classe: true,
          },

          orderBy: {
            dateInscription: 'desc',
          },

          take: 1,
        },
      },

      skip: (page - 1) * limit,
      take: limit,

      orderBy: {
        nom: 'asc',
      },
    }),

    prisma.eleve.count({
      where,
    }),
  ]);

  // Filtre classe
  let filteredEleves = eleves;

  if (classeId && classeId !== 'Toutes') {
    filteredEleves = eleves.filter(
      e => e.inscriptions?.[0]?.classeId === classeId
    );
  }

  // Ajouter classe directement
  const elevesWithClasse = filteredEleves.map(e => ({
    ...e,
    classe: e.inscriptions?.[0]?.classe || null,
  }));

  return {
    eleves: elevesWithClasse,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/* ─────────────────────────────────────────────
   GET ONE ÉLÈVE
───────────────────────────────────────────── */
export const getEleveById = async (
  id,
  schoolId,
  anneeScolaire = '2025-2026'
) => {

  const eleve = await prisma.eleve.findFirst({

    where: {
      id,
      schoolId,
      isActive: true,
    },

    include: {

      inscriptions: {
        where: {
          anneeScolaire,
        },

        include: {
          classe: true,
        },

        orderBy: {
          dateInscription: 'desc',
        },
      },

      notes: true,
      versements: true,
    },
  });

  if (eleve) {
    eleve.classe = eleve.inscriptions?.[0]?.classe || null;
  }

  return eleve;
};

/* ─────────────────────────────────────────────
   CREATE ÉLÈVE
───────────────────────────────────────────── */
export const createEleve = async (schoolId, data) => {

  const matricule = generateMatricule();

  const {
    classeId,
    ...cleanData
  } = data;

  // Créer élève
  const eleve = await prisma.eleve.create({

    data: {
      ...cleanData,
      schoolId,
      matricule,
    },
  });

  // Créer inscription
  if (classeId) {

    await prisma.inscription.create({

      data: {
        schoolId,
        eleveId: eleve.id,
        classeId,

        anneeScolaire: '2025-2026',

        type: 'Ordinaire',

        reduction: 0,

        dateInscription: new Date(),
      },
    });
  }

  createNotification(schoolId, {
    type: 'eleve',
    title: 'Nouvel élève inscrit',
    message: `${data.nom} ${data.prenom} — Matricule: ${matricule}`,
    link: '/eleves',
  }).catch(() => {});

  return eleve;
};

/* ─────────────────────────────────────────────
   UPDATE ÉLÈVE
───────────────────────────────────────────── */
export const updateEleve = async (
  id,
  schoolId,
  data
) => {

  const {
    classeId,
    ...cleanData
  } = data;

  // Mettre à jour élève
  await prisma.eleve.updateMany({

    where: {
      id,
      schoolId,
    },

    data: cleanData,
  });

  // Gérer inscription/classe
  if (classeId) {

    const existingInscription =
      await prisma.inscription.findFirst({

        where: {
          eleveId: id,
          anneeScolaire: '2025-2026',
        },
      });

    // Modifier inscription existante
    if (existingInscription) {

      await prisma.inscription.update({

        where: {
          id: existingInscription.id,
        },

        data: {
          classeId,
        },
      });

    } else {

      // Sinon créer inscription
      await prisma.inscription.create({

        data: {
          schoolId,
          eleveId: id,
          classeId,

          anneeScolaire: '2025-2026',

          type: 'Ordinaire',

          reduction: 0,

          dateInscription: new Date(),
        },
      });
    }
  }

  return {
    message: 'Élève mis à jour avec succès',
  };
};

/* ─────────────────────────────────────────────
   DELETE ÉLÈVE
───────────────────────────────────────────── */
export const deleteEleve = async (
  id,
  schoolId
) => {

  return await prisma.eleve.updateMany({

    where: {
      id,
      schoolId,
    },

    data: {
      isActive: false,
    },
  });
};

export const exportEleves = async (schoolId, anneeScolaire = '2025-2026') => {
  const eleves = await prisma.eleve.findMany({
    where: { schoolId, isActive: true },
    include: {
      inscriptions: {
        where: { anneeScolaire },
        include: { classe: true },
        take: 1,
      },
    },
    orderBy: { nom: 'asc' },
  });
  return eleves.map(e => ({
    Matricule: e.matricule,
    Nom: e.nom,
    Prénom: e.prenom,
    Sexe: e.sexe === 'M' ? 'Masculin' : 'Féminin',
    'Date naissance': new Date(e.dateNaissance).toLocaleDateString('fr-FR'),
    'Lieu naissance': e.lieuNaissance,
    Nationalité: e.nationalite,
    Téléphone: e.telephone || '',
    Classe: e.inscriptions?.[0]?.classe?.nom || '',
    'Nom parent': e.nomParent,
    'Tél. parent': e.telParent,
  }));
};