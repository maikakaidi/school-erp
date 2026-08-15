export const requireEleve = (req, res, next) => {
  if (req.user.role !== 'eleve') {
    return res.status(403).json({ message: 'Accès réservé aux élèves' });
  }
  next();
};
