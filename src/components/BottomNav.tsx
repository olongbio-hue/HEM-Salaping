import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, AlertTriangle, Users, Menu } from 'lucide-react';

interface BottomNavProps {
  onOpenSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenSidebar }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 lg:hidden shadow-lg safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span>Utama</span>
        </NavLink>

        <NavLink
          to="/kehadiran"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <CalendarCheck className="w-5 h-5 mb-1" />
          <span>Kehadiran</span>
        </NavLink>

        <NavLink
          to="/risiko-cicir"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium transition-colors ${
              isActive ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <AlertTriangle className="w-5 h-5 mb-1" />
          <span>Cicir</span>
        </NavLink>

        <NavLink
          to="/murid"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Users className="w-5 h-5 mb-1" />
          <span>Murid</span>
        </NavLink>

        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span>Lagi</span>
        </button>
      </div>
    </nav>
  );
};
