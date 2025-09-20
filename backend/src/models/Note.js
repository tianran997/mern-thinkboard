import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const versionSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  versionNumber: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const shareSchema = new mongoose.Schema({
  shareToken: {
    type: String,
    required: true,
    unique: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  reminderDate: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  category: {
    type: String,
    enum: ['personal', 'work', 'study', 'project', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    }
  }],
  attachments: [attachmentSchema],
  versions: [versionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  sharing: shareSchema,
  reminders: [reminderSchema],
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引优化
noteSchema.index({ owner: 1, createdAt: -1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ title: 'text', content: 'text' });
noteSchema.index({ 'sharing.shareToken': 1 });
noteSchema.index({ 'reminders.reminderDate': 1 });

// 保存版本历史的中间件
noteSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate();
  if (update.title || update.content || update.tags) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const newVersion = {
        title: update.title || doc.title,
        content: update.content || doc.content,
        tags: update.tags || doc.tags,
        versionNumber: doc.currentVersion + 1,
        createdBy: update.owner || doc.owner
      };
      
      update.versions = [...(doc.versions || []), newVersion];
      update.currentVersion = newVersion.versionNumber;
    }
  }
  update.lastModified = new Date();
});

// 搜索方法
noteSchema.statics.searchNotes = function(userId, query, options = {}) {
  const {
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
  } = options;

  // 自动处理 userId
  const objectId = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  let searchQuery = { owner: objectId };

  // 文本搜索
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // 标签过滤
  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags };
  }

  // 其他过滤条件
  if (category) searchQuery.category = category;
  if (priority) searchQuery.priority = priority;
  if (typeof isFavorite === 'boolean') searchQuery.isFavorite = isFavorite;

  // 日期范围过滤
  if (startDate || endDate) {
    searchQuery.createdAt = {};
    if (startDate) searchQuery.createdAt.$gte = new Date(startDate);
    if (endDate) searchQuery.createdAt.$lte = new Date(endDate);
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find(searchQuery)
    .populate('owner', 'username email')
    .populate('collaborators.user', 'username email')
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit);
};

// 获取用户的所有标签
noteSchema.statics.getUserTags = function(userId) {
  const objectId = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;

  return this.aggregate([
    { $match: { owner: objectId } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};
export default mongoose.model('Note', noteSchema);