import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { notesApi } from '../services/api';
import SearchAndFilter from '../components/Notes/SearchAndFilter';
import NoteCard from '../components/Notes/NoteCard';
import { debounce } from 'lodash';
import { useSearchParams } from 'react-router-dom';

const NotesPage = () => {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // 从 URL 读取过滤参数
    const isFavorite = searchParams.get('isFavorite');
    if (isFavorite === 'true') {
      setFilters(prev => ({ ...prev, isFavorite: true }));
    } else {
      setFilters(prev => ({ ...prev, isFavorite: undefined }));
    }
  }, [searchParams]);

  // 用户主动操作时全量获取列表
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getNotes({ ...filters, page: currentPage, limit: 12 });

      if (response.success) {
        setNotes(response.notes);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchNotes = useMemo(() => debounce(fetchNotes, 500), [filters, currentPage]);

  useEffect(() => {
    debouncedFetchNotes();
  }, [filters, currentPage, debouncedFetchNotes]);

  // 自动刷新只获取新笔记
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // 只拿最新5条笔记
        const response = await notesApi.getNotes({ page: 1, limit: 5 });
        if (response.success) {
          setNotes(prevNotes => {
            const existingIds = new Set(prevNotes.map(n => n._id));
            const newNotes = response.notes.filter(n => !existingIds.has(n._id));
            return [...newNotes, ...prevNotes];
          });
        }
      } catch (err) {
        console.error('Auto-refresh error:', err);
      }
    }, 60 * 1000); // 每1分钟检查一次新笔记

    return () => clearInterval(interval);
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes(notes.map(note => note._id === updatedNote._id ? updatedNote : note));
  };

  const handleDeleteNote = (noteId) => {
    setNotes(notes.filter(note => note._id !== noteId));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Notes</h1>
          <p className="text-base-content/70 mt-1">{pagination.total} {pagination.total === 1 ? 'note' : 'notes'} total</p>
        </div>
        <Link to="/notes/new" className="btn btn-primary">
          <Plus size={20} /> New Note
        </Link>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter onFiltersChange={handleFiltersChange} initialFilters={filters} />

      {/* Notes Grid */}
      {loading && notes.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="animate-spin" size={32} />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-base-content/70 mb-6">
              {Object.keys(filters).length > 0
                ? "Try adjusting your search criteria or filters."
                : "Get started by creating your first note!"}
            </p>
            {Object.keys(filters).length === 0 && (
              <Link to="/notes/new" className="btn btn-primary">
                <Plus size={20} /> Create Note
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map(note => (
              <NoteCard key={note._id} note={note} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="btn-group">
                <button className="btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>«</button>
                {[...Array(pagination.pages)].map((_, index) => {
                  const page = index + 1;
                  const isActive = page === currentPage;
                  const shouldShow = page === 1 || page === pagination.pages || Math.abs(page - currentPage) <= 2;
                  if (!shouldShow) {
                    if (page === currentPage - 3 || page === currentPage + 3) return <button key={page} className="btn btn-disabled">...</button>;
                    return null;
                  }
                  return <button key={page} className={`btn ${isActive ? 'btn-active' : ''}`} onClick={() => handlePageChange(page)}>{page}</button>;
                })}
                <button className="btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.pages}>»</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NotesPage;
