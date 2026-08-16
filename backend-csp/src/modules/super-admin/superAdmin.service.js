import prisma from '../../config/database.js';
import bcrypt from 'bcrypt';

export const getAllSchools = async () => {
  return await prisma.school.findMany({ orderBy: { createdAt: 'desc' } });
};

export const getDashboardStats = async () => {
  const totalSchools = await prisma.school.count();
  const activeSchools = await prisma.school.count({ where: { isActive: true, subscriptionStatus: 'active' } });
  const expiredSchools = await prisma.school.count({ where: { subscriptionStatus: 'expired' } });
  const trialSchools = await prisma.school.count({ where: { subscriptionStatus: 'trial' } });
  return { totalSchools, activeSchools, expiredSchools, trialSchools };
};

export const activateSchool = async (schoolId) => {
  return await prisma.school.update({
    where: { id: schoolId },
    data: { isActive: true, subscriptionStatus: 'active', subscriptionStart: new Date(), subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
  });
};

export const deactivateSchool = async (schoolId) => {
  return await prisma.school.update({ where: { id: schoolId }, data: { isActive: false, subscriptionStatus: 'suspended' } });
};

export const renewSchool = async (schoolId, days = 365) => {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const newEnd = school.subscriptionEnd ? new Date(school.subscriptionEnd) : new Date();
  newEnd.setDate(newEnd.getDate() + days);
  return await prisma.school.update({
    where: { id: schoolId },
    data: { subscriptionStatus: 'active', isActive: true, subscriptionEnd: newEnd }
  });
};

export const addDays = async (schoolId, days) => {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const newEnd = school.subscriptionEnd ? new Date(school.subscriptionEnd) : new Date();
  newEnd.setDate(newEnd.getDate() + days);
  return await prisma.school.update({ where: { id: schoolId }, data: { subscriptionEnd: newEnd } });
};

export const resetSchoolPassword = async (schoolId, newPassword) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  return await prisma.school.update({
    where: { id: schoolId },
    data: { password: hashed, mustChangePassword: true },
  });
};

export const deleteSchool = async (schoolId) => {
  return await prisma.school.delete({ where: { id: schoolId } });
};