import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  HeartHandshake,
  Award,
  Home,
  FileText,
  Settings,
  X,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Zap,
  ZapOff,
  HeartPulse,
  CalendarDays,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResetModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenResetModal }) => {
  const { currentUser, isPengetuaOrGpkHem, canViewCounseling, canManageDiscipline, canManageAssistance, canManageHostel, canManageUsers } = useAuth();
  const { school, lowDataMode, toggleLowDataMode } = useSchool();

  const canViewBullyingCPP =
    isPengetuaOrGpkHem ||
    currentUser?.peranan.includes('ketua_guru_disiplin') ||
    currentUser?.peranan.includes('guru_disiplin') ||
    currentUser?.peranan.includes('gbk') ||
    false;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard Utama',
      icon: LayoutDashboard,
      show: true,
      badge: undefined
    },
    {
      to: '/kehadiran',
      label: 'Kehadiran Harian',
      icon: CalendarCheck,
      show: true,
      badge: 'Harian'
    },
    {
      to: '/risiko-cicir',
      label: 'Murid Berisiko Cicir',
      icon: AlertTriangle,
      show: true,
      badge: 'SOP 1:3:7'
    },
    {
      to: '/murid',
      label: 'Pengurusan Murid',
      icon: Users,
      show: true,
      badge: undefined
    },
    {
      to: '/disiplin',
      label: 'Disiplin & Sahsiah',
      icon: ShieldAlert,
      show: canManageDiscipline || true // all teachers can submit referrals
    },
    {
      to: '/buli-cpp',
      label: 'Buli & Perlindungan (CPP)',
      icon: ShieldCheck,
      show: canViewBullyingCPP,
      badge: 'KPM'
    },
    {
      to: '/kaunseling',
      label: 'Bimbingan & Kaunseling',
      icon: HeartHandshake,
      show: canViewCounseling,
      badge: 'Sulit'
    },
    {
      to: '/bantuan',
      label: 'Biasiswa & Bantuan',
      icon: Award,
      show: canManageAssistance || isPengetuaOrGpkHem
    },
    {
      to: '/asrama',
      label: 'Asrama Desa',
      icon: Home,
      show: (canManageHostel || isPengetuaOrGpkHem) && school.modulAsramaAktif !== false
    },
    {
      to: '/3k',
      label: 'Kesihatan, Keselamatan & 3K',
      icon: HeartPulse,
      show: true,
      badge: '3K'
    },
    {
      to: '/pengawas',
      label: 'Badan Pengawas',
      icon: CheckSquare,
      show: true,
      badge: undefined
    },
    {
      to: '/program-mesyuarat',
      label: 'Program & Mesyuarat HEM',
      icon: CalendarDays,
      show: true,
      badge: 'Takwim'
    },
    {
      to: '/audit',
      label: 'Log Audit Keselamatan',
      icon: FileText,
      show: isPengetuaOrGpkHem
    },
    {
      to: '/tetapan',
      label: 'Tetapan Sekolah & Rules',
      icon: Settings,
      show: canManageUsers || isPengetuaOrGpkHem
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Sidebar */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              H
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">HEM Digital</span>
              <p className="text-[10px] text-blue-400 font-medium -mt-1">{school.kodSekolah} • SMK Salaping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30 shrink-0">
              {currentUser?.nama?.slice(0, 2).toUpperCase() || 'GU'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser?.nama}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">
                {currentUser?.peranan[0]?.replace('_', ' ')}
              </p>
            </div>
          </div>
          {currentUser?.kelasDiajar && currentUser.kelasDiajar.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Guru Kelas:</span>
              <span className="text-amber-400 font-medium">{currentUser.kelasDiajar.join(', ').toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Modul Utama
          </div>

          {navItems
            .filter(item => item.show)
            .map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {/* Mod Capaian Rendah (Low Data Mode - Sabah Rural Friendly) */}
          <button
            onClick={toggleLowDataMode}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
              lowDataMode
                ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Jimatkan kuota selular & lajukan sistem di kawasan internet luar bandar"
          >
            <div className="flex items-center gap-2">
              {lowDataMode ? <Zap className="w-3.5 h-3.5 text-emerald-400" /> : <ZapOff className="w-3.5 h-3.5 text-slate-400" />}
              <span>Mod Data Rendah</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${lowDataMode ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-700 text-slate-300'}`}>
              {lowDataMode ? 'AKTIF' : 'PADAM'}
            </span>
          </button>

          {/* Borang Awam Aduan Buli Portal Link */}
          <NavLink
            to="/aduan-buli"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/40 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Portal Awam Aduan Buli</span>
            </div>
            <ExternalLink className="w-3 h-3 text-rose-400" />
          </NavLink>

          <button
            onClick={onOpenResetModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Set Semula Data Demo</span>
          </button>

          <div className="text-[10px] text-center text-slate-500">
            HEM Digital v2.0 • Sabah Offline-First
          </div>
        </div>
      </aside>
    </>
  );
};
