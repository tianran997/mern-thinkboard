import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Edit3, 
  Share2, 
  Heart, 
  Download, 
  History, 
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Paperclip
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notesApi } from '../services/api';

const NoteViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getNote(id);
      if (response.success) {
        setNote(response.note);
      }
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await notesApi.getVersions(id);
      if (response.success) {
        setVersions(response.versions);
      }
    } catch (error) {
      toast.error('Failed to load version history');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const response = await notesApi.updateNote(id, {
        isFavorite: !note.isFavorite
      });
      
      if (response.success) {
        setNote(response.note);
        toast.success(
          response.note.isFavorite 
            ? 'Added to favorites' 
            : 'Removed from favorites'
        );
      }
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleShare = async () => {
    try {
      const response = await notesApi.createShareLink(id, {
        isPublic: true,
        expiresAt: null
      });
      
      if (response.success) {
        await navigator.clipboard.writeText(response.shareUrl);
        toast.success('Share link copied to clipboard');
      }
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      // 使用直接URL下载而不是axios
      const token = document.cookie.split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notes/${id}/attachments/${attachmentId}/download`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download attachment');
    }
  };

  const handleRestoreVersion = async (versionNumber) => {
    if (!confirm(`Restore to version ${versionNumber}? This will create a new version with the restored content.`)) {
      return;
    }

    try {
      const response = await notesApi.restoreVersion(id, versionNumber);
      if (response.success) {
        setNote(response.note);
        setShowVersions(false);
        toast.success(`Restored to version ${versionNumber}`);
      }
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-info';
      default: return 'badge-ghost';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'badge-primary';
      case 'personal': return 'badge-secondary';
      case 'study': return 'badge-accent';
      case 'project': return 'badge-info';
      default: return 'badge-ghost';
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

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Note not found</h1>
          <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
        </div>
      </div>
    );
  }

  const upcomingReminders = note.reminders?.filter(r => 
    !r.isCompleted && new Date(r.reminderDate) > new Date()
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{note.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-base-content/70">
              <span className={`badge ${getCategoryColor(note.category)}`}>
                {note.category}
              </span>
              <span className={`badge ${getPriorityColor(note.priority)}`}>
                {note.priority}
              </span>
              {note.isFavorite && (
                <Heart size={16} className="fill-current text-error" />
              )}
              <span>•</span>
              <span>
                Created {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
              </span>
              {note.lastModified !== note.createdAt && (
                <>
                  <span>•</span>
                  <span>
                    Updated {formatDistanceToNow(new Date(note.lastModified), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`btn btn-sm ${note.isFavorite ? 'btn-error' : 'btn-outline'}`}
          >
            <Heart size={16} className={note.isFavorite ? 'fill-current' : ''} />
          </button>
          
          <button
            onClick={handleShare}
            className="btn btn-outline btn-sm"
          >
            <Share2 size={16} />
          </button>
          
          <button
            onClick={() => {
              setShowVersions(!showVersions);
              if (!showVersions) fetchVersions();
            }}
            className="btn btn-outline btn-sm"
          >
            <History size={16} />
          </button>
          
          <Link
            to={`/notes/${id}/edit`}
            className="btn btn-primary btn-sm"
          >
            <Edit3 size={16} />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Note Content */}
          <div className="prose max-w-none bg-base-100 p-6 rounded-lg shadow-sm border">
            <div 
              dangerouslySetInnerHTML={{ __html: note.content }}
              className="break-words"
            />
          </div>

          {/* Attachments */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Attachments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {note.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center justify-between p-4 bg-base-100 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Paperclip size={20} className="text-base-content/70 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{attachment.originalName}</p>
                        <p className="text-sm text-base-content/70">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadAttachment(attachment._id, attachment.originalName)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="card bg-base-100 shadow-sm border">
              <div className="card-body p-4">
                <h3 className="card-title text-lg">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <span key={index} className="badge badge-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="card bg-base-100 shadow-sm border">
              <div className="card-body p-4">
                <h3 className="card-title text-lg">Upcoming Reminders</h3>
                <div className="space-y-3">
                  {upcomingReminders.map((reminder, index) => (
                    <div key={index} className="p-3 bg-base-200 rounded-lg">
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Note Info */}
          <div className="card bg-base-100 shadow-sm border">
            <div className="card-body p-4">
              <h3 className="card-title text-lg">Note Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-base-content/70" />
                  <span>Created by {note.owner?.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-base-content/70" />
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                {note.currentVersion > 1 && (
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-base-content/70" />
                    <span>Version {note.currentVersion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersions && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Version History</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.versionNumber}
                  className="border border-base-300 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Version {version.versionNumber}</h4>
                      <p className="text-sm text-base-content/70">
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        {' • '}by {version.createdBy?.username}
                      </p>
                    </div>
                    {version.versionNumber !== note.currentVersion && (
                      <button
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                        className="btn btn-outline btn-sm"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium">{version.title}</p>
                    <div 
                      className="mt-2 text-base-content/70 line-clamp-3"
                      dangerouslySetInnerHTML={{ 
                        __html: version.content.substring(0, 200) + '...' 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowVersions(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteViewPage;