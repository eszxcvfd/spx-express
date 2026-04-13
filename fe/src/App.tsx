import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/orders/OrdersPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import InboundsPage from './pages/inbounds/InboundsPage';
import InboundDetailPage from './pages/inbounds/InboundDetailPage';
import OutboundsPage from './pages/outbounds/OutboundsPage';
import OutboundDetailPage from './pages/outbounds/OutboundDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout>
              <OrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbounds"
        element={
          <ProtectedRoute>
            <Layout>
              <InboundsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbounds/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <InboundDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/outbounds"
        element={
          <ProtectedRoute>
            <Layout>
              <OutboundsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/outbounds/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OutboundDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
