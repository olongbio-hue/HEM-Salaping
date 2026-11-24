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
  ExternalLink,
  Zap,
  ZapOff,
  HeartPulse,
  CalendarDays,
  CheckSquare,
  ChevronRight
} from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResetModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenResetModal }) => {
  const {
    currentUser,
    isPengetuaOrGpkHem,
    canViewCounseling,
    canManageDiscipline,
    canManageAssistance,
    canManageHostel,
    canManageUsers
  } = useAuth();
  const { school, lowDataMode, toggleLowDataMode } = useSchool();

  const canViewBullyingCPP =
    isPengetuaOrGpkHem ||
    currentUser?.peranan.includes('ketua_guru_disiplin') ||
    currentUser?.peranan.includes('guru_disiplin') ||
    currentUser?.peranan.includes('gbk') ||
    false;

  const menuUtama = [
    { to: '/', label: 'Dashboard Utama', icon: LayoutDashboard, show: true },
    { to: '/kehadiran', label: 'Kehadiran Harian', icon: CalendarCheck, show: true, badge: 'Harian' },
    { to: '/risiko-cicir', label: 'Risiko Cicir', icon: AlertTriangle, show: true, badge: '1:3:7' },
    { to: '/murid', label: 'Pengurusan Murid', icon: Users, show: true }
  ];

  const modulHem = [
    { to: '/disiplin', label: 'Disiplin & Sahsiah', icon: ShieldAlert, show: canManageDiscipline || true },
    { to: '/buli-cpp', label: 'Buli & Perlindungan', icon: ShieldCheck, show: canViewBullyingCPP, badge: 'KPM' },
    { to: '/kaunseling', label: 'Kaunseling', icon: HeartHandshake, show: canViewCounseling, badge: 'Sulit' },
    { to: '/bantuan', label: 'Biasiswa & Bantuan', icon: Award, show: canManageAssistance || isPengetuaOrGpkHem },
    { to: '/asrama', label: 'Asrama Desa', icon: Home, show: (canManageHostel || isPengetuaOrGpkHem) && school.modulAsramaAktif !== false },
    { to: '/3k', label: 'Kesihatan & 3K', icon: HeartPulse, show: true },
    { to: '/pengawas', label: 'Badan Pengawas', icon: CheckSquare, show: true },
    { to: '/program-mesyuarat', label: 'Program & Mesyuarat', icon: CalendarDays, show: true }
  ];

  const pentadbiran = [
    { to: '/audit', label: 'Log Audit', icon: FileText, show: isPengetuaOrGpkHem },
    { to: '/tetapan', label: 'Tetapan Sekolah', icon: Settings, show: canManageUsers || isPengetuaOrGpkHem }
  ];

  const renderLink = (item: { to: string; label: string; icon: any; badge?: string }) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        onClick={onClose}
        className={({ isActive }) =>
          `group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
            isActive
              ? 'bg-sky-50 text-[#0284c7] dark:bg-[#111726] dark:text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-[#94a3b8] hover:bg-slate-100 dark:hover:bg-[#252e47] hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#0ea5e9] dark:text-[#49ccb1]'
                    : 'text-slate-400 dark:text-[#64748b] group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              />
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </div>
            {item.badge ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-[#232d48] dark:text-[#49ccb1]'
                    : 'bg-slate-100 text-slate-600 dark:bg-[#252e47] dark:text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#1c2337] border-r border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Brand Lockup */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <SchoolLogo size="sm" className="drop-shadow-sm shrink-0" />
            <div className="min-w-0">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block leading-none truncate">
                HEM Digital
              </span>
              <span className="text-[10px] text-sky-600 dark:text-[#49ccb1] font-semibold block mt-1 truncate">
                {school.kodSekolah} • SMK Salaping
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg lg:hidden"
            aria-label="Tutup menu sisi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div className="space-y-1">
            {menuUtama.filter(i => i.show).map(renderLink)}
          </div>

          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
              Modul HEM
            </div>
            {modulHem.filter(i => i.show).map(renderLink)}
          </div>

          {pentadbiran.some(i => i.show) && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748b]">
                Pentadbiran
              </div>
              {pentadbiran.filter(i => i.show).map(renderLink)}
            </div>
          )}

          {/* Illustrated School Promo Card matching reference screenshot bottom-left */}
          <div className="pt-2">
            <div className="rounded-2xl bg-[#eaf4fd] dark:bg-[#e6f3fc] p-3.5 text-center shadow-sm border border-sky-100">
              <div className="mx-auto w-28 h-20 flex items-center justify-center mb-1.5">
                <svg viewBox="0 0 160 110" className="w-full h-full" aria-hidden="true">
                  <circle cx="80" cy="52" r="46" fill="#d4e8fb" />
                  {/* Left Student */}
                  <rect x="26" y="54" width="24" height="36" rx="7" fill="#ff3e6c" />
                  <circle cx="38" cy="39" r="10" fill="#f4bfa0" />
                  <path d="M28 38c0-7 20-7 20 0v-4c0-6-20-6-20 0z" fill="#1e293b" />
                  <rect x="31" y="56" width="14" height="16" rx="2" fill="#ffffff" />
                  {/* Center Student */}
                  <rect x="66" y="48" width="28" height="42" rx="8" fill="#0ea5e9" />
                  <circle cx="80" cy="32" r="11" fill="#eab08e" />
                  <path d="M69 31c0-8 22-8 22 0v-3c0-7-22-7-22 0z" fill="#0f172a" />
                  <rect x="72" y="52" width="16" height="18" rx="2" fill="#ffc107" />
                  {/* Right Student */}
                  <rect x="110" y="54" width="24" height="36" rx="7" fill="#7c3aed" />
                  <circle cx="122" cy="39" r="10" fill="#f4bfa0" />
                  <path d="M111 42c0-11 22-11 22 0z" fill="#1e293b" />
                  <rect x="114" y="58" width="16" height="14" rx="2" fill="#49ccb1" />
                  {/* Ground shadow */}
                  <ellipse cx="80" cy="95" rx="58" ry="4" fill="#bcd9f5" />
                </svg>
              </div>
              <p className="text-[12px] font-extrabold text-[#0284c7] leading-tight">
                {school.motoSekolah || 'Ilmuan Gemilang'}
              </p>
              <p className="text-[10px] font-medium text-slate-600 mt-0.5">
                {school.nama} • {school.kodSekolah}
              </p>
              <NavLink
                to="/aduan-buli"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-sky-50 text-rose-600 font-bold text-[11px] border border-sky-200 shadow-2xs transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Portal Aduan Buli</span>
                <ExternalLink className="w-3 h-3" />
              </NavLink>
            </div>
          </div>
        </div>

        {/* Footer System Utilities */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleLowDataMode}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-xl border transition-colors ${
                lowDataMode
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-500/40 dark:text-emerald-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-[#232c44] dark:border-white/5 dark:text-slate-300 dark:hover:text-white'
              }`}
              title="Jimatkan kuota internet luar bandar"
            >
              {lowDataMode ? <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <ZapOff className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate">{lowDataMode ? 'Data Jimat' : 'Mod Penuh'}</span>
            </button>

            <button
              onClick={onOpenResetModal}
              className="flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-xl border bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/20 transition-colors"
              title="Set semula atau bersihkan data demo"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Data Demo</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
