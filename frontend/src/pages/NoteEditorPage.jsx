import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Save, Upload, X, Clock, Calendar, ArrowLeft, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { notesApi } from '../services/api';
import RichTextEditor from '../components/Editor/RichTextEditor';

const NoteEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [note, setNote] = useState({
    title: '',
    content: '',
    tags: [],
    category: 'other',
    priority: 'medium',
    reminders: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    reminderDate: ''
  });
  const [showReminderForm, setShowReminderForm] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getNote(id);
      if (response.success) {
        setNote(response.note);
        setAttachments(response.note.attachments || []);
      }
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!note.content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    try {
      setSaving(true);
      const noteData = {
        ...note,
        tags: note.tags.filter(tag => tag.trim())
      };

      let response;
      if (isEditing) {
        response = await notesApi.updateNote(id, noteData);
      } else {
        response = await notesApi.createNote(noteData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Note updated successfully' : 'Note created successfully');
        navigate(`/notes/${response.note._id}`);
      }
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tag = newTag.trim().toLowerCase();
      if (!note.tags.includes(tag)) {
        setNote({ ...note, tags: [...note.tags, tag] });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNote({
      ...note,
      tags: note.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.reminderDate) {
      toast.error('Please fill in all required reminder fields');
      return;
    }
  
    const reminderData = {
      title: newReminder.title.trim(),
      description: newReminder.description,
      reminderDate: new Date(newReminder.reminderDate).toISOString()
    };
  
    try {
      if (isEditing) {
        // 如果是编辑现有笔记，调用API保存到数据库
        const response = await notesApi.addReminder(id, reminderData);
        if (response.success) {
          // 重新获取笔记数据以确保同步
          await fetchNote();
          toast.success('Reminder added successfully');
        }
      } else {
        // 如果是新建笔记，只更新本地状态（保存笔记时会一起保存）
        const reminder = {
          ...reminderData,
          id: Date.now() // 临时ID，用于前端渲染
        };
        
        setNote({
          ...note,
          reminders: [...(note.reminders || []), reminder]
        });
      }
  
      setNewReminder({
        title: '',
        description: '',
        reminderDate: ''
      });
      setShowReminderForm(false);
    } catch (error) {
      console.error('Add reminder error:', error);
      toast.error('Failed to add reminder');
    }
  };
  
  const handleRemoveReminder = async (index) => {
    const reminder = note.reminders[index];
    
    try {
      if (isEditing && reminder._id) {
        // 如果是已保存的提醒，调用API删除
        await notesApi.updateReminder(id, reminder._id, { isCompleted: true });
        // 重新获取笔记数据
        await fetchNote();
        toast.success('Reminder removed');
      } else {
        // 如果是本地提醒或新建笔记，只更新本地状态
        setNote({
          ...note,
          reminders: note.reminders.filter((_, i) => i !== index)
        });
      }
    } catch (error) {
      console.error('Remove reminder error:', error);
      // 即使API调用失败，也从本地状态中移除
      setNote({
        ...note,
        reminders: note.reminders.filter((_, i) => i !== index)
      });
      toast.error('Failed to remove reminder from server, but removed locally');
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (!isEditing) {
      toast.error('Please save the note first before uploading attachments');
      return;
    }

    try {
      const response = await notesApi.uploadAttachments(id, acceptedFiles);
      if (response.success) {
        setAttachments([...attachments, ...response.attachments]);
        toast.success('Files uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'text/plain': [],
      'application/msword': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': []
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024
  });

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await notesApi.deleteAttachment(id, attachmentId);
      setAttachments(attachments.filter(att => att._id !== attachmentId));
      toast.success('Attachment deleted');
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">
            {isEditing ? 'Edit Note' : 'Create Note'}
          </h1>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving || !note.title.trim() || !note.content.trim()}
          className={`btn btn-primary ${saving ? 'loading' : ''}`}
        >
          {!saving && <Save size={20} />}
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Enter note title..."
              value={note.title}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
              className="input input-ghost text-3xl font-bold w-full text-base-content placeholder:text-base-content/50 border-none focus:outline-none p-0"
            />
          </div>

          {/* Content Editor */}
          <div>
            <RichTextEditor
              content={note.content}
              onChange={(content) => setNote({ ...note, content })}
              placeholder="Start writing your note..."
            />
          </div>

          {/* Attachments Section */}
          {isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attachments</h3>
              
              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-2 text-base-content/50" size={32} />
                <p className="text-base-content/70">
                  {isDragActive
                    ? 'Drop files here...'
                    : 'Drag & drop files here, or click to select'}
                </p>
                <p className="text-sm text-base-content/50 mt-1">
                  Supports images, PDFs, and documents (max 10MB each)
                </p>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment._id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-base-content/70" />
                        <div>
                          <p className="font-medium">{attachment.originalName}</p>
                          <p className="text-sm text-base-content/70">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(attachment._id)}
                        className="btn btn-ghost btn-sm text-error"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="card bg-base-100 shadow-sm border">
            <div className="card-body p-4">
              <h3 className="card-title text-lg">Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Category</span>
                  </label>
                  <select
                    value={note.category}
                    onChange={(e) => setNote({ ...note, category: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="other">Other</option>
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="project">Project</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Priority</span>
                  </label>
                  <select
                    value={note.priority}
                    onChange={(e) => setNote({ ...note, priority: e.target.value })}
                    className="select select-bordered w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="card bg-base-100 shadow-sm border">
            <div className="card-body p-4">
              <h3 className="card-title text-lg">Tags</h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleAddTag}
                  className="input input-bordered input-sm w-full"
                />
                
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="badge badge-primary gap-2 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X size={12} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="card bg-base-100 shadow-sm border">
            <div className="card-body p-4">
              <div className="flex justify-between items-center">
                <h3 className="card-title text-lg">Reminders</h3>
                <button
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="btn btn-primary btn-sm"
                >
                  <Clock size={16} />
                </button>
              </div>
              
              {showReminderForm && (
                <div className="space-y-3 mt-4">
                  <input
                    type="text"
                    placeholder="Reminder title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                  
                  <textarea
                    placeholder="Description (optional)"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    className="textarea textarea-bordered textarea-sm w-full"
                    rows={2}
                  />
                  
                  <input
                    type="datetime-local"
                    value={newReminder.reminderDate}
                    onChange={(e) => setNewReminder({ ...newReminder, reminderDate: e.target.value })}
                    className="input input-bordered input-sm w-full"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddReminder}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowReminderForm(false)}
                      className="btn btn-ghost btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 mt-4">
                {note.reminders?.map((reminder, index) => (
                  <div
                    key={index}
                    className="p-3 bg-base-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{reminder.title}</p>
                        {reminder.description && (
                          <p className="text-sm text-base-content/70 mt-1">
                            {reminder.description}
                          </p>
                        )}
                        <p className="text-xs text-base-content/50 mt-1">
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(reminder.reminderDate).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveReminder(index)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorPage;