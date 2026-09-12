import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MaterialDetailPage } from './pages/MaterialDetailPage';
import { SellMaterialPage } from './pages/SellMaterialPage';
import { RequirementsPage } from './pages/RequirementsPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ContractsPage } from './pages/ContractsPageEnhanced';
import { CompanyHistoryPage } from './pages/CompanyHistoryPage';
import { LogisticsPage } from './pages/LogisticsPageEnhanced';
import { ImpactPage } from './pages/ImpactPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AssistantPage } from './pages/AssistantPage';
import { AdminDemoPage } from './pages/AdminDemoPage';
import { YourListingsPage } from './pages/YourListingsPage';

const AppLayout: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sticky & Responsive Left Sidebar */}
      <Sidebar 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          onOpenNotifications={() => setShowNotifications(true)} 
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Quick-Bar */}
      <MobileBottomNav 
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        isSidebarOpen={mobileSidebarOpen}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

const ProtectedAppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <AppLayout />;
};

const HomeRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

          {/* Authenticated Dashboard Shell */}
          <Route element={<ProtectedAppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/sell" element={<SellMaterialPage />} />
            <Route path="/my-listings" element={<YourListingsPage />} />
            <Route path="/my-materials" element={<YourListingsPage />} />
            <Route path="/requirements" element={<RequirementsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/company" element={<CompanyHistoryPage />} />
            <Route path="/company/history" element={<CompanyHistoryPage />} />
            <Route path="/logistics" element={<LogisticsPage />} />
            <Route path="/recommendations" element={<DashboardPage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/profile" element={<CompanyHistoryPage />} />
            <Route path="/settings" element={<CompanyHistoryPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
