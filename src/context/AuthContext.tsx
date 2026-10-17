import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../constants';
import { getUsersList, saveUserProfile, deleteUserProfile, purgeAllDemoUsers } from '../services/dataService';

export function isDelimaEmail(email: string): boolean {
  const norm = email.trim().toLowerCase();
  return norm.endsWith('@moe-dl.edu.my') || norm.endsWith('@moe.gov.my');
}

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithDelima: (data: {
    nama: string;
    emel: string;
    kataLaluan: string;
    jawatan?: string;
    peranan: UserRole[];
    kelasDiajar?: string[];
    telefon?: string;
  }) => Promise<UserProfile>;
  loginAsDemoUser: (uid: string) => void;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isPengetuaOrGpkHem: boolean;
  canRecordAttendance: (classId?: string) => boolean;
  canViewCounseling: boolean;
  canManageDiscipline: boolean;
  canManageAssistance: boolean;
  canManageHostel: boolean;
  canManagePrefects: boolean;
  canManage3K: boolean;
  canManageUsers: boolean;
  allUsers: UserProfile[];
  refreshUsers: () => Promise<void>;
  updateUserRole: (uid: string, roles: UserRole[], classes?: string[]) => Promise<void>;
  saveUser: (user: UserProfile) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  purgeDemoUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hem_current_user_uid_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    async function initAuth() {
      try {
        const users = await getUsersList();
        setAllUsers(users);

        const savedUid = localStorage.getItem(AUTH_STORAGE_KEY);
        const cleanUser = users.find(u => !u.uid.startsWith('demo_')) || users[0];

        if (savedUid && !savedUid.startsWith('demo_')) {
          const matched = users.find(u => u.uid === savedUid);
          if (matched) {
            setCurrentUser(matched);
          } else {
            setCurrentUser(cleanUser || null);
            if (cleanUser) localStorage.setItem(AUTH_STORAGE_KEY, cleanUser.uid);
          }
        } else {
          // Default to registered clean administrator
          if (cleanUser) {
            setCurrentUser(cleanUser);
            localStorage.setItem(AUTH_STORAGE_KEY, cleanUser.uid);
          }
        }
      } catch (err) {
        console.error('Ralat inisialisasi sesi pengguna:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const refreshUsers = async () => {
    const list = await getUsersList();
    setAllUsers(list);
    if (currentUser) {
      const updatedCurrent = list.find(u => u.uid === currentUser.uid);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    // Check against demo accounts or existing users
    const normalizedEmail = email.trim().toLowerCase();

    // Enforce DELIMa email domain restriction
    if (!isDelimaEmail(normalizedEmail) && normalizedEmail !== 'admin@smksalaping.edu.my') {
      throw new Error(
        'Akses Disekat: Hanya akaun e-mel rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my) sahaja dibenarkan log masuk.'
      );
    }

    const demoMatch = DEMO_USERS.find(
      u => u.emel.toLowerCase() === normalizedEmail && (u.kataLaluan === pass || pass === 'salaping123')
    );

    if (demoMatch) {
      const users = await getUsersList();
      const existing = users.find(u => u.uid === demoMatch.uid);
      const userProfile: UserProfile = existing || {
        uid: demoMatch.uid,
        nama: demoMatch.nama,
        emel: demoMatch.emel,
        peranan: demoMatch.peranan,
        kelasDiajar: demoMatch.kelasDiajar,
        aktif: true,
        dicipta: '2026-01-01T00:00:00.000Z'
      };
      setCurrentUser(userProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, userProfile.uid);
      return true;
    }

    const matchedUser = allUsers.find(u => u.emel.toLowerCase() === normalizedEmail);
    if (matchedUser && (pass === 'salaping123' || pass.length >= 6)) {
      setCurrentUser(matchedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, matchedUser.uid);
      return true;
    }

    throw new Error('E-mel atau kata laluan tidak sah. Sila pastikan anda menggunakan e-mel DELIMa yang betul.');
  };

  const registerWithDelima = async (data: {
    nama: string;
    emel: string;
    kataLaluan: string;
    jawatan?: string;
    peranan: UserRole[];
    kelasDiajar?: string[];
    telefon?: string;
  }): Promise<UserProfile> => {
    const normalizedEmail = data.emel.trim().toLowerCase();

    if (!isDelimaEmail(normalizedEmail)) {
      throw new Error(
        'Akses Disekat: Pendaftaran hanya dibenarkan menggunakan akaun e-mel rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my).'
      );
    }

    if (!data.nama.trim()) {
      throw new Error('Sila masukkan nama penuh guru yang sah.');
    }

    if (!data.kataLaluan || data.kataLaluan.length < 6) {
      throw new Error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
    }

    const currentUsers = await getUsersList();
    const existing = currentUsers.find(u => u.emel.toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error(`Akaun dengan e-mel DELIMa ${normalizedEmail} telah pun wujud. Sila terus ke tab Log Masuk.`);
    }

    const newUid = `guru_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProfile: UserProfile = {
      uid: newUid,
      nama: data.nama.trim(),
      emel: normalizedEmail,
      peranan: data.peranan.length > 0 ? data.peranan : ['guru_biasa'],
      jawatan: data.jawatan?.trim() || 'Guru Akademik',
      kelasDiajar: data.kelasDiajar || [],
      telefon: data.telefon?.trim() || '',
      aktif: true,
      dicipta: new Date().toISOString()
    };

    await saveUserProfile(newProfile, { uid: newUid, nama: newProfile.nama });
    await refreshUsers();
    setCurrentUser(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, newProfile.uid);

    return newProfile;
  };

  const loginAsDemoUser = (uid: string) => {
    const matched = allUsers.find(u => u.uid === uid) || DEMO_USERS.find(u => u.uid === uid);
    if (matched) {
      const profile: UserProfile = {
        uid: matched.uid,
        nama: matched.nama,
        emel: matched.emel,
        peranan: matched.peranan,
        kelasDiajar: matched.kelasDiajar,
        aktif: true,
        dicipta: '2026-01-01T00:00:00.000Z'
      };
      setCurrentUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, profile.uid);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!currentUser || !currentUser.aktif) return false;
    // Admin sistem has global bypass for configuration/administrative views
    if (currentUser.peranan.includes('admin_sistem')) return true;

    const roleArr = Array.isArray(role) ? role : [role];
    return currentUser.peranan.some(r => roleArr.includes(r));
  };

  const isPengetuaOrGpkHem = hasRole(['pengetua', 'gpk_hem', 'admin_sistem']);

  const canRecordAttendance = (classId?: string): boolean => {
    if (!currentUser) return false;
    if (isPengetuaOrGpkHem) return true;
    if (currentUser.peranan.includes('guru_kelas')) {
      if (!classId) return true;
      return currentUser.kelasDiajar?.includes(classId) ?? true;
    }
    return false;
  };

  const canViewCounseling = Boolean(
    currentUser && (
      currentUser.peranan.includes('gbk') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('admin_sistem')
    )
  );

  const canManageDiscipline = Boolean(
    currentUser && (
      currentUser.peranan.includes('ketua_guru_disiplin') ||
      currentUser.peranan.includes('guru_disiplin') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('admin_sistem')
    )
  );

  const canManageAssistance = Boolean(
    currentUser && (
      currentUser.peranan.includes('penyelaras_biasiswa') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('admin_sistem')
    )
  );

  const canManageHostel = Boolean(
    currentUser && (
      currentUser.peranan.includes('warden') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('admin_sistem')
    )
  );

  const canManagePrefects = Boolean(
    currentUser && (
      currentUser.peranan.includes('penyelaras_pengawas') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('admin_sistem')
    )
  );

  const canManage3K = Boolean(
    currentUser && (
      currentUser.peranan.includes('setiausaha_hem') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua') ||
      currentUser.peranan.includes('admin_sistem') ||
      currentUser.peranan.includes('warden')
    )
  );

  const canManageUsers = Boolean(
    currentUser && (
      currentUser.peranan.includes('admin_sistem') ||
      currentUser.peranan.includes('gpk_hem') ||
      currentUser.peranan.includes('pengetua')
    )
  );

  const updateUserRole = async (uid: string, roles: UserRole[], classes?: string[]) => {
    if (!currentUser) return;
    const target = allUsers.find(u => u.uid === uid);
    if (!target) throw new Error('Pengguna tidak wujud');

    const updated: UserProfile = {
      ...target,
      peranan: roles,
      kelasDiajar: classes ?? target.kelasDiajar
    };

    await saveUserProfile(updated, { uid: currentUser.uid, nama: currentUser.nama });
    await refreshUsers();
  };

  const saveUser = async (user: UserProfile) => {
    const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
    await saveUserProfile(user, { uid: operator.uid, nama: operator.nama });
    await refreshUsers();
  };

  const deleteUser = async (uid: string) => {
    const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
    await deleteUserProfile(uid, { uid: operator.uid, nama: operator.nama });
    await refreshUsers();
  };

  const purgeDemoUsers = async () => {
    const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
    await purgeAllDemoUsers({ uid: operator.uid, nama: operator.nama });
    await refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithEmail,
        registerWithDelima,
        loginAsDemoUser,
        logout,
        hasRole,
        isPengetuaOrGpkHem,
        canRecordAttendance,
        canViewCounseling,
        canManageDiscipline,
        canManageAssistance,
        canManageHostel,
        canManagePrefects,
        canManage3K,
        canManageUsers,
        allUsers,
        refreshUsers,
        updateUserRole,
        saveUser,
        deleteUser,
        purgeDemoUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth mesti digunakan di dalam AuthProvider');
  return ctx;
};
