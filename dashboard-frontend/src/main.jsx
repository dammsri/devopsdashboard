import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; 
import { PreferencesProvider } from './context/PreferencesContext';
import { ProtectedRoute, RoleGuard } from './routes/guards';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardHome from './pages/DashboardHome';
import ApplicationsIndex from './pages/ApplicationsIndex';
import ApplicationDetail from './pages/ApplicationDetail';
import EnvironmentSummary from './pages/EnvironmentSummary';
import InfrastructureIndex from './pages/InfrastructureIndex';
import InfrastructureCategoryDetail from './pages/InfrastructureCategoryDetail';
import InfrastructureServerList from './pages/InfrastructureServerList';
import SKEEnvironmentsIndex from './pages/SKEEnvironmentsIndex';
import SKEEnvironmentServiceGrid from './pages/SKEEnvironmentServiceGrid';
import SKEServiceDetail from './pages/SKEServiceDetail';
import ApplicationSummary from './pages/ApplicationSummary';
import MonitoringPlaceholder from './pages/MonitoringPlaceholder';
import SettingsDashboard from './pages/SettingsDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import logger from './utils/logger';
import './index.css';

// ── Startup Log ─────────────────────────────────────────────────────────────
logger.info('🚀 DevOps Dashboard Frontend Starting...', {
    version: '1.2.0',
    env: import.meta.env.MODE,
    screen: `${window.innerWidth}x${window.innerHeight}`
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<DashboardHome />} />
              
              {/* Summary Dashboard (Aggregated View) */}
              <Route path="summary/:itamId" element={<ApplicationSummary />} />

              {/* Applications & Environments (Honeycombs Level 1/2) */}
              <Route path="applications" element={<ApplicationsIndex />} />
              <Route path="applications/:appId" element={<ApplicationDetail />} />
              <Route path="applications/:appId/environments/:envId" element={<EnvironmentSummary />} />
              
              {/* Infrastructure (Honeycombs Level 1/2/3) */}
              <Route path="infrastructure" element={<InfrastructureIndex />} />
              <Route path="infrastructure/:category" element={<InfrastructureCategoryDetail />} />
              <Route path="infrastructure/:category/:appId" element={<InfrastructureServerList />} />
              
              {/* SKE Environments (Honeycombs Level 1/2/3) */}
              <Route path="skeenvironments" element={<SKEEnvironmentsIndex />} />
              <Route path="skeenvironments/:skeEnvId" element={<SKEEnvironmentServiceGrid />} />
              <Route path="skeenvironments/:skeEnvId/services/:serviceId" element={<SKEServiceDetail />} />

              {/* Monitoring (Analytics/Metrics/Traces) */}
              <Route path="monitoring/:type" element={<MonitoringPlaceholder />} />
              
              {/* Settings (Permissions handled internally by component) */}
              <Route path="settings" element={<SettingsDashboard />} />
              <Route path="settings/:category" element={<SettingsDashboard />} />

            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
        </PreferencesProvider>
      </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
