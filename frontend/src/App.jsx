import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm } from './components/Auth/AuthForms';
import Layout from './components/Layout/Layout';
import NotesPage from './pages/NotesPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NoteViewPage from './pages/NoteViewPage';
import SharedNotePage from './pages/SharedNotePage';
import ProfilePage from './pages/ProfilePage';
import Loader from './components/UI/Loader';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loader />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterForm />
        </PublicRoute>
      }
    />
    <Route path="/shared/:token" element={<SharedNotePage />} />

    {/* Protected Routes */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Layout>
            <NotesPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/notes"
      element={
        <ProtectedRoute>
          <Layout>
            <NotesPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/notes/new"
      element={
        <ProtectedRoute>
          <Layout>
            <NoteEditorPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/note/:id"
      element={
        <ProtectedRoute>
          <Layout>
            <NoteViewPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/notes/:id"
      element={
        <ProtectedRoute>
          <Layout>
            <NoteViewPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/notes/:id/edit"
      element={
        <ProtectedRoute>
          <Layout>
            <NoteEditorPage />
          </Layout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/profile"
      element={
        <ProtectedRoute>
          <Layout>
            <ProfilePage />
          </Layout>
        </ProtectedRoute>
      }
    />

    {/* Catch all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-base-200">
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--fallback-b1, oklch(var(--b1)))',
              color: 'var(--fallback-bc, oklch(var(--bc)))',
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;