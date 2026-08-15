import * as horaireService from './horaires.service.js';
import { createHoraireSchema } from './horaires.validation.js';

export const getAll = async (req, res, next) => {
  try {
    const { mois, annee } = req.query;
    const horaires = await horaireService.getAllHoraires(req.user.schoolId, mois, annee);
    res.json(horaires);
  } catch (error) { next(error); }
};

export const getByEnseignant = async (req, res, next) => {
  try {
    const { enseignantId, mois, annee } = req.query;
    const horaires = await horaireService.getHorairesByEnseignant(req.user.schoolId, enseignantId, mois, annee);
    res.json(horaires);
  } catch (error) { next(error); }
};

export const getByClasse = async (req, res, next) => {
  try {
    const { classeId, mois, annee } = req.query;
    if (!classeId) return res.status(400).json({ message: 'classeId requis' });
    const horaires = await horaireService.getHorairesByClasse(req.user.schoolId, classeId, mois, annee);
    res.json(horaires);
  } catch (error) { next(error); }
};

export const getByEleve = async (req, res, next) => {
  try {
    const { eleveId, mois, annee } = req.query;
    if (!eleveId) return res.status(400).json({ message: 'eleveId requis' });
    const data = await horaireService.getEmploiDuTempsEleve(req.user.schoolId, eleveId, mois, annee);
    res.json(data);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createHoraireSchema.parse(req.body);
    const horaire = await horaireService.createHoraire(req.user.schoolId, validated);
    res.status(201).json(horaire);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const validated = createHoraireSchema.partial().parse(req.body);
    await horaireService.updateHoraire(req.params.id, req.user.schoolId, validated);
    res.json({ message: 'Horaire mis à jour' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await horaireService.deleteHoraire(req.params.id, req.user.schoolId);
    res.status(204).send();
  } catch (error) { next(error); }
};