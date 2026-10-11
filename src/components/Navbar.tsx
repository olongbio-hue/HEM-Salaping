import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { DEMO_USERS } from '../constants';
import {
  Menu,
  Wifi,
  WifiOff,
  User,
  LogOut,
  ChevronDown,
  RefreshCw,
  Database,
  Building2,
  CheckCircle2,
  BookOpen,
  Scale
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { SchoolLogo } from './SchoolLogo';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenResetModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenResetModal }) => {
  const navigate = useNavigate();
  const { currentUser, loginAsDemoUser, logout } = useAuth();
  const { school, isOnline } = useSchool();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Bahagian Kiri: Menu Toggle & Identiti Sekolah */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center shrink-0">
              <SchoolLogo size="md" className="drop-shadow-xs hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  {school.nama}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {school.kodSekolah}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                HEM Digital • Kota Marudu, Sabah
              </p>
            </div>
          </div>
        </div>

        {/* Bahagian Kanan: Status & Profil Pengguna */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Luar Talian / Dalam Talian & Segerak */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
            title={
              isOnline
                ? 'Sambungan Firestore Aktif (Semua transaksi terkini disegerakkan)'
                : 'Data disimpan secara setempat (IndexedDB/Cache), akan disegerakkan sebaik sahaja internet pulih'
            }
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline font-semibold">Dalam Talian</span>
                <span className="hidden lg:inline text-[10px] text-emerald-600 font-bold border-l border-emerald-200 pl-1.5">
                  Segerak: 0 giliran
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="font-bold text-[11px] text-amber-900">
                  Luar Talian <span className="hidden xl:inline font-normal text-amber-700">• Baris Gilir: Tempatan</span>
                </span>
              </>
            )}
          </div>

          {/* Lencana DATA DEMO */}
          <div className="flex items-center">
            <button
              onClick={onOpenResetModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 rounded-full hover:bg-amber-200 transition-colors shadow-xs"
              title="Klik untuk set semula data demo SMK Salaping"
            >
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>DATA DEMO</span>
            </button>
          </div>

          {/* Dropdown Tukar Peranan Cepat (Untuk Pengujian Pantas Persona Guru/HEM) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            >
              <span className="hidden lg:inline text-slate-500">Peranan:</span>
              <span className="font-semibold text-blue-900">
                {currentUser?.peranan[0] ? currentUser.peranan[0].toUpperCase() : 'PILIH'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Tukar Peranan Pengguna Demo</p>
                  <p className="text-[11px] text-slate-500">Pilih peranan untuk menguji kebenaran modul:</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {DEMO_USERS.map((demo) => {
                    const isSelected = currentUser?.uid === demo.uid;
                    return (
                      <button
                        key={demo.uid}
                        onClick={() => {
                          loginAsDemoUser(demo.uid);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900">{demo.nama}</div>
                          <div className="text-[11px] text-slate-500">{demo.jawatan}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profil Pengguna Semasa & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Menu pengguna"
            >
              <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                {currentUser?.nama?.slice(0, 2).toUpperCase() || 'GU'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.nama}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.emel}</p>
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
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Manual Pengguna &amp; UAT</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/privasi');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span>Dasar Privasi (APDP 2010)</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenResetModal();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                    <span>Set Semula Data Demo</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
