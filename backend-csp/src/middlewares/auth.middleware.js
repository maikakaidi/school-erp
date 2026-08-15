import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non authentifié' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Acteur métier (parent, enseignant, élève...) — toujours scoped par école
    if (decoded.actorType) {
      const school = await prisma.school.findUnique({ where: { id: decoded.schoolId } });
      if (!school || !school.isActive) return res.status(401).json({ message: 'École inactive' });
      if (decoded.actorType === 'parent') {
        const parent = await prisma.parent.findFirst({
          where: { id: decoded.actorId, schoolId: decoded.schoolId },
        });
        if (!parent || !parent.isActive) return res.status(401).json({ message: 'Compte parent invalide' });
        req.user = {
          schoolId: school.id,
          actorType: 'parent',
          actorId: parent.id,
          parentId: parent.id,
          role: 'parent',
        };
        return next();
      }
      if (decoded.actorType === 'enseignant') {
        const enseignant = await prisma.enseignant.findFirst({
          where: { id: decoded.actorId, schoolId: decoded.schoolId },
        });
        if (!enseignant || !enseignant.isActive) return res.status(401).json({ message: 'Compte enseignant invalide' });
        req.user = {
          schoolId: school.id,
          actorType: 'enseignant',
          actorId: enseignant.id,
          enseignantId: enseignant.id,
          role: 'enseignant',
        };
        return next();
      }
      if (decoded.actorType === 'eleve') {
        const eleve = await prisma.eleve.findFirst({
          where: { id: decoded.actorId, schoolId: decoded.schoolId },
        });
        if (!eleve || !eleve.isActive) return res.status(401).json({ message: 'Compte élève invalide' });
        req.user = {
          schoolId: school.id,
          actorType: 'eleve',
          actorId: eleve.id,
          eleveId: eleve.id,
          role: 'eleve',
        };
        return next();
      }
      return res.status(401).json({ message: 'Acteur non reconnu' });
    }

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