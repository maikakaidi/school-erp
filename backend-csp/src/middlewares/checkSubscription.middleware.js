import prisma from '../config/database.js';

export const checkSubscription = async (req, res, next) => {
  const schoolId = req.user.schoolId;
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school || !school.isActive) {
    return res.status(403).json({ message: 'Ecole desactivee' });
  }
  const now = new Date();
  if (school.subscriptionStatus === 'trial') {
    if (school.createdAt && (now - school.createdAt) > school.trialDays * 24 * 60 * 60 * 1000) {
      await prisma.school.update({
        where: { id: schoolId },
        data: { subscriptionStatus: 'expired', isActive: false }
      });
      return res.status(403).json({ message: 'Periode d\'essai expiree. Contactez le Super Admin.' });
    }
  } else if (school.subscriptionStatus === 'active') {
    if (school.subscriptionEnd && now > school.subscriptionEnd) {
      await prisma.school.update({
        where: { id: schoolId },
        data: { subscriptionStatus: 'expired', isActive: false }
      });
      return res.status(403).json({ message: 'Abonnement expire. Veuillez renouveler.' });
    }
  } else if (school.subscriptionStatus === 'expired' || school.subscriptionStatus === 'suspended') {
    return res.status(403).json({ message: 'Acces bloque : abonnement non actif.' });
  }
  next();
};
