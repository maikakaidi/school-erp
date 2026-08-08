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