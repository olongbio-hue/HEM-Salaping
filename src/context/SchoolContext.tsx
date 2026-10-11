import React, { createContext, useContext, useState, useEffect } from 'react';
import { SchoolSettings, RulesSettings, DashboardSettings } from '../types';
import { INITIAL_SCHOOL_SETTINGS, INITIAL_RULES_SETTINGS, DEFAULT_DASHBOARD_SETTINGS } from '../constants';
import {
  getSchoolSettings,
  saveSchoolSettings,
  getRulesSettings,
  saveRulesSettings,
  getDashboardSettings,
  saveDashboardSettings
} from '../services/dataService';
import { useAuth } from './AuthContext';

interface SchoolContextType {
  school: SchoolSettings;
  rules: RulesSettings;
  dashboardSettings: DashboardSettings;
  loading: boolean;
  isOnline: boolean;
  lowDataMode: boolean;
  toggleLowDataMode: () => void;
  updateSchool: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  updateRules: (newRules: Partial<RulesSettings>) => Promise<void>;
  updateDashboardSettings: (newSettings: Partial<DashboardSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [school, setSchool] = useState<SchoolSettings>(INITIAL_SCHOOL_SETTINGS);
  const [rules, setRules] = useState<RulesSettings>(INITIAL_RULES_SETTINGS);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(DEFAULT_DASHBOARD_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    return localStorage.getItem('hem_low_data_mode') === 'true';
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const toggleLowDataMode = () => {
    setLowDataMode(prev => {
      const next = !prev;
      localStorage.setItem('hem_low_data_mode', String(next));
      if (next) {
        document.documentElement.classList.add('low-data-mode');
        showToast('Mod Capaian Rendah diaktifkan: Imej dan animasi dihadkan untuk menjimatkan kuota internet Sabah.', 'info');
      } else {
        document.documentElement.classList.remove('low-data-mode');
        showToast('Mod Paparan Penuh biasa diaktifkan.', 'info');
      }
      return next;
    });
  };

  useEffect(() => {
    if (lowDataMode) {
      document.documentElement.classList.add('low-data-mode');
    } else {
      document.documentElement.classList.remove('low-data-mode');
    }
  }, [lowDataMode]);

  const { currentUser } = useAuth();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Sambungan internet dipulihkan. Segerak dalam talian aktif.', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Tiada internet. Beralih ke mod simpanan luar talian secara automatik.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSettings = async () => {
    try {
      const [sData, rData, dData] = await Promise.all([
        getSchoolSettings(),
        getRulesSettings(),
        getDashboardSettings()
      ]);
      setSchool(sData);
      setRules(rData);
      setDashboardSettings(dData);

      // Kemaskini pembolehubah CSS dinamik sekolah
      if (sData.warnaUtama) {
        document.documentElement.style.setProperty('--primary-color', sData.warnaUtama);
      }
      if (sData.warnaAksen) {
        document.documentElement.style.setProperty('--accent-color', sData.warnaAksen);
      }
    } catch (err) {
      console.error('Ralat memuatkan tetapan sekolah:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSchool = async (newSettings: Partial<SchoolSettings>) => {
    const updated: SchoolSettings = { ...school, ...newSettings };
    setSchool(updated);
    if (updated.warnaUtama) {
      document.documentElement.style.setProperty('--primary-color', updated.warnaUtama);
    }
    const operator = currentUser || { uid: 'system', nama: 'Pentadbir' };
    await saveSchoolSettings(updated, { uid: operator.uid, nama: operator.nama });
    showToast('Tetapan sekolah berjaya dikemaskini.', 'success');
  };

  const updateRules = async (newRules: Partial<RulesSettings>) => {
    const updated: RulesSettings = { ...rules, ...newRules };
    setRules(updated);
    const operator = currentUser || { uid: 'system', nama: 'Pentadbir' };
    await saveRulesSettings(updated, { uid: operator.uid, nama: operator.nama });
    showToast('Ambang risiko cicir dan peraturan berjaya dikemaskini.', 'success');
  };

  const updateDashboardSettings = async (newSettings: Partial<DashboardSettings>) => {
    const updated: DashboardSettings = {
      ...dashboardSettings,
      ...newSettings,
      kpiCards: {
        ...dashboardSettings.kpiCards,
        ...(newSettings.kpiCards || {})
      }
    };
    setDashboardSettings(updated);
    const operator = currentUser || { uid: 'system', nama: 'Pentadbir' };
    await saveDashboardSettings(updated, { uid: operator.uid, nama: operator.nama });
    showToast('Konfigurasi paparan Dashboard berjaya dikemaskini!', 'success');
  };

  return (
    <SchoolContext.Provider
      value={{
        school,
        rules,
        dashboardSettings,
        loading,
        isOnline,
        lowDataMode,
        toggleLowDataMode,
        updateSchool,
        updateRules,
        updateDashboardSettings,
        refreshSettings,
        toast,
        showToast
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool mesti digunakan di dalam SchoolProvider');
  return ctx;
};
