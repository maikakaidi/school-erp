import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  // Super Admin
  const superAdminPhone = '691234567';
  const hashedSuper = await bcrypt.hash('SuperAdmin123', 10);
  await prisma.superAdmin.upsert({
    where: { phone: superAdminPhone },
    update: {},
    create: { phone: superAdminPhone, password: hashedSuper },
  });
  console.log('Super Admin OK');

  // Ecole test
  const schoolPhone = '690000000';
  const hashedSchool = await bcrypt.hash('ecole123', 10);
  let school;
  const existing = await prisma.school.findUnique({ where: { phone: schoolPhone } });
  if (existing) {
    school = existing;
  } else {
    school = await prisma.school.create({
      data: {
        name: 'Ecole Test',
        phone: schoolPhone,
        password: hashedSchool,
        subscriptionStatus: 'active',
        trialDays: 15,
        isActive: true,
      },
    });
  }
  console.log('Ecole test OK');

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
}

main()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
