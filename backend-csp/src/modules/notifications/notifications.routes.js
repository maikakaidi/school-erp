import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSchool } from '../../middlewares/school.middleware.js';
import { checkSubscription } from '../../middlewares/checkSubscription.middleware.js';
import { getAll, getUnreadCount, markRead, markAllRead, remove, removeAllRead } from './notifications.controller.js';

const router = express.Router();
router.use(authenticate, requireSchool, checkSubscription);

router.get('/', getAll);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);
router.delete('/:id', remove);
router.delete('/read/all', removeAllRead);

export default router;
