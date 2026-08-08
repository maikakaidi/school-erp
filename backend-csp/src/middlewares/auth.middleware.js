import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non authentifié' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Vérifier école (si user est une école)
    if (decoded.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: decoded.schoolId } });
      if (!school || !school.isActive) return res.status(401).json({ message: 'École inactive' });
      req.user = { schoolId: school.id, role: 'school' };
    }
    // Super Admin
    else if (decoded.superAdminId) {
      const superAdmin = await prisma.superAdmin.findUnique({ where: { id: decoded.superAdminId } });
      if (!superAdmin) return res.status(401).json({ message: 'Super Admin invalide' });
      req.user = { superAdminId: superAdmin.id, role: 'super_admin' };
    }
    else return res.status(401).json({ message: 'Token invalide' });
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};