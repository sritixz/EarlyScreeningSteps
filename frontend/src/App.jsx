import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ScreeningDetail from './pages/ScreeningDetail.jsx';

import ParentDashboard from './pages/parent/Dashboard.jsx';
import NewScreening from './pages/parent/NewScreening.jsx';

import Worklist from './pages/reviewer/Worklist.jsx';
import ReviewScreening from './pages/reviewer/ReviewScreening.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import ReviewerApplications from './pages/admin/ReviewerApplications.jsx';
import UrgentDashboard from './pages/admin/UrgentDashboard.jsx';

function Home() {
  const { user } = useAuth();
  if (user.role === 'parent') return <ParentDashboard />;
  if (user.role === 'reviewer') return <Worklist />;
  return <AdminDashboard />;
}

function ScreeningRoute() {
  const { user } = useAuth();
  return user.role === 'reviewer' ? <ReviewScreening /> : <ScreeningDetail />;
}

export default function App() {
  const { initializing } = useAuth();

  if (initializing) return null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/screenings/new"
        element={
          <ProtectedRoute roles={['parent']}>
            <Layout>
              <NewScreening />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/screenings/:id"
        element={
          <ProtectedRoute roles={['parent', 'reviewer', 'admin']}>
            <Layout>
              <ScreeningRoute />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <ReviewerApplications />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/urgent"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <UrgentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
