import * as classeService from './classes.service.js';
import { z } from 'zod';

const createSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  niveau: z.string().min(1, 'Niveau requis'),

  capacite: z
    .number()
    .int()
    .positive()
    .optional(),

  anneeScolaire: z
    .string()
    .optional()
    .default('2025-2026'),
});

const updateSchema = createSchema.partial();

/* ─────────────────────────────────────────────
   GET ALL CLASSES
───────────────────────────────────────────── */
export const getAll = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;

    const classes = await classeService.getAllClasses(
      req.user.schoolId,
      anneeScolaire
    );

    res.json({
      classes,
      total: classes.length,
    });

  } catch (e) {
    next(e);
  }
};

/* ─────────────────────────────────────────────
   GET ONE CLASSE
───────────────────────────────────────────── */
export const getOne = async (req, res, next) => {
  try {

    const classe = await classeService.getClasseById(
      req.params.id,
      req.user.schoolId
    );

    if (!classe) {
      return res.status(404).json({
        message: 'Classe non trouvée',
      });
    }

    res.json(classe);

  } catch (e) {
    next(e);
  }
};

/* ─────────────────────────────────────────────
   CREATE CLASSE
───────────────────────────────────────────── */
export const create = async (req, res, next) => {
  try {

    const validated = createSchema.parse(req.body);

    const classe = await classeService.createClasse(
      req.user.schoolId,
      validated
    );

    res.status(201).json({
      message: 'Classe créée avec succès',
      classe,
    });

  } catch (e) {
    next(e);
  }
};

/* ─────────────────────────────────────────────
   UPDATE CLASSE
───────────────────────────────────────────── */
export const update = async (req, res, next) => {
  try {

    const validated = updateSchema.parse(req.body);

    await classeService.updateClasse(
      req.params.id,
      req.user.schoolId,
      validated
    );

    res.json({
      message: 'Classe mise à jour avec succès',
    });

  } catch (e) {
    next(e);
  }
};

/* ─────────────────────────────────────────────
   DELETE CLASSE
───────────────────────────────────────────── */
export const remove = async (req, res, next) => {
  try {

    await classeService.deleteClasse(
      req.params.id,
      req.user.schoolId
    );

    res.status(200).json({
      message: 'Classe supprimée avec succès',
    });

  } catch (e) {
    next(e);
  }
};