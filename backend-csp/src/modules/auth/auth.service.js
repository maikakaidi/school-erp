import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import { initializeDefaults } from '../defaults/defaults.service.js';

const ACCESS_TTL = '8h';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 jours

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });

const createSession = async (actorType, actorId, schoolId) => {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  await prisma.session.create({
    data: { tokenId, actorType, actorId, schoolId: schoolId || null, expiresAt },
  });
  return { tokenId, expiresAt };
};

const signRefreshToken = (payload, tokenId) =>
  jwt.sign({ ...payload, jti: tokenId }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_SECONDS}s` });

const issueTokens = async (payload, actorType, actorId, schoolId) => {
  const accessToken = signAccessToken(payload);
  const { tokenId } = await createSession(actorType, actorId, schoolId);
  const refreshToken = signRefreshToken(payload, tokenId);
  return { accessToken, refreshToken };
};

const revokeSessionsForActor = async (actorType, actorId) => {
  await prisma.session.updateMany({
    where: { actorType, actorId, revoked: false },
    data: { revoked: true },
  });
};

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
  // Initialiser les matières et coefficients par défaut
  try {
    const yearName = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    await initializeDefaults(school.id, yearName);
  } catch (_) { /* pas bloquant si échec */ }
  const { accessToken, refreshToken } = await issueTokens(
    { schoolId: school.id },
    'school',
    school.id,
    school.id
  );
  return { accessToken, refreshToken, school: { id: school.id, name: school.name, subscriptionStatus: school.subscriptionStatus } };
};

export const loginSchool = async (phone, password) => {
  const school = await prisma.school.findUnique({ where: { phone } });
  if (!school) throw new Error('Identifiants invalides');
  const valid = await bcrypt.compare(password, school.password);
  if (!valid) throw new Error('Identifiants invalides');
  if (!school.isActive) throw new Error('Compte désactivé');
  const { accessToken, refreshToken } = await issueTokens(
    { schoolId: school.id },
    'school',
    school.id,
    school.id
  );
  return { accessToken, refreshToken, school, mustChangePassword: school.mustChangePassword };
};

export const loginSuperAdmin = async (phone, password) => {
  const admin = await prisma.superAdmin.findUnique({ where: { phone } });
  if (!admin) throw new Error('Identifiants invalides');
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw new Error('Identifiants invalides');
  const { accessToken, refreshToken } = await issueTokens(
    { superAdminId: admin.id },
    'super_admin',
    admin.id,
    null
  );
  return { accessToken, refreshToken, mustChangePassword: admin.mustChangePassword };
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

  const payload = { schoolId: school.id, actorType: 'parent', actorId: parent.id, role: 'parent' };
  const { accessToken, refreshToken } = await issueTokens(payload, 'parent', parent.id, school.id);
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

  const payload = { schoolId: school.id, actorType: 'enseignant', actorId: enseignant.id, role: 'enseignant' };
  const { accessToken, refreshToken } = await issueTokens(payload, 'enseignant', enseignant.id, school.id);
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

  const payload = { schoolId: school.id, actorType: 'eleve', actorId: eleve.id, role: 'eleve' };
  const { accessToken, refreshToken } = await issueTokens(payload, 'eleve', eleve.id, school.id);
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

const verifyRefreshAndGetSession = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  if (!decoded.jti) throw new Error('Refresh token invalide');
  const session = await prisma.session.findUnique({ where: { tokenId: decoded.jti } });
  if (!session || session.revoked) throw new Error('Refresh token révoqué');
  if (new Date(session.expiresAt).getTime() < Date.now()) throw new Error('Refresh token expiré');
  return { decoded, session };
};

export const refreshTokens = async (refreshToken) => {
  const { decoded, session } = await verifyRefreshAndGetSession(refreshToken);

  let payload;
  if (decoded.actorType && decoded.schoolId) {
    payload = { schoolId: decoded.schoolId, actorType: decoded.actorType, actorId: decoded.actorId, role: decoded.role };
  } else if (decoded.schoolId) {
    payload = { schoolId: decoded.schoolId };
  } else if (decoded.superAdminId) {
    payload = { superAdminId: decoded.superAdminId };
  } else throw new Error('Invalid refresh');

  // Rotation : révoque l'ancien refresh token, en émet un nouveau
  await prisma.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });
  const accessToken = signAccessToken(payload);
  const { tokenId } = await createSession(session.actorType, session.actorId, session.schoolId);
  const newRefreshToken = signRefreshToken(payload, tokenId);

  return { accessToken, refreshToken: newRefreshToken };
};

export const logoutSession = async (refreshToken) => {
  const { session } = await verifyRefreshAndGetSession(refreshToken);
  await prisma.session.update({
    where: { id: session.id },
    data: { revoked: true },
  });
  return true;
};

const ACTOR_MODEL_MAP = {
  school: { find: (id, schoolId) => prisma.school.findUnique({ where: { id } }), actorType: 'school', accountKey: 'id' },
  super_admin: { find: (id) => prisma.superAdmin.findUnique({ where: { id } }), actorType: 'super_admin', accountKey: 'id' },
  parent: { find: (id, schoolId) => prisma.parent.findFirst({ where: { id, schoolId } }), actorType: 'parent', accountKey: 'id' },
  enseignant: { find: (id, schoolId) => prisma.enseignant.findFirst({ where: { id, schoolId } }), actorType: 'enseignant', accountKey: 'id' },
  eleve: { find: (id, schoolId) => prisma.eleve.findFirst({ where: { id, schoolId } }), actorType: 'eleve', accountKey: 'id' },
};

export const changePassword = async (req, currentPassword, newPassword) => {
  const { role, schoolId, actorId, superAdminId } = req.user;
  const config = ACTOR_MODEL_MAP[role];
  if (!config) throw Object.assign(new Error('Type de compte non supporté'), { status: 400 });

  const actorIdResolved = role === 'super_admin' ? superAdminId : actorId || schoolId;
  const account = await config.find(actorIdResolved, schoolId);
  if (!account) throw Object.assign(new Error('Compte introuvable'), { status: 404 });

  const valid = await bcrypt.compare(currentPassword, account.password);
  if (!valid) throw Object.assign(new Error('Mot de passe actuel incorrect'), { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  if (role === 'school') {
    await prisma.school.update({ where: { id: account.id }, data: { password: hashed, mustChangePassword: false } });
  } else if (role === 'super_admin') {
    await prisma.superAdmin.update({ where: { id: account.id }, data: { password: hashed, mustChangePassword: false } });
  } else if (role === 'parent') {
    await prisma.parent.update({ where: { id: account.id }, data: { password: hashed } });
  } else if (role === 'enseignant') {
    await prisma.enseignant.update({ where: { id: account.id }, data: { password: hashed } });
  } else if (role === 'eleve') {
    await prisma.eleve.update({ where: { id: account.id }, data: { password: hashed } });
  }

  // Révoque toutes les sessions : l'utilisateur se reconnecte avec le nouveau mot de passe
  await revokeSessionsForActor(config.actorType, actorIdResolved);
  return true;
};
