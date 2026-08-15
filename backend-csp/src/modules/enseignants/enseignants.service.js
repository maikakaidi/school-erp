import prisma from '../../config/database.js';
import bcrypt from 'bcrypt';

export const getAllEnseignants = async (schoolId, page = 1, limit = 20, search = '') => {
  const where = { schoolId, isActive: true };
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search } },
    ];
  }
  const [enseignants, total] = await Promise.all([
    prisma.enseignant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nom: 'asc' },
    }),
    prisma.enseignant.count({ where }),
  ]);
  return { enseignants, total, page, totalPages: Math.ceil(total / limit) };
};

export const getEnseignantById = async (id, schoolId) => {
  return await prisma.enseignant.findFirst({ where: { id, schoolId } });
};

export const createEnseignant = async (schoolId, data) => {
  const { dateEmbauche, estVacataire, tauxHoraire, salaireFixe, anciennete, ...rest } = data;
  const enseignantData = {
    ...rest,
    schoolId,
    estVacataire: estVacataire === true,
    tauxHoraire: estVacataire ? (tauxHoraire !== undefined && tauxHoraire !== null ? parseFloat(tauxHoraire) : null) : null,
    salaireFixe: !estVacataire ? (salaireFixe !== undefined && salaireFixe !== null ? parseFloat(salaireFixe) : null) : null,
    anciennete: anciennete !== undefined && anciennete !== null ? parseInt(anciennete) : null,
    dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null,
  };

  if (data.password) {
    enseignantData.password = await bcrypt.hash(data.password, 10);
  }
  
  return await prisma.enseignant.create({ data: enseignantData });
};

export const updateEnseignant = async (id, schoolId, data) => {
  // On ne garde que les champs qui sont réellement présents dans data
  const updateData = {};
  
  if (data.nom !== undefined) updateData.nom = data.nom;
  if (data.prenom !== undefined) updateData.prenom = data.prenom;
  if (data.telephone !== undefined) updateData.telephone = data.telephone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.specialite !== undefined) updateData.specialite = data.specialite;
  if (data.estVacataire !== undefined) updateData.estVacataire = data.estVacataire === true;
  if (data.anciennete !== undefined) updateData.anciennete = data.anciennete !== null ? parseInt(data.anciennete) : null;
  if (data.dateEmbauche !== undefined) updateData.dateEmbauche = data.dateEmbauche ? new Date(data.dateEmbauche) : null;
  
  // Gérer les champs de salaire selon le type
  if (data.estVacataire === true) {
    // Vacataire : on met à jour le taux horaire, et on efface le salaire fixe
    if (data.tauxHoraire !== undefined) {
      updateData.tauxHoraire = data.tauxHoraire !== null ? parseFloat(data.tauxHoraire) : null;
    }
    updateData.salaireFixe = null;
  } else if (data.estVacataire === false) {
    // Permanent : on met à jour le salaire fixe, et on efface le taux horaire
    if (data.salaireFixe !== undefined) {
      updateData.salaireFixe = data.salaireFixe !== null ? parseFloat(data.salaireFixe) : null;
    }
    updateData.tauxHoraire = null;
  } else {
    // Si estVacataire n'est pas fourni, on ne touche pas aux salaires (sauf si explicitement donnés)
    if (data.tauxHoraire !== undefined) {
      updateData.tauxHoraire = data.tauxHoraire !== null ? parseFloat(data.tauxHoraire) : null;
    }
    if (data.salaireFixe !== undefined) {
      updateData.salaireFixe = data.salaireFixe !== null ? parseFloat(data.salaireFixe) : null;
    }
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }
  
  return await prisma.enseignant.updateMany({
    where: { id, schoolId },
    data: updateData,
  });
};

export const deleteEnseignant = async (id, schoolId) => {
  return await prisma.enseignant.updateMany({
    where: { id, schoolId },
    data: { isActive: false },
  });
};

export const exportEnseignants = async (schoolId) => {
  const enseignants = await prisma.enseignant.findMany({
    where: { schoolId, isActive: true },
    orderBy: { nom: 'asc' },
  });
  return enseignants.map(e => ({
    Nom: e.nom,
    Prénom: e.prenom,
    Téléphone: e.telephone,
    Email: e.email || '',
    Spécialité: e.specialite || '',
    Type: e.estVacataire ? 'Vacataire' : 'Permanent',
    'Taux horaire': e.tauxHoraire || '',
    'Salaire fixe': e.salaireFixe || '',
    Ancienneté: e.anciennete || '',
    'Date embauche': e.dateEmbauche ? new Date(e.dateEmbauche).toLocaleDateString('fr-FR') : '',
  }));
};