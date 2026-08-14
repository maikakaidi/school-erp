export const requireParent = (req, res, next) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Accès réservé aux parents' });
  }
  next();
};
