import prisma from '../../config/database.js';

export const getDashboardStats = async (schoolId, anneeScolaire) => {
  // 1. Nombre d'élèves actifs
  const nbEleves = await prisma.eleve.count({ where: { schoolId, isActive: true } });

  // 2. Nombre de classes actives (avec inscriptions pour l'année)
  const nbClasses = await prisma.classe.count({
    where: { schoolId, inscriptions: { some: { anneeScolaire } } },
  });

  // 3. Total des versements perçus pour l'année
  const totalVersements = await prisma.versement.aggregate({
    where: { schoolId, anneeScolaire },
    _sum: { montantPaye: true },
  });
  const totalPercu = totalVersements._sum.montantPaye || 0;

  // 4. Total des dépenses
  const totalDepenses = await prisma.depense.aggregate({
    where: { schoolId },
    _sum: { montant: true },
  });
  const depenses = totalDepenses._sum.montant || 0;

  // 5. Récupérer tous les élèves avec inscriptions, classes et versements
  const elevesAvecDonnees = await prisma.eleve.findMany({
    where: { schoolId, isActive: true },
    include: {
      inscriptions: { where: { anneeScolaire }, include: { classe: true } },
      versements: { where: { anneeScolaire } },
    },
  });

  // Récupérer les frais scolaires par classe pour cette année
  const fraisParClasse = await prisma.fraisScolaire.findMany({
    where: { schoolId, anneeScolaire },
    include: { classe: true },
  });

  // 6. Calcul du total attendu basé sur les élèves inscrits
  let totalAttendu = 0;
  for (const eleve of elevesAvecDonnees) {
    const inscription = eleve.inscriptions[0];
    if (!inscription) continue;
    const fraisClasse = fraisParClasse.find(f => f.classeId === inscription.classeId);
    if (fraisClasse) totalAttendu += fraisClasse.total;
  }
  const resteAPercevoir = totalAttendu - totalPercu;

  // 7. Calcul des versements par classe (pour le graphique)
  const percuParClasse = {};
  for (const eleve of elevesAvecDonnees) {
    const inscription = eleve.inscriptions[0];
    if (!inscription) continue;
    const className = inscription.classe.nom;
    const totalPaye = eleve.versements.reduce((s, v) => s + v.montantPaye, 0);
    percuParClasse[className] = (percuParClasse[className] || 0) + totalPaye;
  }
  const chartData = fraisParClasse.map(f => ({
    classe: f.classe.nom,
    attendu: f.total,
    percu: percuParClasse[f.classe.nom] || 0,
  }));

  // 8. Statut des paiements
  let payeCount = 0, partielCount = 0, impayeCount = 0;
  for (const eleve of elevesAvecDonnees) {
    const inscription = eleve.inscriptions[0];
    if (!inscription) continue;
    const fraisClasse = fraisParClasse.find(f => f.classeId === inscription.classeId);
    const totalAttenduEleve = fraisClasse ? fraisClasse.total : 0;
    const totalPayeEleve = eleve.versements.reduce((s, v) => s + v.montantPaye, 0);
    if (totalPayeEleve >= totalAttenduEleve) payeCount++;
    else if (totalPayeEleve > 0) partielCount++;
    else impayeCount++;
  }

  // 9. Élèves récents (5 derniers)
  const recentEleves = await prisma.eleve.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      inscriptions: { where: { anneeScolaire }, include: { classe: true }, take: 1 },
    },
  });
  const recentList = recentEleves.map(e => ({
    id: e.id,
    nom: `${e.nom} ${e.prenom}`,
    classe: e.inscriptions[0]?.classe?.nom || 'N/A',
  }));

  // 10. Examens à venir
  const now = new Date();
  const prochainsExamens = await prisma.examenBlanc.findMany({
    where: { schoolId, dateDebut: { gte: now } },
    orderBy: { dateDebut: 'asc' },
    take: 5,
    include: { classe: true, salles: true },
  });
  const examensList = prochainsExamens.map(ex => ({
    exam: ex.nom,
    date: ex.dateDebut.toLocaleDateString('fr-FR'),
    niveau: ex.classe?.nom || '',
    salle: ex.salles[0]?.nomSalle || 'Non définie',
  }));

  return {
    nbEleves,
    nbClasses,
    totalPercu,
    depenses,
    resteAPercevoir: resteAPercevoir > 0 ? resteAPercevoir : 0,
    chartData,
    paiements: { payeCount, partielCount, impayeCount },
    recentEleves: recentList,
    prochainsExamens: examensList,
  };
};