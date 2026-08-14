import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../config/database.js';

let schoolId;

describe('Notifications', () => {
  let createdId;

  before(async () => {
    const school = await prisma.school.findFirst();
    if (!school) throw new Error('No school in DB — run seed first');
    schoolId = school.id;
  });

  after(async () => {
    if (createdId) {
      await prisma.notification.deleteMany({ where: { id: createdId } });
    }
    await prisma.$disconnect();
  });

  it('should create a notification', async () => {
    const notif = await prisma.notification.create({
      data: {
        schoolId,
        type: 'versement',
        title: 'Paiement reçu',
        message: 'Test — Tranche 1: 50,000 FCFA',
        link: '/versements',
      },
    });
    createdId = notif.id;
    assert.ok(notif.id);
    assert.strictEqual(notif.type, 'versement');
    assert.strictEqual(notif.isRead, false);
    assert.strictEqual(notif.schoolId, schoolId);
  });

  it('should fetch notifications for a school', async () => {
    const results = await prisma.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(results.length >= 1);
    assert.strictEqual(results[0].title, 'Paiement reçu');
  });

  it('should count unread notifications', async () => {
    const count = await prisma.notification.count({
      where: { schoolId, isRead: false },
    });
    assert.ok(count >= 1);
  });

  it('should mark as read', async () => {
    await prisma.notification.updateMany({
      where: { id: createdId },
      data: { isRead: true },
    });
    const notif = await prisma.notification.findUnique({ where: { id: createdId } });
    assert.strictEqual(notif.isRead, true);
  });

  it('should delete a notification', async () => {
    await prisma.notification.deleteMany({ where: { id: createdId } });
    const count = await prisma.notification.count({ where: { id: createdId } });
    assert.strictEqual(count, 0);
    createdId = null;
  });
});
