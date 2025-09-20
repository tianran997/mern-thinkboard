import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Note from '../models/Note.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/attachments';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// 获取所有笔记 (带搜索和过滤功能)
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      tags,
      category,
      priority,
      isFavorite,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'lastModified',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      tags: tags ? tags.split(',') : undefined,
      category,
      priority,
      isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const notes = await Note.searchNotes(req.user._id, search, options);
    const total = await Note.countDocuments({
      owner: req.user._id,
      ...(search && { $text: { $search: search } }),
      ...(options.tags && { tags: { $in: options.tags } }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(typeof options.isFavorite === 'boolean' && { isFavorite: options.isFavorite })
    });

    res.json({
      success: true,
      notes,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
});

// 获取用户的所有标签
router.get('/tags', authenticate, async (req, res) => {
  try {
    const tags = await Note.getUserTags(req.user._id);
    res.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tags'
    });
  }
});

// 获取单个笔记
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
});

// 创建笔记
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, tags, category, priority, reminders } = req.body;

    const note = await Note.create({
      title,
      content,
      tags: tags ? tags.filter(tag => tag.trim()) : [],
      category: category || 'other',
      priority: priority || 'medium',
      owner: req.user._id,
      reminders: reminders || [],
      versions: [{
        title,
        content,
        tags: tags || [],
        versionNumber: 1,
        createdBy: req.user._id
      }]
    });

    const populatedNote = await Note.findById(note._id)
      .populate('owner', 'username email');

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: populatedNote
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
});

// 更新笔记
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, tags, category, priority, isFavorite } = req.body;

    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    // 使用 save() 方法而不是 findByIdAndUpdate
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags.filter(tag => tag.trim());
    if (category !== undefined) note.category = category;
    if (priority !== undefined) note.priority = priority;
    if (typeof isFavorite === 'boolean') note.isFavorite = isFavorite;

    // 创建新版本
    const newVersion = {
      title: note.title,
      content: note.content,
      tags: note.tags,
      versionNumber: note.currentVersion + 1,
      createdBy: req.user._id
    };

    note.versions.push(newVersion);
    note.currentVersion = newVersion.versionNumber;
    note.lastModified = new Date();

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    res.json({
      success: true,
      message: 'Note updated successfully',
      note: updatedNote
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
});
// 删除笔记
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    // 删除相关附件文件
    if (note.attachments && note.attachments.length > 0) {
      note.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      });
    }

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
});

// 上传附件
router.post('/:id/attachments', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    }));

    note.attachments.push(...attachments);
    await note.save();

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      attachments
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    
    // 删除已上传的文件
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
});

// 删除附件
router.delete('/:noteId/attachments/:attachmentId', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const attachment = note.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // 删除文件
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    attachment.remove();
    await note.save();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attachment'
    });
  }
});

// 下载附件
router.get('/:noteId/attachments/:attachmentId/download', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const attachment = note.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    
    // Stream the file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
});

// 获取笔记版本历史
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('versions.createdBy', 'username email');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    res.json({
      success: true,
      versions: note.versions.sort((a, b) => b.versionNumber - a.versionNumber)
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching versions'
    });
  }
});

// 回滚到指定版本
router.post('/:id/versions/:versionNumber/restore', authenticate, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const versionNumber = parseInt(req.params.versionNumber);
    const targetVersion = note.versions.find(v => v.versionNumber === versionNumber);

    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // 创建新版本（回滚版本）
    const newVersion = {
      title: targetVersion.title,
      content: targetVersion.content,
      tags: targetVersion.tags,
      versionNumber: note.currentVersion + 1,
      createdBy: req.user._id
    };

    note.title = targetVersion.title;
    note.content = targetVersion.content;
    note.tags = targetVersion.tags;
    note.versions.push(newVersion);
    note.currentVersion = newVersion.versionNumber;
    note.lastModified = new Date();

    await note.save();

    const updatedNote = await Note.findById(note._id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    res.json({
      success: true,
      message: `Note restored to version ${versionNumber}`,
      note: updatedNote
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring version'
    });
  }
});

// 生成分享链接
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const { isPublic = false, expiresAt = null } = req.body;
    
    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const shareToken = uuidv4();
    
    note.sharing = {
      shareToken,
      isPublic,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };

    await note.save();

    res.json({
      success: true,
      message: 'Share link generated successfully',
      shareUrl: `${process.env.FRONTEND_URL}/shared/${shareToken}`,
      shareToken
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating share link'
    });
  }
});

// 访问分享的笔记
router.get('/shared/:token', optionalAuth, async (req, res) => {
  try {
    const note = await Note.findOne({
      'sharing.shareToken': req.params.token
    }).populate('owner', 'username');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Shared note not found'
      });
    }

    // 检查过期时间
    if (note.sharing.expiresAt && new Date() > note.sharing.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Share link has expired'
      });
    }

    // 检查访问权限
    const isOwner = req.user && req.user._id.toString() === note.owner._id.toString();
    const isPublic = note.sharing.isPublic;
    const isAllowedUser = req.user && note.sharing.allowedUsers.includes(req.user._id);

    if (!isOwner && !isPublic && !isAllowedUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to shared note'
      });
    }

    res.json({
      success: true,
      note: {
        _id: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        category: note.category,
        priority: note.priority,
        owner: note.owner,
        attachments: note.attachments,
        createdAt: note.createdAt,
        lastModified: note.lastModified,
        isShared: true,
        canEdit: isOwner
      }
    });
  } catch (error) {
    console.error('Access shared note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accessing shared note'
    });
  }
});

// 添加提醒
router.post('/:id/reminders', authenticate, async (req, res) => {
  try {
    const { title, description, reminderDate } = req.body;

    if (!title || !reminderDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and reminder date are required'
      });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const reminder = {
      title,
      description,
      reminderDate: new Date(reminderDate)
    };

    note.reminders.push(reminder);
    await note.save();

    res.json({
      success: true,
      message: 'Reminder added successfully',
      reminder: note.reminders[note.reminders.length - 1]
    });
  } catch (error) {
    console.error('Add reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reminder'
    });
  }
});

// 更新提醒状态
router.put('/:noteId/reminders/:reminderId', authenticate, async (req, res) => {
  try {
    const { isCompleted } = req.body;

    const note = await Note.findOne({
      _id: req.params.noteId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.permission': 'write' }
      ]
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    const reminder = note.reminders.id(req.params.reminderId);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    reminder.isCompleted = isCompleted;
    await note.save();

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder'
    });
  }
});

export default router;