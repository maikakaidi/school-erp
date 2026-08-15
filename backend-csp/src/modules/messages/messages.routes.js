import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import {
  listConversations, getConversation, send, markConversationRead,
  getMyMessages, reply, markMyRead, unreadCount,
} from './messages.controller.js';

const requireActor = (req, res, next) => {
  if (!['parent', 'eleve', 'enseignant'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès réservé aux parents, élèves et enseignants' });
  }
  next();
};

const router = express.Router();

// Acteurs (parent, élève, enseignant) : leur fil avec l'école
router.get('/me', authenticate, requireActor, checkSubscription, getMyMessages);
router.post('/reply', authenticate, requireActor, checkSubscription, reply);
router.post('/me/read', authenticate, requireActor, checkSubscription, markMyRead);
router.get('/unread-count', authenticate, requireActor, checkSubscription, unreadCount);

// École
const schoolRouter = express.Router();
schoolRouter.use(authenticate, requireSchool, checkSubscription);
schoolRouter.get('/conversations', listConversations);
schoolRouter.get('/conversation/:actorType/:actorId', getConversation);
schoolRouter.post('/send', send);
schoolRouter.post('/read/:actorType/:actorId', markConversationRead);

router.use(schoolRouter);

export default router;
