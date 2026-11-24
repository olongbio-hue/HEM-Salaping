import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { getStudents, getHemMeetings } from '../services/dataService';
import { evaluateAllStudentsRisk } from '../services/dropoutEngine';
import { Student } from '../types';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Scale,
  AlertTriangle,
  Users
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenResetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenResetModal }) => {
  const navigate = useNavigate();
  const { currentUser, allUsers, loginAsDemoUser, logout } = useAuth();
  const { isOnline, theme, toggleTheme, rules, showToast } = useSchool();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Global Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [studentsCache, setStudentsCache] = useState<Student[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<{ id: string; title: string; subtitle: string; to: string; level: 'high' | 'med' }[]>([]);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadNavbarData() {
      try {
        const [stList, mtList] = await Promise.all([getStudents(), getHemMeetings()]);
        if (!mounted) return;
        setStudentsCache(stList);

        const risks = evaluateAllStudentsRisk(stList, [], rules).filter(
          r => r.riskTier === 'amaran3' || r.riskTier === 'amaran2'
        );
        const pendingTasks = mtList.flatMap(m =>
          m.tindakanSusulan
            .filter(t => t.status !== 'selesai')
            .map(t => ({
              id: t.id,
              title: t.perkara,
              subtitle: `Amanah ${m.bilangan} • ${t.namaTindakanOleh}`,
              to: '/program-mesyuarat',
              level: 'med' as const
            }))
        );

        const riskAlerts = risks.slice(0, 4).map(r => ({
          id: r.student.id,
          title: `${r.student.nama} (${r.student.kelas})`,
          subtitle: `${r.consecutiveAbsences} hari berturut tidak hadir`,
          to: '/risiko-cicir',
          level: 'high' as const
        }));

        setUrgentAlerts([...riskAlerts, ...pendingTasks.slice(0, 3)]);
      } catch {
        // Silent fail on navbar cache
      }
    }
    loadNavbarData();
    return () => {
      mounted = false;
    };
  }, [rules]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
        setShowUserMenu(false);
        setShowAlertsMenu(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showToast('Paparan skrin penuh tidak disokong pada pelayar ini.', 'info');
    }
  };

  const matchedStudents = searchQuery.trim().length >= 2
    ? studentsCache
        .filter(
          s =>
            s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.noKP.includes(searchQuery.trim())
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchFocused(false);
    navigate(`/murid?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-30 lg:pl-64 bg-white dark:bg-[#1c2337] border-b border-slate-200 dark:border-white/5 transition-colors"
    >
      <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Kiri: Menu Toggle + Bar Carian Global */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 dark:text-[#0ea5e9] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#26304a] rounded-xl transition-colors lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Cari murid, kelas atau No. KP..."
              className="w-full h-9 pl-3.5 pr-9 rounded-xl bg-slate-100 dark:bg-[#26304a] text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-transparent focus:border-[#0ea5e9] focus:outline-hidden transition-colors"
            />
            <button
              type="submit"
              aria-label="Cari"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0ea5e9]"
            >
              <Search className="w-4 h-4" />
            </button>

            {searchFocused && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-[#222b42] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1.5 z-50">
                {matchedStudents.length > 0 ? (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Padanan Murid
                    </div>
                    {matchedStudents.map(stu => (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          setSearchQuery('');
                          navigate(`/murid/${stu.id}`);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-[#2b3652] flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {stu.nama}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-[#151c2e] text-sky-700 dark:text-sky-300 font-medium shrink-0">
                          {stu.kelas}
                        </span>
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="w-full text-center py-2 text-[11px] font-bold text-[#0ea5e9] border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#2b3652]"
                    >
                      Lihat semua hasil carian di Senarai Murid →
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Tekan Enter untuk cari "{searchQuery}" dalam direktori murid.</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Kanan: Ikon Utiliti, Status & Profil Pengguna */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#0ea5e9] hover:bg-slate-100 dark:hover:bg-[#26304a] transition-colors"
            title={theme === 'dark' ? 'Tukar ke Mod Cerah' : 'Tukar ke Mod Gelap'}
            aria-label="Tukar tema paparan"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifikasi & Tindakan Segera */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertsMenu(prev => !prev);
                setShowRoleMenu(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-[#0ea5e9] hover:bg-slate-100 dark:hover:bg-[#26304a] transition-colors"
              title="Pemberitahuan & Tindakan HEM"
              aria-label="Pemberitahuan"
            >
              <Bell className="w-[18px] h-[18px]" />
              {urgentAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff3e6c]" />
              )}
            </button>

            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#222b42] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Amaran & Amanah HEM
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 tabular-nums">
                    {urgentAlerts.length}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {urgentAlerts.length > 0 ? (
                    urgentAlerts.map(alert => (
                      <button
                        key={alert.id}
                        onClick={() => {
                          setShowAlertsMenu(false);
                          navigate(alert.to);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#293450] flex items-start gap-2.5 transition-colors"
                      >
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            alert.level === 'high' ? 'text-[#ff3e6c]' : 'text-[#ffc107]'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {alert.subtitle}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                      Tiada amaran kritikal buat masa ini.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Segerak Dalam/Luar Talian */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
            }`}
            title={isOnline ? 'Sambungan Firestore Aktif' : 'Mod Simpanan Luar Talian Aktif'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{isOnline ? 'Dalam Talian' : 'Luar Talian'}</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="hidden md:flex p-2 rounded-xl text-[#0ea5e9] hover:bg-slate-100 dark:hover:bg-[#26304a] transition-colors"
            title={isFullscreen ? 'Keluar Skrin Penuh' : 'Skrin Penuh'}
            aria-label="Skrin penuh"
          >
            {isFullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
          </button>

          {/* Tukar Peranan Cepat */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(prev => !prev);
                setShowUserMenu(false);
                setShowAlertsMenu(false);
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-[#26304a] hover:bg-slate-200 dark:hover:bg-[#2f3b5c] text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 transition-colors"
              title="Tukar pengguna bertugas"
            >
              <span className="text-[11px] font-bold text-[#0ea5e9]">
                {currentUser?.peranan[0] ? currentUser.peranan[0].replace('_', ' ').toUpperCase() : 'PILIH'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#222b42] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Tukar Pengguna Bertugas</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Pilih staf/guru berdaftar:</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-[#151c2e] text-[#0ea5e9] tabular-nums">
                    {allUsers.length} Staf
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {allUsers.map(user => {
                    const isSelected = currentUser?.uid === user.uid;
                    return (
                      <button
                        key={user.uid}
                        onClick={() => {
                          loginAsDemoUser(user.uid);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#293450] transition-colors ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-[#161e31] text-sky-700 dark:text-[#0ea5e9] font-semibold'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold truncate">{user.nama}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {user.jawatan || user.peranan.join(', ').toUpperCase()}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0ea5e9] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      navigate('/tetapan?tab=pengguna');
                    }}
                    className="w-full py-1.5 text-center text-[11px] font-bold text-[#0ea5e9] bg-sky-50 dark:bg-[#161e31] rounded-lg hover:opacity-90"
                  >
                    + Urus Staf di Tetapan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profil Pengguna (Nama + Peranan + Avatar bulat) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(prev => !prev);
                setShowRoleMenu(false);
                setShowAlertsMenu(false);
              }}
              className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#26304a] transition-colors"
              aria-label="Menu pengguna"
            >
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-xs font-bold text-slate-900 dark:text-white max-w-[130px] truncate">
                  {currentUser?.nama || 'Pengguna'}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {currentUser?.peranan[0]?.replace('_', ' ') || 'GURU'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#49ccb1] text-white flex items-center justify-center font-extrabold text-xs shadow-sm shrink-0">
                {currentUser?.nama?.slice(0, 2).toUpperCase() || 'GU'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#222b42] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser?.nama}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.emel}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {currentUser?.peranan.map(r => (
                      <RoleBadge key={r} role={r} size="sm" />
                    ))}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/manual');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#293450] flex items-center gap-2.5"
                  >
                    <BookOpen className="w-4 h-4 text-[#0ea5e9]" />
                    <span>Manual Pengguna &amp; Panduan</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/privasi');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#293450] flex items-center gap-2.5"
                  >
                    <Scale className="w-4 h-4 text-[#49ccb1]" />
                    <span>Dasar Privasi (APDP 2010)</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenResetModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#293450] flex items-center gap-2.5"
                  >
                    <RefreshCw className="w-4 h-4 text-[#ffc107]" />
                    <span>Set Semula Data Demo</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Butang Tetapan Pantas (Ikon Slider kanan sekali seperti paparan rujukan) */}
          <button
            onClick={() => navigate('/tetapan')}
            className="hidden sm:flex p-2 rounded-xl text-[#0ea5e9] hover:bg-slate-100 dark:hover:bg-[#26304a] transition-colors"
            title="Tetapan Sekolah & Sistem"
            aria-label="Tetapan"
          >
            <SlidersHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
};
