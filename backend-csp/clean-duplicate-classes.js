import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const phone = '690000000';
const anneeScolaire = '2025-2026';

async function main() {
  const school = await prisma.school.findUnique({ where: { phone } });
  if (!school) {
    console.error('École non trouvée');
    return;
  }
  // Récupérer toutes les classes de cette école
  const allClasses = await prisma.classe.findMany({
    where: { schoolId: school.id },
    orderBy: { nom: 'asc' }
  });
  const seen = new Set();
  const toDelete = [];
  for (const c of allClasses) {
    if (seen.has(c.nom)) {
      toDelete.push(c.id);
    } else {
      seen.add(c.nom);
    }
  }
  if (toDelete.length) {
    await prisma.classe.deleteMany({ where: { id: { in: toDelete } } });
    console.log(`🗑️ Supprimé ${toDelete.length} classes en double`);
  } else {
    console.log('Aucun doublon trouvé');
  }
  // Afficher les classes restantes
  const remaining = await prisma.classe.findMany({ where: { schoolId: school.id } });
  console.log(`📚 Classes restantes (${remaining.length}) :`, remaining.map(c => c.nom));
}

main().finally(() => prisma.$disconnect());