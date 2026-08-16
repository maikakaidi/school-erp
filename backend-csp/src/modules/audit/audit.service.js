import prisma from '../../config/database.js';

export const logAudit = async ({ schoolId, actorType, actorId, action, targetType, targetId, payload }) => {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: schoolId || null,
        actorType: actorType || 'system',
        actorId: actorId || null,
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        payload: payload !== undefined ? payload : undefined,
      },
    });
  } catch (error) {
    // L'audit ne doit jamais faire échouer l'action métier
    console.error('Audit log error:', error.message);
  }
};

export const auditActorFromReq = (req) => ({
  schoolId: req.user?.schoolId,
  actorType: req.user?.role || req.user?.actorType || 'system',
  actorId: req.user?.actorId || req.user?.schoolId || req.user?.superAdminId || null,
});
