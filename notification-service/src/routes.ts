import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendNotification, isUserOnline } from './socket';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/notifications
 * @desc    Send a notification to a user (delivers in real-time if online, or stores offline)
 */
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, title, message, and type are all required.' 
      });
    }

    const notification = await sendNotification({ userId, title, message, type });

    return res.status(201).json({
      success: true,
      message: isUserOnline(userId) 
        ? 'Notification dispatched in real-time.' 
        : 'Notification stored in offline queue.',
      data: notification
    });
  } catch (error) {
    console.error('Error dispatching notification:', error);
    return res.status(500).json({ error: 'Internal server error while dispatching notification.' });
  }
});

/**
 * @route   GET /api/notifications/:userId
 * @desc    Get all notifications for a specific user
 */
router.get('/notifications/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error while fetching notifications.' });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 */
router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a specific notification
 */
router.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    await prisma.notification.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * @route   GET /api/users/:userId/status
 * @desc    Check if a user is currently online (has active socket connections)
 */
router.get('/users/:userId/status', (req: Request, res: Response) => {
  const { userId } = req.params;
  const online = isUserOnline(userId);
  return res.status(200).json({
    userId,
    online
  });
});

export default router;
