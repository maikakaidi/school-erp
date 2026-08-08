export const requireSchool = (req, res, next) => {
  if (req.user.role !== 'school') {
    return res.status(403).json({ message: 'Accès réservé aux établissements' });
  }
  next();
};