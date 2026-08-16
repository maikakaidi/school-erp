import * as depenseService from './depenses.service.js';
import { z } from 'zod';
import { logAudit, auditActorFromReq } from '../audit/audit.service.js';

const createSchema = z.object({
  libelle: z.string().min(1),
  montant: z.number().positive(),
  rubrique: z.string(),
  dateDepense: z.string().transform(str => new Date(str)).optional(),
  pieceJointe: z.string().optional(),
});

const updateSchema = createSchema.partial();

export const getAll = async (req, res, next) => {
  try {
    const { rubrique, startDate, endDate } = req.query;
    const depenses = await depenseService.getAllDepenses(req.user.schoolId, rubrique, startDate, endDate);
    res.json(depenses);
  } catch (e) { next(e); }
};

export const getOne = async (req, res, next) => {
  try {
    const depense = await depenseService.getDepenseById(req.params.id, req.user.schoolId);
    if (!depense) return res.status(404).json({ message: 'Dépense non trouvée' });
    res.json(depense);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createSchema.parse(req.body);
    const depense = await depenseService.createDepense(req.user.schoolId, validated);
    logAudit({ ...auditActorFromReq(req), action: 'depense.create', targetType: 'depense', targetId: depense.id, payload: { libelle: depense.libelle, montant: depense.montant } });
    res.status(201).json(depense);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const validated = updateSchema.parse(req.body);
    await depenseService.updateDepense(req.params.id, req.user.schoolId, validated);
    logAudit({ ...auditActorFromReq(req), action: 'depense.update', targetType: 'depense', targetId: req.params.id });
    res.json({ message: 'Mis à jour' });
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await depenseService.deleteDepense(req.params.id, req.user.schoolId);
    logAudit({ ...auditActorFromReq(req), action: 'depense.delete', targetType: 'depense', targetId: req.params.id });
    res.status(204).send();
  } catch (e) { next(e); }
};