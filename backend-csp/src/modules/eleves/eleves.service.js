import prisma from '../../config/database.js';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { createNotification } from '../notifications/notifications.service.js';
import { resolveAcademicYear, isYearArchived } from '../academic-years/academicYears.service.js';

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
  anneeScolaire = null
) => {
  anneeScolaire = await resolveAcademicYear(schoolId, anneeScolaire);

  const where = {
    schoolId,
    isActive: true,
    inscriptions: {
      some: {
        anneeScolaire,
      },
    },
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
  anneeScolaire = null
) => {
  anneeScolaire = await resolveAcademicYear(schoolId, anneeScolaire);

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
    password,
    langueChoisie,
    anneeScolaire: anneeInput,
    ...cleanData
  } = data;

  const anneeScolaire = await resolveAcademicYear(schoolId, anneeInput);

  // Bloquer inscription dans une année archivée
  if (classeId && await isYearArchived(schoolId, anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — inscription impossible'), { status: 403 });
  }

  // Créer élève
  const eleve = await prisma.eleve.create({

    data: {
      ...cleanData,
      schoolId,
      matricule,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });

  // Créer inscription
  if (classeId) {

    await prisma.inscription.create({

      data: {
        schoolId,
        eleveId: eleve.id,
        classeId,

        anneeScolaire,

        type: 'Ordinaire',

        reduction: 0,
        langueChoisie: langueChoisie || null,

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
    password,
    langueChoisie,
    anneeScolaire: anneeInput,
    ...cleanData
  } = data;

  const anneeScolaire = await resolveAcademicYear(schoolId, anneeInput);

  // Bloquer modification d'inscription dans une année archivée
  if (classeId && await isYearArchived(schoolId, anneeScolaire)) {
    throw Object.assign(new Error('Cette année scolaire est archivée — modification impossible'), { status: 403 });
  }

  // Mettre à jour élève (scopé par école)
  const updated = await prisma.eleve.updateMany({
    where: {
      id,
      schoolId,
    },
    data: {
      ...cleanData,
      ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
    },
  });
  if (updated.count === 0) throw new Error('Élève non trouvé');

  // Gérer inscription/classe
  if (classeId) {

    const existingInscription =
      await prisma.inscription.findFirst({

        where: {
          schoolId,
          eleveId: id,
          anneeScolaire,
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
          ...(langueChoisie !== undefined ? { langueChoisie: langueChoisie || null } : {}),
        },
      });

    } else {

      // Sinon créer inscription
      await prisma.inscription.create({

        data: {
          schoolId,
          eleveId: id,
          classeId,

          anneeScolaire,

          type: 'Ordinaire',

          reduction: 0,
          langueChoisie: langueChoisie || null,

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

export const exportEleves = async (schoolId, anneeScolaire = null) => {
  anneeScolaire = await resolveAcademicYear(schoolId, anneeScolaire);
  const eleves = await prisma.eleve.findMany({
    where: {
      schoolId,
      isActive: true,
      inscriptions: {
        some: { anneeScolaire },
      },
    },
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