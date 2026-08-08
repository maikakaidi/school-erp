import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Remplacez par l'ID de votre école (récupérable dans la base ou via le token)
const schoolId = 'a5a9be55-299d-4f1d-8b9e-93c9942002e3';

const classes = [
  '6ème A', '6ème B',
  '5ème A', '5ème B',
  '4ème A', '4ème B',
  '3ème A', '3ème B',
  '2nde A', '2nde C',
  '1ère A', '1ère D',
  'Terminale A', 'Terminale D'
];

async function main() {
  for (const nom of classes) {
    await prisma.classe.create({
      data: {
        schoolId,
        nom,
        niveau: nom.split(' ')[0],
        anneeScolaire: '2025-2026',
        isActive: true,
      },
    });
  }
  console.log('✅ Classes ajoutées');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());