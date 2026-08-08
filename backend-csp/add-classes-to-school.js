import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const phone = '690000000'; // l'école que vous utilisez
const anneeScolaire = '2025-2026';

async function main() {
  const school = await prisma.school.findUnique({ where: { phone } });
  if (!school) {
    console.error('École non trouvée');
    return;
  }
  const classes = [
    '6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B',
    '3ème A', '3ème B', '2nde A', '2nde C', '1ère A', '1ère D',
    'Terminale A', 'Terminale D','Terminale C'
  ];
  for (const nom of classes) {
    await prisma.classe.upsert({
      where: { id: `${school.id}_${nom}` },
      update: {},
      create: {
        schoolId: school.id,
        nom,
        niveau: nom.split(' ')[0],
        anneeScolaire,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${classes.length} classes ajoutées pour l'école ${school.name}`);
}

main().finally(() => prisma.$disconnect());