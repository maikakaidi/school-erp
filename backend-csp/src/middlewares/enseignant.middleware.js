export const requireEnseignant = (req, res, next) => {
  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ message: 'Accès réservé aux enseignants' });
  }
  next();
};
