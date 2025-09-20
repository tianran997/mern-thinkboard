import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  verifyToken: (token) => api.get('/auth/verify-token', {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// Notes API
export const notesApi = {
  getNotes: (params) => api.get('/notes', { params }),
  getNote: (id) => api.get(`/notes/${id}`),
  createNote: (noteData) => api.post('/notes', noteData),
  updateNote: (id, noteData) => api.put(`/notes/${id}`, noteData),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  
  // Tags
  getTags: () => api.get('/notes/tags'),
  
  // Attachments
  uploadAttachments: (noteId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    return api.post(`/notes/${noteId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAttachment: (noteId, attachmentId) => 
    api.delete(`/notes/${noteId}/attachments/${attachmentId}`),
  downloadAttachment: (noteId, attachmentId) => 
    api.get(`/notes/${noteId}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    }),
  
  // Versions
  getVersions: (noteId) => api.get(`/notes/${noteId}/versions`),
  restoreVersion: (noteId, versionNumber) => 
    api.post(`/notes/${noteId}/versions/${versionNumber}/restore`),
  
  // Sharing
  createShareLink: (noteId, options) => 
    api.post(`/notes/${noteId}/share`, options),
  getSharedNote: (token) => api.get(`/notes/shared/${token}`),
  
  // Reminders
  addReminder: (noteId, reminderData) => 
    api.post(`/notes/${noteId}/reminders`, reminderData),
  updateReminder: (noteId, reminderId, data) => 
    api.put(`/notes/${noteId}/reminders/${reminderId}`, data)
};

// Reminders API
export const remindersApi = {
  getUpcoming: (limit) => api.get('/reminders/upcoming', { params: { limit } }),
  getToday: () => api.get('/reminders/today')
};

// Search function
export const searchNotes = (query, filters = {}) => {
  const params = {
    search: query,
    ...filters
  };
  
  return notesApi.getNotes(params);
};

export default api;