import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, 
  Star, 
  Edit3, 
  Trash2, 
  Share2, 
  Paperclip, 
  Clock,
  Eye,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notesApi } from '../../services/api';

const NoteCard = ({ note, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      const response = await notesApi.updateNote(note._id, {
        isFavorite: !note.isFavorite
      });
      
      if (response.success) {
        onUpdate(response.note);
        toast.success(
          response.note.isFavorite 
            ? 'Added to favorites' 
            : 'Removed from favorites'
        );
      }
    } catch (error) {
      toast.error('Failed to update favorite status');
    }
    setIsLoading(false);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await notesApi.deleteNote(note._id);
      onDelete(note._id);
      toast.success('Note deleted successfully');
    } catch (error) {
      toast.error('Failed to delete note');
    }
    setIsLoading(false);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await notesApi.createShareLink(note._id, {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'badge-error';
      case 'medium':
        return 'badge-warning';
      case 'low':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work':
        return 'badge-primary';
      case 'personal':
        return 'badge-secondary';
      case 'study':
        return 'badge-accent';
      case 'project':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateContent = (content, maxLength = 150) => {
    const stripped = stripHtml(content);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const hasReminders = note.reminders && note.reminders.length > 0;
  const hasAttachments = note.attachments && note.attachments.length > 0;
  const upcomingReminders = note.reminders?.filter(r => 
    !r.isCompleted && new Date(r.reminderDate) > new Date()
  ) || [];

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200 border border-base-300">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Link to={`/note/${note._id}`} className="flex-1">
            <h3 className="card-title text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
              {note.title}
            </h3>
          </Link>
          
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="btn btn-ghost btn-sm btn-square"
              disabled={isLoading}
            >
              <MoreVertical size={16} />
            </button>
            
            {isMenuOpen && (
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border">
                <li>
                  <Link to={`/note/${note._id}`} className="flex items-center gap-2">
                    <Edit3 size={16} />
                    Edit
                  </Link>
                </li>
                <li>
                  <button onClick={handleShare} className="flex items-center gap-2">
                    <Share2 size={16} />
                    Share
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleToggleFavorite}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {note.isFavorite ? (
                      <>
                        <Heart size={16} className="fill-current text-error" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Heart size={16} />
                        Add to Favorites
                      </>
                    )}
                  </button>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-error"
                    disabled={isLoading}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <Link to={`/note/${note._id}`}>
          <p className="text-base-content/70 text-sm mb-4 line-clamp-3">
            {truncateContent(note.content)}
          </p>
        </Link>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {note.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="badge badge-outline badge-sm">
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="badge badge-outline badge-sm">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex justify-between items-center text-sm text-base-content/60">
          <div className="flex items-center gap-2">
            <span className={`badge badge-sm ${getCategoryColor(note.category)}`}>
              {note.category}
            </span>
            <span className={`badge badge-sm ${getPriorityColor(note.priority)}`}>
              {note.priority}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {note.isFavorite && (
              <Heart size={14} className="fill-current text-error" />
            )}
            {hasAttachments && (
              <div className="tooltip" data-tip={`${note.attachments.length} attachment(s)`}>
                <Paperclip size={14} />
              </div>
            )}
            {upcomingReminders.length > 0 && (
              <div className="tooltip" data-tip={`${upcomingReminders.length} upcoming reminder(s)`}>
                <Clock size={14} className="text-warning" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-base-300">
          <span className="text-xs text-base-content/50">
            {formatDistanceToNow(new Date(note.lastModified || note.createdAt), {
              addSuffix: true
            })}
          </span>
          
          <div className="flex items-center gap-1">
            {note.sharing?.shareToken && (
              <div className="tooltip" data-tip="Shared note">
                <Eye size={14} className="text-info" />
              </div>
            )}
            {note.versions && note.versions.length > 1 && (
              <span className="text-xs text-base-content/50">
                v{note.currentVersion || 1}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;