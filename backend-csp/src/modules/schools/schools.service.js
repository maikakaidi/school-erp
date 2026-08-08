import prisma from '../../config/database.js';

export const getSchoolProfile = async (schoolId) => {
  return await prisma.school.findUnique({
    where: { id: schoolId },
    include: { settings: true }
  });
};

export const updateSchoolProfile = async (schoolId, data) => {
  return await prisma.school.update({
    where: { id: schoolId },
    data,
  });
};

export const updateSchoolSettings = async (schoolId, data) => {
  return await prisma.schoolSetting.upsert({
    where: { schoolId },
    update: data,
    create: { schoolId, ...data },
  });
};