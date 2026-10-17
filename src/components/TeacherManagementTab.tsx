import React, { useState } from 'react';
import { UserProfile, UserRole, ClassInfo } from '../types';
import { ROLE_LABELS } from '../constants';
import { RoleBadge } from './RoleBadge';
import {
  saveUserProfile,
  deleteUserProfile,
  purgeAllDemoUsers
} from '../services/dataService';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Shield,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Building2,
  Briefcase
} from 'lucide-react';

interface TeacherManagementTabProps {
  allUsers: UserProfile[];
  classesList: ClassInfo[];
  currentUser: UserProfile | null;
  onRefreshUsers: () => Promise<void>;
  onSwitchUser: (uid: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeacherManagementTab: React.FC<TeacherManagementTabProps> = ({
  allUsers,
  classesList,
  currentUser,
  onRefreshUsers,
  onSwitchUser,
  showToast
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('semua');

  // Modal State: Add User
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addJawatan, setAddJawatan] = useState('');
  const [addRoles, setAddRoles] = useState<UserRole[]>(['guru_kelas']);
  const [addClasses, setAddClasses] = useState<string[]>([]);
  const [savingAdd, setSavingAdd] = useState(false);

  // Modal State: Edit User
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJawatan, setEditJawatan] = useState('');
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal State: Bulk Import Teachers
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultRole, setBulkDefaultRole] = useState<UserRole>('guru_biasa');
  const [savingBulk, setSavingBulk] = useState(false);

  // Filtered Users List
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.emel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.jawatan && user.jawatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.kelasDiajar && user.kelasDiajar.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (roleFilter !== 'semua') {
      return user.peranan.includes(roleFilter as UserRole);
    }

    return true;
  });

  // Calculate Summary Statistics
  const totalUsers = allUsers.length;
  const totalGuruKelas = allUsers.filter(u => u.peranan.includes('guru_kelas')).length;
  const totalDisiplin = allUsers.filter(u => u.peranan.includes('guru_disiplin') || u.peranan.includes('ketua_guru_disiplin')).length;
  const totalGbk = allUsers.filter(u => u.peranan.includes('gbk')).length;
  const totalWarden = allUsers.filter(u => u.peranan.includes('warden')).length;
  const demoNamesList = [
    'En. Justin Bin Moduying',
    'Pn. Masnah Binti Japar',
    'Ustaz Hafiz Bin Roslan',
    'Cik Norazimah Binti Abdullah',
    'Cikgu Elda Grace Majanil',
    'Cikgu Jerry Mojuntin',
    'Pn. Grace Liew',
    'En. Walter Gindol',
    'Ustaz Mohd Azlan'
  ];
  const demoUsersCount = allUsers.filter(u => u.uid.startsWith('demo_') || demoNamesList.includes(u.nama)).length;

  // Handle Add Single Teacher
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      showToast('Sila masukkan nama penuh guru.', 'error');
      return;
    }

    const email = addEmail.trim()
      ? addEmail.trim().toLowerCase()
      : `${addName.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@smksalaping.edu.my`;

    try {
      setSavingAdd(true);
      const uid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newProfile: UserProfile = {
        uid,
        nama: addName.trim(),
        emel: email,
        telefon: addPhone.trim() || undefined,
        jawatan: addJawatan.trim() || undefined,
        peranan: addRoles.length > 0 ? addRoles : ['guru_biasa'],
        kelasDiajar: addClasses.length > 0 ? addClasses : undefined,
        aktif: true,
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
      await saveUserProfile(newProfile, operator);
      await onRefreshUsers();

      showToast(`Pendidik/Staf "${newProfile.nama}" berjaya didaftarkan!`, 'success');
      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddJawatan('');
      setAddRoles(['guru_kelas']);
      setAddClasses([]);
    } catch (err) {
      showToast('Gagal mendaftarkan guru baharu.', 'error');
    } finally {
      setSavingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: UserProfile) => {
    setEditUid(user.uid);
    setEditName(user.nama);
    setEditEmail(user.emel);
    setEditPhone(user.telefon || '');
    setEditJawatan(user.jawatan || '');
    setEditRoles([...user.peranan]);
    setEditClasses(user.kelasDiajar ? [...user.kelasDiajar] : []);
    setShowEditModal(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      showToast('Nama dan e-mel guru diperlukan.', 'error');
      return;
    }

    try {
      setSavingEdit(true);
      const updatedProfile: UserProfile = {
        uid: editUid,
        nama: editName.trim(),
        emel: editEmail.trim().toLowerCase(),
        telefon: editPhone.trim() || undefined,
        jawatan: editJawatan.trim() || undefined,
        peranan: editRoles.length > 0 ? editRoles : ['guru_biasa'],
        kelasDiajar: editClasses.length > 0 ? editClasses : undefined,
        aktif: true,
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
      await saveUserProfile(updatedProfile, operator);
      await onRefreshUsers();

      showToast(`Maklumat "${updatedProfile.nama}" berjaya dikemaskini!`, 'success');
      setShowEditModal(false);
    } catch (err) {
      showToast('Gagal mengemaskini maklumat guru.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Teacher
  const handleDelete = async (user: UserProfile) => {
    if (!window.confirm(`Adakah anda pasti ingin memadam akaun guru "${user.nama}" (${user.emel})?`)) {
      return;
    }

    try {
      const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
      await deleteUserProfile(user.uid, operator);
      await onRefreshUsers();
      showToast(`Akaun "${user.nama}" berjaya dipadamkan.`, 'info');
    } catch (err) {
      showToast('Gagal memadamkan guru.', 'error');
    }
  };

  // Handle Purge All Demo Users
  const handlePurgeDemoUsers = async () => {
    if (!window.confirm('AMARAN: Ini akan memadamkan SEMUA akaun demo dan nama staf fiktif daripada sistem. Teruskan?')) {
      return;
    }

    try {
      const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
      await purgeAllDemoUsers(operator);
      await onRefreshUsers();
      showToast('Semua nama pengguna demo telah dipadamkan sepenuhnya!', 'success');
    } catch (err) {
      showToast('Gagal memadamkan pengguna demo.', 'error');
    }
  };

  // Handle Bulk Import Teachers
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      showToast('Sila masukkan sekurang-kurangnya satu nama guru.', 'error');
      return;
    }

    try {
      setSavingBulk(true);
      const operator = currentUser || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };

      let addedCount = 0;
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        const name = parts[0];
        const email = parts[1] || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@smksalaping.edu.my`;

        const uid = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const profile: UserProfile = {
          uid,
          nama: name,
          emel: email,
          peranan: [bulkDefaultRole],
          aktif: true,
          dicipta: new Date().toISOString()
        };

        await saveUserProfile(profile, operator);
        addedCount++;
      }

      await onRefreshUsers();
      showToast(`${addedCount} orang guru baharu berjaya didaftarkan ke dalam sistem!`, 'success');
      setShowBulkModal(false);
      setBulkText('');
    } catch (err) {
      showToast('Gagal mengimport senarai guru.', 'error');
    } finally {
      setSavingBulk(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
      {/* Header Utama Pengurusan Staf & Pentadbir */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[11px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-700" />
              <span>Pengurusan Staf & Guru Sebenar SMK Salaping</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Data Sebenar Aktif
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Senarai Pentadbir, Guru Kelas & Warga Pendidik Sekolah
          </h2>
          <p className="text-slate-500 text-xs max-w-2xl">
            Daftarkan semua nama guru sebenar, selaraskan peranan jawatan (Pengetua, GPK HEM, Guru Disiplin, GBK, Warden, Guru Kelas), dan tetapkan kelas jagaan masing-masing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <button
            type="button"
            onClick={handlePurgeDemoUsers}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5"
            title="Padam semua nama-nama pengguna demo dan akaun fiktif"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Padam Semua Nama Demo {demoUsersCount > 0 ? `(${demoUsersCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>+ Import Pukal Senarai Guru</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Daftar Guru / Staf Baharu</span>
          </button>
        </div>
      </div>

      {/* Kad Metrik Statistik Pengguna */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Staf Berdaftar</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{totalUsers}</div>
          <span className="text-[10px] text-slate-400">Termasuk pentadbir</span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
          <span className="text-[11px] font-semibold text-blue-900 block">Guru Kelas</span>
          <div className="text-xl font-black text-blue-800 mt-0.5">{totalGuruKelas}</div>
          <span className="text-[10px] text-blue-600">Perekod e-Kehadiran</span>
        </div>

        <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200">
          <span className="text-[11px] font-semibold text-red-900 block">Guru Disiplin</span>
          <div className="text-xl font-black text-red-800 mt-0.5">{totalDisiplin}</div>
          <span className="text-[10px] text-red-600">Pengurusan SSDM & Kes</span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
          <span className="text-[11px] font-semibold text-purple-900 block">Kaunseling (GBK)</span>
          <div className="text-xl font-black text-purple-800 mt-0.5">{totalGbk}</div>
          <span className="text-[10px] text-purple-600">Bimbingan & Minda</span>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
          <span className="text-[11px] font-semibold text-indigo-900 block">Warden Asrama</span>
          <div className="text-xl font-black text-indigo-800 mt-0.5">{totalWarden}</div>
          <span className="text-[10px] text-indigo-600">Blok Desa Salaping</span>
        </div>
      </div>

      {/* Bar Carian & Penapis Peranan */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari guru mengikut nama, emel, jawatan, atau nama kelas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 w-full sm:w-auto"
          >
            <option value="semua">Semua Peranan ({allUsers.length})</option>
            <option value="pengetua">Pengetua</option>
            <option value="gpk_hem">GPK HEM</option>
            <option value="guru_kelas">Guru Kelas</option>
            <option value="ketua_guru_disiplin">Ketua Guru Disiplin</option>
            <option value="guru_disiplin">Guru Disiplin</option>
            <option value="gbk">Guru Kaunseling (GBK)</option>
            <option value="warden">Warden Asrama</option>
            <option value="penyelaras_biasiswa">Penyelaras Biasiswa</option>
            <option value="admin_sistem">Admin Sistem & ICT</option>
          </select>

          {(searchQuery || roleFilter !== 'semua') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('semua');
              }}
              className="text-xs font-bold text-blue-700 hover:underline px-1"
            >
              Set Semula
            </button>
          )}
        </div>
      </div>

      {/* Senarai Guru & Pentadbir */}
      <div className="space-y-3">
        {filteredUsers.map(user => {
          const isCurrentUser = currentUser?.uid === user.uid;

          return (
            <div
              key={user.uid}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                isCurrentUser
                  ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  {user.nama.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{user.nama}</span>
                    {user.jawatan && (
                      <span className="text-[11px] font-bold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100">
                        {user.jawatan}
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-700 text-white">
                        SESI ANDA
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.emel}</span>
                    </span>
                    {user.telefon && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.telefon}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {user.peranan.map(r => (
                      <RoleBadge key={r} role={r} size="sm" />
                    ))}

                    {user.kelasDiajar && user.kelasDiajar.length > 0 && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                        Kelas: {user.kelasDiajar.map(c => c.replace('-', ' ').toUpperCase()).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => onSwitchUser(user.uid)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5"
                  title="Tukar sesi aktif untuk menguji kebenaran peranan ini"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Guna Akaun Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(user)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-bold text-xs border border-blue-200 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sunting</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(user)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                  title="Padam akaun guru"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-sm">Tiada guru dijumpai.</p>
            <p className="text-slate-500 text-xs">
              Cuba tukar kata carian atau daftar guru baharu menggunakan butang di atas.
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: DAFTAR GURU BAHARU ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Daftar Guru / Pentadbir Baharu</h3>
                  <p className="text-[11px] text-slate-500">Kemasukan profil sebenar warga sekolah SMK Salaping</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Penuh Guru / Pentadbir <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cikgu Mohamad Faizal Bin Salleh"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Jawatan Rasmi Sekolah
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Guru Kelas, Penolong Kanan, GBK"
                    value={addJawatan}
                    onChange={e => setAddJawatan(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    No. Telefon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 013-8889999"
                    value={addPhone}
                    onChange={e => setAddPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Alamat E-mel Rasmi DELIMa KPM (@moe-dl.edu.my)
                </label>
                <input
                  type="email"
                  placeholder="Contoh: g-12345678@moe-dl.edu.my (autogen jika kosong)"
                  value={addEmail}
                  onChange={e => setAddEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Jika dikosongkan, e-mel DELIMa rasmi guru akan dijana secara automatik.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Pilih Peranan Dipertanggungjawabkan (Boleh pilih lebih dari satu):
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-[11px] p-1 rounded hover:bg-white">
                      <input
                        type="checkbox"
                        checked={addRoles.includes(r)}
                        onChange={e => {
                          if (e.target.checked) {
                            setAddRoles([...addRoles, r]);
                          } else {
                            setAddRoles(addRoles.filter(x => x !== r));
                          }
                        }}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">{ROLE_LABELS[r].title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {addRoles.includes('guru_kelas') && (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Kelas Dipertanggungjawabkan (Guru Kelas):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                    {classesList.map(c => {
                      const isAssigned = addClasses.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={e => {
                              if (e.target.checked) {
                                setAddClasses([...addClasses, c.id]);
                              } else {
                                setAddClasses(addClasses.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded accent-blue-600"
                          />
                          <span className="font-bold text-slate-800">{c.nama}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingAdd ? 'Mendaftar...' : 'Daftar Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: SUNTING GURU ================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Sunting Maklumat Guru / Pentadbir</h3>
                  <p className="text-[11px] text-slate-500">Kemaskini peranan, nama, dan kelas yang dipertanggungjawabkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Penuh Guru <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Jawatan Rasmi Sekolah
                  </label>
                  <input
                    type="text"
                    value={editJawatan}
                    onChange={e => setEditJawatan(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    No. Telefon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Alamat E-mel Rasmi
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Pilih Peranan Bertanggungjawab (RBAC):
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer text-[11px] p-1 rounded hover:bg-white">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(r)}
                        onChange={e => {
                          if (e.target.checked) {
                            setEditRoles([...editRoles, r]);
                          } else {
                            setEditRoles(editRoles.filter(x => x !== r));
                          }
                        }}
                        className="rounded accent-blue-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">{ROLE_LABELS[r].title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editRoles.includes('guru_kelas') && (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Kelas Dipertanggungjawabkan (Guru Kelas):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                    {classesList.map(c => {
                      const isAssigned = editClasses.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={e => {
                              if (e.target.checked) {
                                setEditClasses([...editClasses, c.id]);
                              } else {
                                setEditClasses(editClasses.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded accent-blue-600"
                          />
                          <span className="font-bold text-slate-800">{c.nama}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: IMPORT PUKAL SENARAI GURU ================= */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Import Pukal Senarai Guru</h3>
                  <p className="text-[11px] text-slate-500">Tampal senarai nama guru dari Excel / e-Operasi / idMe KPM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Peranan Asas untuk Senarai Ini:
                </label>
                <select
                  value={bulkDefaultRole}
                  onChange={e => setBulkDefaultRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-xl p-2 font-bold text-slate-800 bg-slate-50"
                >
                  <option value="guru_kelas">Guru Kelas</option>
                  <option value="guru_biasa">Guru Akademik / Biasa</option>
                  <option value="guru_disiplin">Guru Disiplin</option>
                  <option value="gbk">Guru Kaunseling (GBK)</option>
                  <option value="warden">Warden Asrama</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Tampal Senarai Nama Guru (Satu baris untuk setiap guru):
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`Cikgu Ahmad Bin Ismail\nCikgu Siti Nurhaliza Binti Abdullah\nEn. Michael Tan\nPn. Dayangku Fatimah`}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-800 leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Format: Cukup sekadar nama guru setiap baris. Emel rasmi sekolah akan dijana secara automatik.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBulk || !bulkText.trim()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingBulk ? 'Mengimport...' : 'Import Semua Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
