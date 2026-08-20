import prisma from '../../config/database.js';

export const generateAnnualExport = async (schoolId, anneeScolaire) => {
  const [eleves, notes, versements, absences, frais, coeffs, inscriptions] = await Promise.all([
    prisma.eleve.findMany({
      where: { schoolId },
      include: { inscriptions: { where: { anneeScolaire } } },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    }),
    prisma.note.findMany({
      where: { schoolId, anneeScolaire },
      include: { eleve: true, matiere: true },
      orderBy: { eleve: { nom: 'asc' } },
    }),
    prisma.versement.findMany({
      where: { schoolId, anneeScolaire },
      include: { eleve: true },
      orderBy: { datePaiement: 'desc' },
    }),
    prisma.absence.findMany({
      where: { schoolId, anneeScolaire },
      include: { eleve: true },
      orderBy: { date: 'desc' },
    }),
    prisma.fraisScolaire.findMany({ where: { schoolId, anneeScolaire } }),
    prisma.coefficient.findMany({
      where: { schoolId, anneeScolaire },
      include: { matiere: true, classe: true },
    }),
    prisma.inscription.findMany({
      where: { schoolId, anneeScolaire },
      include: { eleve: true, classe: true },
    }),
  ]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '';

  const sheets = [
    {
      sheetName: 'Inscriptions',
      rows: inscriptions.map((i) => ({
        Élève: `${i.eleve.nom} ${i.eleve.prenom}`,
        Matricule: i.eleve.matricule,
        Classe: i.classe.nom,
        'Année scolaire': i.anneeScolaire,
        Date: formatDate(i.dateInscription),
        Type: i.type,
      })),
    },
    {
      sheetName: 'Notes',
      rows: notes.map((n) => ({
        Élève: `${n.eleve.nom} ${n.eleve.prenom}`,
        Matricule: n.eleve.matricule,
        Matière: n.matiere.libelle,
        Semestre: n.semestre,
        Devoir1: n.devoir1 ?? '',
        Devoir2: n.devoir2 ?? '',
        Composition: n.composition ?? '',
        Moyenne: n.moyenne ?? '',
        Rang: n.rang ?? '',
      })),
    },
    {
      sheetName: 'Versements',
      rows: versements.map((v) => ({
        Élève: `${v.eleve.nom} ${v.eleve.prenom}`,
        Matricule: v.eleve.matricule,
        Tranche: v.tranche,
        Montant: v.montant,
        Réduction: v.reduction || 0,
        'Montant payé': v.montantPaye,
        'Mode': v.modePaiement,
        Reçu: v.recuNumber,
        Date: formatDate(v.datePaiement),
      })),
    },
    {
      sheetName: 'Absences',
      rows: absences.map((a) => ({
        Élève: `${a.eleve.nom} ${a.eleve.prenom}`,
        Matricule: a.eleve.matricule,
        Date: formatDate(a.date),
        Type: a.type,
        Motif: a.motif || '',
        Justifié: a.justifie ? 'Oui' : 'Non',
      })),
    },
    {
      sheetName: 'Frais scolaires',
      rows: frais.map((f) => ({
        Classe: f.classeId,
        'Année': f.anneeScolaire,
        'Tranche 1': f.versement1,
        'Tranche 2': f.versement2,
        'Tranche 3': f.versement3,
        Total: f.total,
      })),
    },
    {
      sheetName: 'Coefficients',
      rows: coeffs.map((c) => ({
        Classe: c.classe.nom,
        Matière: c.matiere.libelle,
        Coefficient: c.coefficient,
      })),
    },
  ];

  return sheets;
};
