import prisma from '../../config/database.js';
import * as bulletinService from './bulletins.service.js';
import AdmZip from 'adm-zip';

export const generate = async (req, res, next) => {
  try {
    const { eleveId, semestre, anneeScolaire } = req.query;
    if (!eleveId || !semestre || !anneeScolaire) {
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    let pdfStream;
    try {
      pdfStream = await bulletinService.generateBulletinPDF(
        req.user.schoolId,
        eleveId,
        parseInt(semestre),
        anneeScolaire
      );
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=bulletin_${eleveId}_S${semestre}.pdf`);
    pdfStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const getClassement = async (req, res, next) => {
  try {
    const { classeId, semestre, anneeScolaire } = req.query;
    if (!classeId || !semestre || !anneeScolaire) {
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    const classement = await bulletinService.getClassement(
      req.user.schoolId,
      classeId,
      parseInt(semestre),
      anneeScolaire
    );
    res.json(classement);
  } catch (error) {
    next(error);
  }
};

export const generateAllBulletins = async (req, res, next) => {
  try {
    const { classeId } = req.params;
    const { semestre, anneeScolaire } = req.query;
    if (!classeId || !semestre || !anneeScolaire) {
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    const eleves = await prisma.eleve.findMany({
      where: {
        schoolId: req.user.schoolId,
        inscriptions: { some: { classeId, anneeScolaire } },
        isActive: true,
      },
    });
    if (eleves.length === 0) {
      return res.status(404).json({ message: 'Aucun élève trouvé pour cette classe' });
    }
    const zip = new AdmZip();
    let successCount = 0;
    const skipped = [];
    for (const eleve of eleves) {
      try {
        const pdfStream = await bulletinService.generateBulletinPDF(req.user.schoolId, eleve.id, parseInt(semestre), anneeScolaire);
        const chunks = [];
        for await (const chunk of pdfStream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        zip.addFile(`bulletin_${eleve.matricule || eleve.id}_S${semestre}.pdf`, buffer);
        successCount++;
      } catch (err) {
        skipped.push(`${eleve.nom} ${eleve.prenom}: ${err.message}`);
      }
    }
    if (successCount === 0) {
      return res.status(400).json({
        message: 'Aucun bulletin généré',
        details: skipped.length > 0 ? skipped : ['Aucun élève avec des notes pour cette classe et ce semestre'],
      });
    }
    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=bulletins_classe_${classeId}_S${semestre}.zip`);
    res.send(zipBuffer);
  } catch (error) {
    next(error);
  }
};