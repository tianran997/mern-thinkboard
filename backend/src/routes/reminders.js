import express from 'express';
import { authenticate } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// 获取用户即将到来的提醒
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const reminders = await notificationService.getUserUpcomingReminders(req.user._id, limit);
    
    res.json({
      success: true,
      reminders
    });
  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming reminders'
    });
  }
});

// 获取今天的提醒
router.get('/today', authenticate, async (req, res) => {
  try {
    const reminders = await notificationService.getTodayReminders(req.user._id);
    
    res.json({
      success: true,
      reminders
    });
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today reminders'
    });
  }
});

export default router;