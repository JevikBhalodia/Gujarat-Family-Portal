import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import SchemesPage from './pages/family/SchemesPage.jsx';
import SchemeDetailPage from './pages/family/SchemeDetailPage.jsx';
import ApplicationsPage from './pages/family/ApplicationsPage.jsx';
import ManageFamilyPage from './pages/family/ManageFamilyPage.jsx';
import ProfilePage from './pages/family/ProfilePage.jsx';

import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminLookup from './pages/admin/AdminLookup.jsx';
import AdminQueries from './pages/admin/AdminQueries.jsx';

function ProtectedRoute({ children, adminOnly = false, citizenOnly = false, headOnly = false }) {
  const { user, loading, isAdmin, isHead } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-muted">
        Loading Gujarat Portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/schemes" replace />;
  }

  if (citizenOnly && isAdmin) {
    return <Navigate to="/admin/analytics" replace />;
  }

  if (headOnly && !isHead) {
    return <Navigate to="/schemes" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Login Screen (No AppShell navigation, centered on salt) */}
      <Route path="/login" element={<Login />} />

      {/* Citizen Routes */}
      <Route
        path="/schemes"
        element={
          <ProtectedRoute citizenOnly>
            <SchemesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schemes/:id"
        element={
          <ProtectedRoute citizenOnly>
            <SchemeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute citizenOnly>
            <ApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/family"
        element={
          <ProtectedRoute citizenOnly headOnly>
            <ManageFamilyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute adminOnly>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/lookup"
        element={
          <ProtectedRoute adminOnly>
            <AdminLookup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/queries"
        element={
          <ProtectedRoute adminOnly>
            <AdminQueries />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? (isAdmin ? '/admin/analytics' : '/schemes') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
