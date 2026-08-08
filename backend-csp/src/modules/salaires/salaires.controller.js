import * as salaireService from './salaires.service.js';

export const getListe = async (req, res, next) => {
  try {
    const { mois, annee } = req.query;
    const salaires = await salaireService.getSalaires(req.user.schoolId, parseInt(mois), parseInt(annee));
    res.json(salaires);
  } catch (error) { next(error); }
};

export const calculer = async (req, res, next) => {
  try {
    const { mois, annee } = req.body;
    await salaireService.calculerTousSalaires(req.user.schoolId, mois, annee);
    res.json({ message: 'Salaires calculés avec succès' });
  } catch (error) { next(error); }
};

export const payer = async (req, res, next) => {
  try {
    await salaireService.marquerPaye(req.params.id, req.user.schoolId);
    res.json({ message: 'Paiement enregistré' });
  } catch (error) { next(error); }
};

export const creerAvance = async (req, res, next) => {
  try {
    const { enseignantId, montant, remarque } = req.body;
    const avance = await salaireService.creerAvance(req.user.schoolId, enseignantId, montant, remarque);
    res.status(201).json(avance);
  } catch (error) { next(error); }
};

export const getAvances = async (req, res, next) => {
  try {
    const avances = await salaireService.getAvances(req.user.schoolId, req.query.enseignantId);
    res.json(avances);
  } catch (error) { next(error); }
};

export const telechargerReçu = async (req, res, next) => {
  try {
    const pdfStream = await salaireService.generateReçuPDF(req.params.id, req.user.schoolId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recu_${req.params.id}.pdf`);
    pdfStream.pipe(res);
  } catch (error) { next(error); }
};