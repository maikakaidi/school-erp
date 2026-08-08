import prisma from '../../config/database.js';

export const getSettings = async (schoolId) => {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { settings: true },
  });
  if (!school) return {};
  return {
    schoolName: school.name,
    phone: school.phone,
    address: school.address,
    email: school.email,
    ...school.settings,
  };
};

export const updateSettings = async (schoolId, data) => {
  const { schoolName, phone, address, email, ...settingData } = data;
  
  // Récupérer l'école actuelle pour comparer
  const currentSchool = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!currentSchool) throw new Error('École non trouvée');

  // Préparer les champs à mettre à jour (uniquement ceux qui sont différents)
  const schoolUpdateData = {};
  if (schoolName !== undefined && schoolName !== currentSchool.name) schoolUpdateData.name = schoolName;
  if (phone !== undefined && phone !== null && phone !== '' && phone !== currentSchool.phone) {
    // Vérifier que le nouveau phone n'est pas utilisé par une autre école
    const existingSchool = await prisma.school.findFirst({
      where: { phone, id: { not: schoolId } },
    });
    if (existingSchool) throw new Error('Ce numéro de téléphone est déjà utilisé par un autre établissement');
    schoolUpdateData.phone = phone;
  }
  if (address !== undefined && address !== currentSchool.address) schoolUpdateData.address = address;
  if (email !== undefined && email !== currentSchool.email) schoolUpdateData.email = email;

  // Mettre à jour School si nécessaire
  if (Object.keys(schoolUpdateData).length > 0) {
    await prisma.school.update({
      where: { id: schoolId },
      data: schoolUpdateData,
    });
  }
  
  // Mettre à jour SchoolSetting (toujours, car on peut avoir des champs vides)
  if (Object.keys(settingData).length > 0) {
    return await prisma.schoolSetting.upsert({
      where: { schoolId },
      update: settingData,
      create: { schoolId, ...settingData },
    });
  }
  
  return await prisma.schoolSetting.findUnique({ where: { schoolId } });
};