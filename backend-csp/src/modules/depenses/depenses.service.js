import prisma from '../../config/database.js';

export const getAllDepenses = async (schoolId, rubrique, startDate, endDate) => {
  const where = { schoolId };
  if (rubrique) where.rubrique = rubrique;
  if (startDate || endDate) {
    where.dateDepense = {};
    if (startDate) where.dateDepense.gte = new Date(startDate);
    if (endDate) where.dateDepense.lte = new Date(endDate);
  }
  return await prisma.depense.findMany({ where, orderBy: { dateDepense: 'desc' } });
};

export const getDepenseById = async (id, schoolId) => {
  return await prisma.depense.findFirst({ where: { id, schoolId } });
};

export const createDepense = async (schoolId, data) => {
  return await prisma.depense.create({ data: { schoolId, ...data } });
};

export const updateDepense = async (id, schoolId, data) => {
  return await prisma.depense.updateMany({ where: { id, schoolId }, data });
};

export const deleteDepense = async (id, schoolId) => {
  return await prisma.depense.deleteMany({ where: { id, schoolId } });
};

export const getDepensesStats = async (schoolId) => {
  const total = await prisma.depense.aggregate({ where: { schoolId }, _sum: { montant: true }, _count: true });
  const byRubrique = await prisma.depense.groupBy({ by: ['rubrique'], where: { schoolId }, _sum: { montant: true }, orderBy: { _sum: { montant: 'desc' } } });
  const recent = await prisma.depense.findMany({ where: { schoolId }, orderBy: { dateDepense: 'desc' }, take: 10 });
  return {
    totalMontant: total._sum.montant || 0,
    totalCount: total._count,
    byRubrique: byRubrique.map(r => ({ rubrique: r.rubrique, montant: r._sum.montant })),
    recent,
  };
};
