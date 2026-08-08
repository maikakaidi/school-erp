export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const messages = error.errors?.map(e => e.message) || [error.message];
    return res.status(400).json({ message: 'Données invalides', errors: messages });
  }
};
