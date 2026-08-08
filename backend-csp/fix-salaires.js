import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findUnique({ where: { phone: '690000000' } });
  if (!school) {
    console.log('École non trouvée');
    return;
  }

  // Exemple : mettez à jour vos enseignants
  await prisma.enseignant.updateMany({
    where: { schoolId: school.id, nom: 'halidou', prenom: 'barmou' },
    data: { estVacataire: true, tauxHoraire: 2000 },
  });
  await prisma.enseignant.updateMany({
    where: { schoolId: school.id, nom: 'malam', prenom: 'tata' },
    data: { estVacataire: false, salaireFixe: 150000 },
  });
  await prisma.enseignant.updateMany({
    where: { schoolId: school.id, nom: 'moussa', prenom: 'yaro' },
    data: { estVacataire: true, tauxHoraire: 2500 },
  });

  console.log('Mise à jour terminée');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());