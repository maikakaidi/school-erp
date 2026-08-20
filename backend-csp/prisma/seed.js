import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { initializeDefaults } from '../src/modules/defaults/defaults.service.js';
const prisma = new PrismaClient();

const DEFAULT_SUPER_PASSWORD = 'SuperAdmin123!';
const DEFAULT_SCHOOL_PASSWORD = 'Ecole123!';
const LEGACY_SUPER_PASSWORD = 'SuperAdmin123';
const LEGACY_SCHOOL_PASSWORD = 'ecole123';

async function main() {
  // Super Admin
  const superAdminPhone = '691234567';
  const hashedSuper = await bcrypt.hash(DEFAULT_SUPER_PASSWORD, 10);
  const existingSuper = await prisma.superAdmin.findUnique({ where: { phone: superAdminPhone } });
  if (existingSuper) {
    // Durcissement : si l'ancien mot de passe par défaut est encore en place, on le remplace
    const legacy = await bcrypt.compare(LEGACY_SUPER_PASSWORD, existingSuper.password);
    await prisma.superAdmin.update({
      where: { id: existingSuper.id },
      data: legacy
        ? { password: hashedSuper, mustChangePassword: true }
        : { mustChangePassword: existingSuper.mustChangePassword },
    });
  } else {
    await prisma.superAdmin.create({
      data: { phone: superAdminPhone, password: hashedSuper, mustChangePassword: true },
    });
  }
  console.log('Super Admin OK (mot de passe par défaut durci)');

  // Ecole test
  const schoolPhone = '690000000';
  const hashedSchool = await bcrypt.hash(DEFAULT_SCHOOL_PASSWORD, 10);
  let school;
  const existing = await prisma.school.findUnique({ where: { phone: schoolPhone } });
  if (existing) {
    const legacy = await bcrypt.compare(LEGACY_SCHOOL_PASSWORD, existing.password);
    school = await prisma.school.update({
      where: { id: existing.id },
      data: legacy ? { password: hashedSchool, mustChangePassword: true } : {},
    });
  } else {
    school = await prisma.school.create({
      data: {
        name: 'Ecole Test',
        phone: schoolPhone,
        password: hashedSchool,
        subscriptionStatus: 'active',
        trialDays: 15,
        isActive: true,
        mustChangePassword: true,
      },
    });
  }
  console.log('Ecole test OK (mot de passe par défaut durci)');

  // Classes
  const classNames = [
    '6eme A', '6eme B', '5eme A', '5eme B', '4eme A', '4eme B',
    '3eme A', '3eme B', '2nde A', '2nde C', '1ere A', '1ere D',
    'Terminale A', 'Terminale D'
  ];
  const existingClasses = await prisma.classe.findMany({ where: { schoolId: school.id } });
  const existingNames = new Set(existingClasses.map(c => c.nom));
  const newClasses = classNames
    .filter(n => !existingNames.has(n))
    .map(nom => ({
      schoolId: school.id,
      nom,
      niveau: nom.split(' ')[0],
      anneeScolaire: '2025-2026',
      isActive: true,
    }));
  if (newClasses.length > 0) {
    await prisma.classe.createMany({ data: newClasses });
  }
  console.log(`${newClasses.length} classes creees`);

  // Admin user for the school
  const existingUser = await prisma.schoolUser.findUnique({
    where: { schoolId_login: { schoolId: school.id, login: 'admin' } }
  });
  if (!existingUser) {
    await prisma.schoolUser.create({
      data: {
        schoolId: school.id,
        login: 'admin',
        password: hashedSchool,
        role: 'Administrateur',
      },
    });
  }
  console.log('Admin ecole OK');

  // Initialiser les matières et coefficients par défaut
  try {
    const yearName = '2025-2026';
    const result = await initializeDefaults(school.id, yearName);
    console.log(`Defaults: ${result.created} coefficients créés pour ${result.classesCount} classes`);
  } catch (e) {
    console.log('Defaults initialization skipped:', e.message);
  }
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
