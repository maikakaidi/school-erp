import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';

export const registerSchool = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const school = await prisma.school.create({
    data: {
      name: data.name,
      phone: data.phone,
      password: hashedPassword,
      subscriptionStatus: 'trial',
      trialDays: 15,
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });
  // Créer settings par défaut
  await prisma.schoolSetting.create({
    data: { schoolId: school.id }
  });
  const accessToken = jwt.sign({ schoolId: school.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ schoolId: school.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken, school: { id: school.id, name: school.name, subscriptionStatus: school.subscriptionStatus } };
};

export const loginSchool = async (phone, password) => {
  const school = await prisma.school.findUnique({ where: { phone } });
  if (!school) throw new Error('Identifiants invalides');
  const valid = await bcrypt.compare(password, school.password);
  if (!valid) throw new Error('Identifiants invalides');
  if (!school.isActive) throw new Error('Compte désactivé');
  const accessToken = jwt.sign({ schoolId: school.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ schoolId: school.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken, school };
};

export const loginSuperAdmin = async (phone, password) => {
  const admin = await prisma.superAdmin.findUnique({ where: { phone } });
  if (!admin) throw new Error('Identifiants invalides');
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw new Error('Identifiants invalides');
  const accessToken = jwt.sign({ superAdminId: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  const refreshToken = jwt.sign({ superAdminId: admin.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const loginParent = async (schoolPhone, phone, password) => {
  const school = await prisma.school.findUnique({ where: { phone: schoolPhone } });
  if (!school) throw new Error('Établissement introuvable');
  if (!school.isActive) throw new Error('Établissement désactivé');

  const parent = await prisma.parent.findFirst({
    where: { schoolId: school.id, telephone: phone },
  });
  if (!parent) throw new Error('Identifiants invalides');
  if (!parent.isActive) throw new Error('Compte parent désactivé');
  const valid = await bcrypt.compare(password, parent.password);
  if (!valid) throw new Error('Identifiants invalides');

  const accessToken = jwt.sign(
    { schoolId: school.id, actorType: 'parent', actorId: parent.id, role: 'parent' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  const refreshToken = jwt.sign(
    { schoolId: school.id, actorType: 'parent', actorId: parent.id, role: 'parent' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return {
    accessToken,
    refreshToken,
    parent: {
      id: parent.id,
      nom: parent.nom,
      telephone: parent.telephone,
      email: parent.email,
      adresse: parent.adresse,
    },
    school: { id: school.id, name: school.name },
  };
};

export const loginEnseignant = async (schoolPhone, phone, password) => {
  const school = await prisma.school.findUnique({ where: { phone: schoolPhone } });
  if (!school) throw new Error('Établissement introuvable');
  if (!school.isActive) throw new Error('Établissement désactivé');

  const enseignant = await prisma.enseignant.findFirst({
    where: { schoolId: school.id, telephone: phone },
  });
  if (!enseignant) throw new Error('Identifiants invalides');
  if (!enseignant.password) throw new Error('Compte enseignant sans mot de passe');
  if (!enseignant.isActive) throw new Error('Compte enseignant désactivé');
  const valid = await bcrypt.compare(password, enseignant.password);
  if (!valid) throw new Error('Identifiants invalides');

  const accessToken = jwt.sign(
    { schoolId: school.id, actorType: 'enseignant', actorId: enseignant.id, role: 'enseignant' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  const refreshToken = jwt.sign(
    { schoolId: school.id, actorType: 'enseignant', actorId: enseignant.id, role: 'enseignant' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return {
    accessToken,
    refreshToken,
    enseignant: {
      id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      telephone: enseignant.telephone,
      email: enseignant.email,
      specialite: enseignant.specialite,
    },
    school: { id: school.id, name: school.name },
  };
};

export const loginEleve = async (schoolPhone, matricule, password) => {
  const school = await prisma.school.findUnique({ where: { phone: schoolPhone } });
  if (!school) throw new Error('Établissement introuvable');
  if (!school.isActive) throw new Error('Établissement désactivé');

  const eleve = await prisma.eleve.findFirst({
    where: { schoolId: school.id, matricule },
  });
  if (!eleve) throw new Error('Identifiants invalides');
  if (!eleve.password) throw new Error('Compte élève sans mot de passe');
  if (!eleve.isActive) throw new Error('Compte élève désactivé');
  const valid = await bcrypt.compare(password, eleve.password);
  if (!valid) throw new Error('Identifiants invalides');

  const accessToken = jwt.sign(
    { schoolId: school.id, actorType: 'eleve', actorId: eleve.id, role: 'eleve' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  const refreshToken = jwt.sign(
    { schoolId: school.id, actorType: 'eleve', actorId: eleve.id, role: 'eleve' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return {
    accessToken,
    refreshToken,
    eleve: {
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      sexe: eleve.sexe,
    },
    school: { id: school.id, name: school.name },
  };
};