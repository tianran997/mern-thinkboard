import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { notesApi } from '../../services/api';
import { useDebounce } from 'use-debounce'; // npm install use-debounce

const SearchAndFilter = ({ onFiltersChange, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [selectedTags, setSelectedTags] = useState(initialFilters.tags || []);
  const [category, setCategory] = useState(initialFilters.category || '');
  const [priority, setPriority] = useState(initialFilters.priority || '');
  const [isFavorite, setIsFavorite] = useState(initialFilters.isFavorite || '');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'lastModified');
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || 'desc');
  const [availableTags, setAvailableTags] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || ''
  });

  // 防止 filters 每次渲染都生成新对象
  const filtersMemo = useMemo(() => ({
    search: searchTerm,
    tags: selectedTags.map(tag => tag.value),
    category,
    priority,
    isFavorite: isFavorite === '' ? undefined : isFavorite === 'true',
    sortBy,
    sortOrder,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  }), [searchTerm, selectedTags, category, priority, isFavorite, sortBy, sortOrder, dateRange]);

  const [debouncedFilters] = useDebounce(filtersMemo, 500); // 500ms 防抖

  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setCategory('');
    setPriority('');
    setIsFavorite('');
    setSortBy('lastModified');
    setSortOrder('desc');
    setDateRange({ startDate: '', endDate: '' });
    setShowAdvanced(false);
  };

  const hasActiveFilters = searchTerm || selectedTags.length > 0 || category || priority || isFavorite || dateRange.startDate || dateRange.endDate;

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'study', label: 'Study' },
    { value: 'project', label: 'Project' },
    { value: 'other', label: 'Other' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const favoriteOptions = [
    { value: '', label: 'All Notes' },
    { value: 'true', label: 'Favorites Only' },
    { value: 'false', label: 'Non-Favorites' }
  ];

  const sortOptions = [
    { value: 'lastModified', label: 'Last Modified' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' }
  ];

  return (
    <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300 mb-6">
      {/* Search Bar */}
      <div className="flex gap-4 items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={20} />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn btn-outline ${showAdvanced ? 'btn-primary' : ''}`}
        >
          <Filter size={20} />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="btn btn-ghost btn-sm text-error"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4">
          {/* Tags */}
          <div>
            <label className="label">
              <span className="label-text">Tags</span>
            </label>
            <Select
              isMulti
              options={availableTags}
              value={selectedTags}
              onChange={setSelectedTags}
              placeholder="Select tags..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
          </div>

          {/* Category, Priority, Favorite */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select select-bordered w-full"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Priority</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select select-bordered w-full"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Favorites</span>
              </label>
              <select
                value={isFavorite}
                onChange={(e) => setIsFavorite(e.target.value)}
                className="select select-bordered w-full"
              >
                {favoriteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="input input-bordered w-full"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={20} />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="input input-bordered w-full"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50" size={20} />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Sort By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-bordered w-full"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">Order</span>
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="badge badge-primary">
              Search: {searchTerm}
            </span>
          )}
          {selectedTags.map(tag => (
            <span key={tag.value} className="badge badge-secondary">
              {tag.label}
            </span>
          ))}
          {category && (
            <span className="badge badge-accent">
              Category: {category}
            </span>
          )}
          {priority && (
            <span className="badge badge-info">
              Priority: {priority}
            </span>
          )}
          {isFavorite !== '' && (
            <span className="badge badge-warning">
              {isFavorite === 'true' ? 'Favorites' : 'Non-Favorites'}
            </span>
          )}
          {dateRange.startDate && (
            <span className="badge badge-outline">
              From: {dateRange.startDate}
            </span>
          )}
          {dateRange.endDate && (
            <span className="badge badge-outline">
              To: {dateRange.endDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;