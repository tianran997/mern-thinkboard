import cron from 'node-cron';
import Note from '../models/Note.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initEmailTransporter();
    this.startReminderScheduler();
  }

  initEmailTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  startReminderScheduler() {
    // 每分钟检查一次待发送的提醒
    cron.schedule('* * * * *', () => {
      this.checkAndSendReminders();
    });

    console.log('Reminder scheduler started');
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);

      // 查找需要发送提醒的笔记
      const notesWithReminders = await Note.find({
        'reminders.reminderDate': {
          $gte: now,
          $lte: fiveMinutesFromNow
        },
        'reminders.isCompleted': false,
        'reminders.notificationSent': false
      }).populate('owner', 'username email');

      for (const note of notesWithReminders) {
        for (const reminder of note.reminders) {
          if (
            reminder.reminderDate >= now &&
            reminder.reminderDate <= fiveMinutesFromNow &&
            !reminder.isCompleted &&
            !reminder.notificationSent
          ) {
            await this.sendReminder(note, reminder);
            
            // 标记为已发送
            reminder.notificationSent = true;
            await note.save();
          }
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async sendReminder(note, reminder) {
    try {
      const user = note.owner;
      
      // 发送邮件提醒（如果配置了邮件服务）
      if (this.transporter && user.email) {
        await this.sendEmailReminder(user, note, reminder);
      }

      // 这里可以添加其他通知方式，如推送通知、短信等
      console.log(`Reminder sent for note "${note.title}" to user ${user.username}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  async sendEmailReminder(user, note, reminder) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: `Reminder: ${reminder.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📝 Note Reminder</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">${reminder.title}</h3>
            ${reminder.description ? `<p style="color: #6c757d;">${reminder.description}</p>` : ''}
            
            <div style="margin-top: 15px;">
              <strong>Note:</strong> <a href="${process.env.FRONTEND_URL}/notes/${note._id}" style="color: #007bff; text-decoration: none;">${note.title}</a>
            </div>
            
            <div style="margin-top: 10px; color: #6c757d; font-size: 14px;">
              <strong>Due:</strong> ${reminder.reminderDate.toLocaleString()}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/notes/${note._id}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Note
            </a>
          </div>
          
          <hr style="border: none; height: 1px; background: #dee2e6; margin: 30px 0;">
          
          <p style="color: #6c757d; font-size: 12px; text-align: center;">
            This reminder was sent from your ThinkBoard app.<br>
            <a href="${process.env.FRONTEND_URL}/settings" style="color: #007bff;">Manage your notification settings</a>
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 获取用户的待办提醒
  async getUserUpcomingReminders(userId, limit = 10) {
    try {
      const now = new Date();
      const notes = await Note.find({
        owner: userId,
        'reminders.reminderDate': { $gte: now },
        'reminders.isCompleted': false
      }).select('title reminders createdAt');

      const reminders = [];
      
      notes.forEach(note => {
        note.reminders.forEach(reminder => {
          if (reminder.reminderDate >= now && !reminder.isCompleted) {
            reminders.push({
              id: reminder._id,
              title: reminder.title,
              description: reminder.description,
              reminderDate: reminder.reminderDate,
              noteId: note._id,
              noteTitle: note.title
            });
          }
        });
      });

      return reminders
        .sort((a, b) => a.reminderDate - b.reminderDate)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return [];
    }
  }

  // 获取今天的提醒
  async getTodayReminders(userId) {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const notes = await Note.find({
        owner: userId,
        'reminders.reminderDate': {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).select('title reminders');

      const todayReminders = [];
      
      notes.forEach(note => {
        note.reminders.forEach(reminder => {
          if (reminder.reminderDate >= startOfDay && reminder.reminderDate <= endOfDay) {
            todayReminders.push({
              id: reminder._id,
              title: reminder.title,
              description: reminder.description,
              reminderDate: reminder.reminderDate,
              isCompleted: reminder.isCompleted,
              noteId: note._id,
              noteTitle: note.title
            });
          }
        });
      });

      return todayReminders.sort((a, b) => a.reminderDate - b.reminderDate);
    } catch (error) {
      console.error('Error fetching today reminders:', error);
      return [];
    }
  }
}

export default new NotificationService();