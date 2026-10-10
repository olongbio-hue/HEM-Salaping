import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { ResetDemoModal } from './components/ResetDemoModal';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { Attendance } from './pages/Attendance';
import { DropoutRisk } from './pages/DropoutRisk';
import { Discipline } from './pages/Discipline';
import { BullyingCPP } from './pages/BullyingCPP';
import { PublicBullyingReport } from './pages/PublicBullyingReport';
import { Counseling } from './pages/Counseling';
import { Assistance } from './pages/Assistance';
import { Hostel } from './pages/Hostel';
import { HealthSafety3K } from './pages/HealthSafety3K';
import { Prefects } from './pages/Prefects';
import { HemProgramsMeetings } from './pages/HemProgramsMeetings';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';
import { DataPrivacy } from './pages/DataPrivacy';
import { HelpManual } from './pages/HelpManual';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';

// Toast Notification
const ToastNotification: React.FC = () => {
  const { toast } = useSchool();
  if (!toast) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
      <div
        className={`px-4 py-3 rounded-xl shadow-xl text-xs font-bold border flex items-center gap-2 ${
          toast.type === 'error'
            ? 'bg-red-900 text-white border-red-800'
            : toast.type === 'info'
            ? 'bg-blue-900 text-white border-blue-800'
            : 'bg-emerald-900 text-white border-emerald-800'
        }`}
      >
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

// Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-medium">
        Memuatkan sesi pengguna...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main App Layout
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onOpenResetModal={() => setResetModalOpen(true)}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenResetModal={() => setResetModalOpen(true)}
        />

        <main className="flex-1 lg:pl-64 min-w-0 transition-all">
          <Routes key={refreshKey}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/murid" element={<Students />} />
            <Route path="/murid/:id" element={<StudentDetail />} />
            <Route path="/kehadiran" element={<Attendance />} />
            <Route path="/risiko-cicir" element={<DropoutRisk />} />
            <Route path="/disiplin" element={<Discipline />} />
            <Route path="/buli-cpp" element={<BullyingCPP />} />
            <Route path="/aduan-buli" element={<PublicBullyingReport />} />
            <Route path="/kaunseling" element={<Counseling />} />
            <Route path="/bantuan" element={<Assistance />} />
            <Route path="/asrama" element={<Hostel />} />
            <Route path="/3k" element={<HealthSafety3K />} />
            <Route path="/pengawas" element={<Prefects />} />
            <Route path="/program-mesyuarat" element={<HemProgramsMeetings />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/tetapan" element={<Settings onOpenResetModal={() => setResetModalOpen(true)} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <BottomNav onOpenSidebar={() => setSidebarOpen(true)} />

      <ResetDemoModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />

      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SchoolProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/aduan-buli" element={<PublicBullyingReport />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SchoolProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
