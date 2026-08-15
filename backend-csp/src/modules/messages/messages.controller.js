import { z } from 'zod';
import * as messagesService from './messages.service.js';

const sendSchema = z.object({
  recipientType: z.enum(['parent', 'eleve', 'enseignant']),
  recipientId: z.string().min(1),
  sujet: z.string().min(1, 'Sujet requis'),
  contenu: z.string().min(1, 'Message requis'),
});

const replySchema = z.object({
  contenu: z.string().min(1, 'Message requis'),
});

const actorTypeSchema = z.enum(['parent', 'eleve', 'enseignant']);

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await messagesService.getConversations(req.user.schoolId);
    res.json({ conversations });
  } catch (error) { next(error); }
};

export const getConversation = async (req, res, next) => {
  try {
    const actorType = actorTypeSchema.parse(req.params.actorType);
    const conversation = await messagesService.getConversation(req.user.schoolId, actorType, req.params.actorId);
    res.json(conversation);
  } catch (error) { next(error); }
};

export const send = async (req, res, next) => {
  try {
    const data = sendSchema.parse(req.body);
    const message = await messagesService.sendFromSchool(req.user.schoolId, data);
    res.status(201).json({ message: 'Message envoyé', messageItem: message });
  } catch (error) { next(error); }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const actorType = actorTypeSchema.parse(req.params.actorType);
    await messagesService.getConversation(req.user.schoolId, actorType, req.params.actorId);
    res.json({ message: 'Conversation marquée comme lue' });
  } catch (error) { next(error); }
};

export const getMyMessages = async (req, res, next) => {
  try {
    const messages = await messagesService.getMyConversation(req.user.schoolId, req.user.actorType, req.user.actorId);
    res.json({ messages });
  } catch (error) { next(error); }
};

export const reply = async (req, res, next) => {
  try {
    const data = replySchema.parse(req.body);
    const messageItem = await messagesService.replyFromActor(req.user.schoolId, req.user.actorType, req.user.actorId, data);
    res.status(201).json({ message: 'Réponse envoyée', messageItem });
  } catch (error) { next(error); }
};

export const markMyRead = async (req, res, next) => {
  try {
    await messagesService.markReadForActor(req.user.schoolId, req.user.actorType, req.user.actorId);
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) { next(error); }
};

export const unreadCount = async (req, res, next) => {
  try {
    const count = await messagesService.getUnreadCountForActor(req.user.schoolId, req.user.actorType, req.user.actorId);
    res.json({ count });
  } catch (error) { next(error); }
};
