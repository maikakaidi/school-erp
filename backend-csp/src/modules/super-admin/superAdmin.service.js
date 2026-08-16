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

export const anonymizeSchoolData = async (schoolId) => {
  const crypto = await import('crypto');
  const hash = (val) => `ANON_${crypto.createHash('sha256').update(val + schoolId).digest('hex').slice(0, 8)}`;

  await prisma.$transaction(async (tx) => {
    const eleves = await tx.eleve.findMany({ where: { schoolId }, select: { id: true, nom: true, prenom: true } });
    for (const e of eleves) {
      const anonNom = hash(e.nom);
      const anonPrenom = hash(e.prenom);
      await tx.eleve.update({
        where: { id: e.id },
        data: { nom: anonNom, prenom: anonPrenom, adresse: null, telephone: null, email: null },
      });
    }
    const parents = await tx.parent.findMany({ where: { schoolId }, select: { id: true, nom: true, prenom: true } });
    for (const p of parents) {
      await tx.parent.update({
        where: { id: p.id },
        data: { nom: hash(p.nom), prenom: hash(p.prenom), telephone: null, email: null },
      });
    }
    const users = await tx.schoolUser.findMany({ where: { schoolId }, select: { id: true, name: true } });
    for (const u of users) {
      await tx.schoolUser.update({
        where: { id: u.id },
        data: { name: hash(u.name), email: null },
      });
    }
    await tx.notification.deleteMany({ where: { schoolId } });
    await tx.auditLog.deleteMany({ where: { schoolId } });
  });

  return { anonymized: true };
};

export const getStorageStats = async () => {
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      isActive: true,
      _count: {
        select: {
          eleves: true,
          notes: true,
          versements: true,
          absences: true,
          messages: true,
          parents: true,
          enseignants: true,
          annonces: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
  return schools.map((s) => ({
    schoolId: s.id,
    name: s.name,
    phone: s.phone,
    isActive: s.isActive,
    eleves: s._count.eleves,
    notes: s._count.notes,
    versements: s._count.versements,
    absences: s._count.absences,
    messages: s._count.messages,
    parents: s._count.parents,
    enseignants: s._count.enseignants,
    annonces: s._count.annonces,
    totalRows: Object.values(s._count).reduce((a, b) => a + b, 0),
  }));
};