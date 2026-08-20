import * as eleveService from './eleves.service.js';
import { z } from 'zod';
import { sendExcel } from '../../utils/excel.export.js';
import { logAudit, auditActorFromReq } from '../audit/audit.service.js';
import { resolveAcademicYear } from '../academic-years/academicYears.service.js';

const createEleveSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().optional(),
  sexe: z.enum(['M', 'F']),
  dateNaissance: z.string().transform(str => new Date(str)),
  lieuNaissance: z.string(),
  nationalite: z.string(),
  telephone: z.string().optional(),
  nomParent: z.string(),
  adresseParent: z.string(),
  telParent: z.string(),
  classeId: z.string().uuid().optional(),
  langueChoisie: z.string().optional(),
  anneeScolaire: z.string().optional(),
  password: z.string().min(4, 'Mot de passe minimum 4 caractères').optional(),
});

const updateEleveSchema = createEleveSchema.partial();

export const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, classeId, anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const result = await eleveService.getAllEleves(
      req.user.schoolId,
      parseInt(page) || 1,
      parseInt(limit) || 20,
      search || '',
      classeId,
      year
    );
    res.json(result);
  } catch (error) { next(error); }
};

export const getOne = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const eleve = await eleveService.getEleveById(req.params.id, req.user.schoolId, anneeScolaire);
    if (!eleve) return res.status(404).json({ message: req.t('student_not_found') });
    res.json(eleve);
  } catch (error) { next(error); }
};

export const create = async (req, res, next) => {
  try {
    const validated = createEleveSchema.parse(req.body);
    const eleve = await eleveService.createEleve(req.user.schoolId, validated);
    res.status(201).json(eleve);
  } catch (error) { next(error); }
};

export const update = async (req, res, next) => {
  try {
    const validated = updateEleveSchema.parse(req.body);
    await eleveService.updateEleve(req.params.id, req.user.schoolId, validated);
   res.json({ message: 'Mis à jour avec succès' });
  } catch (error) { next(error); }
};

export const remove = async (req, res, next) => {
  try {
    await eleveService.deleteEleve(req.params.id, req.user.schoolId);
    logAudit({ ...auditActorFromReq(req), action: 'eleve.delete', targetType: 'eleve', targetId: req.params.id });
    res.status(204).send();
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const year = await resolveAcademicYear(req.user.schoolId, anneeScolaire);
    const rows = await eleveService.exportEleves(req.user.schoolId, year);
    sendExcel(res, rows, 'eleves.xlsx');
  } catch (error) { next(error); }
};