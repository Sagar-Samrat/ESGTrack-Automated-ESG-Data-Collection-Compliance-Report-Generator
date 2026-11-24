import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportingYearProvider } from './context/ReportingYearContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DataUpload from './pages/DataUpload';
import DataManagement from './pages/DataManagement';
import Environmental from './pages/Environmental';
import Social from './pages/Social';
import Governance from './pages/Governance';
import ESGAnalytics from './pages/ESGAnalytics';
import AIReportGenerator from './pages/AIReportGenerator';
import ComplianceCenter from './pages/ComplianceCenter';
import ReportsHistory from './pages/ReportsHistory';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
        Verifying corporate credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReportingYearProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Enterprise Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<DataUpload />} />
              <Route path="data-management" element={<DataManagement />} />
              <Route path="environmental" element={<Environmental />} />
              <Route path="social" element={<Social />} />
              <Route path="governance" element={<Governance />} />
              <Route path="analytics" element={<ESGAnalytics />} />
              <Route path="reports/generate" element={<AIReportGenerator />} />
              <Route path="compliance" element={<ComplianceCenter />} />
              <Route path="reports/history" element={<ReportsHistory />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ReportingYearProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

