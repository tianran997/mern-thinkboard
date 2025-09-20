import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Eye, User, Calendar, ArrowLeft } from 'lucide-react';
import { notesApi } from '../services/api';
import toast from 'react-hot-toast';

const SharedNotePage = () => {
  const { token } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedNote();
  }, [token]);

  const fetchSharedNote = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getSharedNote(token);
      if (response.success) {
        setNote(response.note);
      }
    } catch (error) {
      console.error('Error fetching shared note:', error);
      if (error.response?.status === 404) {
        setError('This shared note was not found or may have expired.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view this shared note.');
      } else if (error.response?.status === 410) {
        setError('This share link has expired.');
      } else {
        setError('Failed to load the shared note.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="card-title justify-center text-error">Access Denied</h2>
            <p className="text-base-content/70">{error}</p>
            <div className="card-actions justify-center mt-4">
              <Link to="/" className="btn btn-primary">
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Note not found</h1>
          <Link to="/" className="btn btn-primary mt-4">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="btn btn-ghost btn-sm">
                <ArrowLeft size={20} />
                Back
              </Link>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                <Eye size={16} />
                <span>Shared Note</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">📝 ThinkBoard</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden">
          {/* Note Header */}
          <div className="p-6 border-b border-base-300">
            <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/70">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>By {note.owner?.username}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  Created {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {note.lastModified !== note.createdAt && (
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>
                    Updated {formatDistanceToNow(new Date(note.lastModified), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {note.tags.map((tag, index) => (
                  <span key={index} className="badge badge-outline">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Note Content */}
          <div className="p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </div>

          {/* Attachments */}
          {note.attachments && note.attachments.length > 0 && (
            <div className="p-6 border-t border-base-300">
              <h3 className="text-lg font-semibold mb-4">Attachments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {note.attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="flex items-center gap-3 p-4 bg-base-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attachment.originalName}</p>
                      <p className="text-sm text-base-content/70">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <span className="text-xs text-base-content/50">
                      Attachment preview not available
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-base-200 border-t border-base-300">
            <div className="text-center text-sm text-base-content/70">
              <p>This note is shared read-only.</p>
              <p className="mt-1">
                Create your own notes at{' '}
                <Link to="/" className="link link-primary">ThinkBoard</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedNotePage;