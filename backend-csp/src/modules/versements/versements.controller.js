import * as versementService from './versements.service.js';
import { createVersementSchema } from './versements.validation.js';
import { sendExcel } from '../../utils/excel.export.js';
import prisma from '../../config/database.js';

export const create = async (req, res, next) => {
  try {
    const validated = createVersementSchema.parse(req.body);
    const versement = await versementService.createVersement(req.user.schoolId, validated);
    res.status(201).json({ message: 'Versement enregistré', versement });
  } catch (error) { next(error); }
};

export const getByEleve = async (req, res, next) => {
  try {
    const { eleveId, anneeScolaire } = req.query;
    if (!eleveId) return res.status(400).json({ message: 'eleveId requis' });
    const versements = await versementService.getVersementsByEleve(req.user.schoolId, eleveId, anneeScolaire);
    res.json(versements);
  } catch (error) { next(error); }
};

export const getSituation = async (req, res, next) => {
  try {
    const { eleveId, anneeScolaire, fraisTotal } = req.query;
    if (!eleveId) return res.status(400).json({ message: 'eleveId requis' });
    const situation = await versementService.getSituationFinanciere(
      req.user.schoolId,
      eleveId,
      anneeScolaire,
      parseFloat(fraisTotal) || 300000
    );
    res.json(situation);
  } catch (error) { next(error); }
};

export const exportExcel = async (req, res, next) => {
  try {
    const { anneeScolaire } = req.query;
    const rows = await versementService.exportVersements(req.user.schoolId, anneeScolaire);
    sendExcel(res, rows, 'versements.xlsx');
  } catch (error) { next(error); }
};

// Reçu PDF — accessible à l'école et au parent (uniquement pour ses enfants)
export const downloadRecu = async (req, res, next) => {
  try {
    const { recuNumber } = req.params;
    const versement = await versementService.getVersementByRecuNumber(req.user.schoolId, recuNumber);
    if (!versement) return res.status(404).json({ message: 'Reçu introuvable' });

    if (req.user.role === 'parent') {
      const lien = await prisma.parentEleve.findFirst({
        where: { parentId: req.user.parentId, eleveId: versement.eleveId },
      });
      if (!lien) return res.status(403).json({ message: 'Accès refusé' });
    } else if (req.user.role !== 'school') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const stream = await versementService.generateReçuPDF(req.user.schoolId, recuNumber);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recu_${recuNumber}.pdf"`);
    stream.pipe(res);
  } catch (error) { next(error); }
};