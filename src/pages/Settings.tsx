import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { SchoolSettings, RulesSettings, UserRole, ClassInfo, UserProfile } from '../types';
import { ROLE_LABELS } from '../constants';
import { isFirebaseConfigured } from '../services/firebase';
import {
  Settings as SettingsIcon,
  Building2,
  Sliders,
  Users,
  Database,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
  Palette,
  ShieldAlert,
  FileText,
  Download,
  Upload,
  Zap,
  ZapOff,
  HardDrive,
  Home,
  UserPlus,
  Plus,
  Trash2,
  Check,
  X,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import { RoleBadge } from '../components/RoleBadge';
import { SchoolLogo } from '../components/SchoolLogo';
import { DashboardSettingsTab } from '../components/DashboardSettingsTab';
import { TeacherManagementTab } from '../components/TeacherManagementTab';
import {
  exportCompleteBackupJSON,
  importCompleteBackupJSON,
  getClassesList,
  saveClassesList,
  clearAllDemoDataForProduction
} from '../services/dataService';

export const Settings: React.FC<{ onOpenResetModal: () => void }> = ({ onOpenResetModal }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as any;

  const {
    school,
    rules,
    dashboardSettings,
    updateSchool,
    updateRules,
    updateDashboardSettings,
    showToast,
    lowDataMode,
    toggleLowDataMode
  } = useSchool();
  const { allUsers, canManageUsers, updateUserRole, currentUser, refreshUsers, loginAsDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'sekolah' | 'dashboard' | 'peraturan' | 'pengguna' | 'sandaran' | 'firebase'>(
    urlTab === 'dashboard' ? 'dashboard' : 'sekolah'
  );
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  // School Form State
  const [schoolForm, setSchoolForm] = useState<SchoolSettings>({ ...school });
  // Rules Form State
  const [rulesForm, setRulesForm] = useState<RulesSettings>({ ...rules });

  // Class Management State
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassForm, setNewClassForm] = useState<number>(1);
  const [savingClass, setSavingClass] = useState(false);

  // Sync state whenever context data updates
  useEffect(() => {
    setSchoolForm({ ...school });
  }, [school]);

  useEffect(() => {
    setRulesForm({ ...rules });
  }, [rules]);

  // Load school classes list
  useEffect(() => {
    async function loadClasses() {
      try {
        const list = await getClassesList();
        setClassesList(list);
      } catch (err) {
        console.error('Ralat memuatkan senarai kelas:', err);
      }
    }
    loadClasses();
  }, []);

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSchool(schoolForm);
      showToast('Maklumat sekolah sebenar berjaya disimpan dan dikemaskini!', 'success');
    } catch (err) {
      showToast('Gagal mengemaskini maklumat sekolah.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRules(rulesForm);
      showToast('Peraturan dan ambang risiko cicir berjaya dikemaskini!', 'success');
    } catch (err) {
      showToast('Gagal mengemaskini peraturan dan ambang.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setSavingClass(true);
      const id = `${newClassForm}-${newClassName.trim().toLowerCase().replace(/\s+/g, '-')}`;
      const newClass: ClassInfo = {
        id,
        tingkatan: newClassForm,
        nama: `${newClassForm} ${newClassName.trim()}`,
        tahun: school.tahunSemasa || 2026,
        kapasiti: 35
      };

      const updated = [...classesList, newClass];
      const operator = currentUser || { uid: 'admin_sistem', nama: 'Admin Sistem' };
      await saveClassesList(updated, { uid: operator.uid, nama: operator.nama });
      setClassesList(updated);
      setNewClassName('');
      showToast(`Kelas "${newClass.nama}" berjaya ditambah ke dalam sistem sekolah!`, 'success');
    } catch (err) {
      showToast('Gagal menambah kelas baharu.', 'error');
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Adakah anda pasti ingin memadamkan kelas ini?')) return;
    try {
      const updated = classesList.filter(c => c.id !== classId);
      const operator = currentUser || { uid: 'admin_sistem', nama: 'Admin Sistem' };
      await saveClassesList(updated, { uid: operator.uid, nama: operator.nama });
      setClassesList(updated);
      showToast('Kelas berjaya dipadamkan.', 'info');
    } catch (err) {
      showToast('Gagal memadamkan kelas.', 'error');
    }
  };

  const handleClearAllDemoData = () => {
    if (window.confirm('AMARAN: Ini akan memadamkan SEMUA rekod demo murid, kehadiran demo, dan disiplin demo bagi membolehkan kemasukan data sekolah sebenar. Teruskan?')) {
      const operator = currentUser || { uid: 'admin_sistem', nama: 'Admin Sistem' };
      clearAllDemoDataForProduction({ uid: operator.uid, nama: operator.nama });
      showToast('Semua data demo telah dipadamkan. Pangkalan data sedia untuk data sekolah sebenar!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setBackupLoading(true);
      const operator = currentUser || { uid: 'admin', nama: 'Admin Sistem' };
      const jsonStr = await exportCompleteBackupJSON(operator);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HEM_Digital_SMKS_Sandaran_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Fail sandaran JSON pangkalan data berjaya dimuat turun!', 'success');
    } catch (err) {
      showToast('Gagal memuat turun fail sandaran.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBackupLoading(true);
      const text = await file.text();
      const operator = currentUser || { uid: 'admin', nama: 'Admin Sistem' };
      await importCompleteBackupJSON(text, operator);
      showToast('Pangkalan data berjaya dipulihkan daripada sandaran JSON!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showToast('Gagal memulihkan fail sandaran. Pastikan format fail sah.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              Konfigurasi & Pentadbiran Sistem
            </span>
            <span className="text-xs text-slate-500">SMK Salaping (XEA5002)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tetapan Sekolah, Peraturan & Pengguna
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Semua butiran sekolah, peraturan ambang SOP 1:3:7, dan peranan pengguna (RBAC) boleh diselaraskan di sini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleClearAllDemoData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Kosongkan Demo & Sedia Data Sebenar</span>
          </button>

          <button
            onClick={onOpenResetModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Pilihan Data Demo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('sekolah')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'sekolah' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil & Identiti Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Pengurusan Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('peraturan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'peraturan' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Peraturan & Ambang SOP 1:3:7</span>
        </button>

        <button
          onClick={() => setActiveTab('pengguna')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pengguna' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengurusan Pentadbir & Guru ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sandaran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'sandaran' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Sandaran & Mod Luar Talian</span>
        </button>

        <button
          onClick={() => setActiveTab('firebase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'firebase' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Penyediaan Firebase Console</span>
        </button>
      </div>

      {/* ================= TAB 1: PROFIL SEKOLAH ================= */}
      {activeTab === 'sekolah' && (
        <form onSubmit={handleSaveSchool} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Maklumat Rasmi Sekolah (Firestore: settings/school)</h2>
              <p className="text-slate-500 text-[11px]">Tidak di-hardcode; boleh diubah suai mengikut keperluan pentadbiran</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Maklumat'}</span>
            </button>
          </div>

          {/* Logo Utama & Lambang Rasmi Sekolah */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col sm:flex-row items-center gap-4">
            <div className="p-2 bg-white rounded-2xl shadow-xs border border-teal-200 shrink-0">
              <SchoolLogo size="xl" className="drop-shadow-xs" />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 font-extrabold text-[10px]">
                  Logo Utama SMK Salaping (Kekal & Rasmi)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Motto: Ilmuan Gemilang • Ditubuhkan 2006 (1427H)</span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Lencana / Emblem Rasmi SMK Salaping
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Logo utama telah ditetapkan dan dipelihara bentuk serta sifat asalnya mengikut identiti sekolah. Logo ini dipaparkan secara konsisten merentasi Navbar, Sidebar, Dashboard Utama, dan cetakan laporan rasmi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Sekolah</label>
              <input
                type="text"
                required
                value={schoolForm.nama}
                onChange={e => setSchoolForm({ ...schoolForm, nama: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Kod Sekolah (KPM)</label>
              <input
                type="text"
                required
                value={schoolForm.kodSekolah}
                onChange={e => setSchoolForm({ ...schoolForm, kodSekolah: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tahun Persekolahan</label>
              <input
                type="number"
                value={schoolForm.tahunSemasa}
                onChange={e => setSchoolForm({ ...schoolForm, tahunSemasa: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Sesi Persekolahan</label>
              <select
                value={schoolForm.sesi}
                onChange={e => setSchoolForm({ ...schoolForm, sesi: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                <option value="Pagi">Pagi</option>
                <option value="Petang">Petang</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">No. Telefon Pejabat</label>
              <input
                type="text"
                value={schoolForm.noTelefon}
                onChange={e => setSchoolForm({ ...schoolForm, noTelefon: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat E-mel Rasmi</label>
              <input
                type="email"
                value={schoolForm.emel}
                onChange={e => setSchoolForm({ ...schoolForm, emel: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Moto / Slogan Sekolah</label>
              <input
                type="text"
                value={schoolForm.motoSekolah}
                onChange={e => setSchoolForm({ ...schoolForm, motoSekolah: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={schoolForm.alamat}
                onChange={e => setSchoolForm({ ...schoolForm, alamat: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-700" />
                <span>Warna Tema Utama Sekolah (Hex)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={schoolForm.warnaUtama}
                  onChange={e => setSchoolForm({ ...schoolForm, warnaUtama: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={schoolForm.warnaUtama}
                  onChange={e => setSchoolForm({ ...schoolForm, warnaUtama: e.target.value })}
                  className="border border-slate-300 rounded-lg p-2 font-mono flex-1 uppercase"
                />
              </div>
            </div>
          </div>

          {/* ================= SEKSYEN KHAS: BARISAN PENTADBIR SEKOLAH ================= */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-4 mt-4">
            <div className="border-b border-indigo-100 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-700" />
                  <span>Nama-Nama Pentadbir & Barisan Kepimpinan Sekolah</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kemas kini nama sebenar barisan pentadbir sekolah untuk paparan rasmi surat amaran, sidang lembaga disiplin, UBK, kebajikan, dan asrama.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 self-start sm:self-center">
                10 Jawatan Pentadbiran
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">1. Pengetua</label>
                <input
                  type="text"
                  placeholder="Nama penuh Pengetua"
                  value={schoolForm.namaPengetua}
                  onChange={e => setSchoolForm({ ...schoolForm, namaPengetua: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">2. GPK Hal Ehwal Murid (GPK HEM)</label>
                <input
                  type="text"
                  placeholder="Nama penuh GPK HEM"
                  value={schoolForm.namaGpkHem}
                  onChange={e => setSchoolForm({ ...schoolForm, namaGpkHem: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">3. GPK Pentadbiran / GPK 1</label>
                <input
                  type="text"
                  placeholder="Nama penuh GPK 1"
                  value={schoolForm.namaGpk1 || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaGpk1: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">4. GPK Kokurikulum</label>
                <input
                  type="text"
                  placeholder="Nama penuh GPK Kokurikulum"
                  value={schoolForm.namaGpkKoko || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaGpkKoko: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">5. Ketua Guru Disiplin</label>
                <input
                  type="text"
                  placeholder="Nama penuh Ketua Disiplin"
                  value={schoolForm.namaKetuaDisiplin || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaKetuaDisiplin: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">6. Guru Kaunseling (GBK)</label>
                <input
                  type="text"
                  placeholder="Nama penuh Guru Kaunseling"
                  value={schoolForm.namaGbk || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaGbk: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">7. Ketua Warden Asrama</label>
                <input
                  type="text"
                  placeholder="Nama penuh Ketua Warden"
                  value={schoolForm.namaKetuaWarden || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaKetuaWarden: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">8. Penyelaras Biasiswa & Kebajikan</label>
                <input
                  type="text"
                  placeholder="Nama penuh Penyelaras Biasiswa"
                  value={schoolForm.namaPenyelarasBiasiswa || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaPenyelarasBiasiswa: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">9. Penyelaras Badan Pengawas</label>
                <input
                  type="text"
                  placeholder="Nama penuh Penyelaras Pengawas"
                  value={schoolForm.namaPenyelarasPengawas || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaPenyelarasPengawas: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-100 shadow-xs">
                <label className="font-bold text-slate-800 block text-xs mb-1">10. Guru Data & Maklumat HEM</label>
                <input
                  type="text"
                  placeholder="Nama penuh Guru Data"
                  value={schoolForm.namaGuruData || ''}
                  onChange={e => setSchoolForm({ ...schoolForm, namaGuruData: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tetapan Modul Asrama Desa (Fasa 3) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block text-xs">Modul Asrama Desa SMK Salaping</span>
                <p className="text-slate-500 text-[11px] leading-relaxed max-w-xl">
                  Kawalan pengaktifan sistem asrama (blok, kamar, permohonan keluar, rekod warden, dan roll call). Jika dimatikan, pautan modul akan disembunyikan daripada menu navigasi.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <span className={`text-[11px] font-bold ${schoolForm.modulAsramaAktif !== false ? 'text-indigo-700' : 'text-slate-400'}`}>
                {schoolForm.modulAsramaAktif !== false ? 'Aktif (Dipaparkan)' : 'Dimatikan (Disorok)'}
              </span>
              <input
                type="checkbox"
                checked={schoolForm.modulAsramaAktif !== false}
                onChange={e => setSchoolForm({ ...schoolForm, modulAsramaAktif: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Pengurusan Senarai Kelas Sekolah */}
          <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Pengurusan Senarai Kelas Sekolah ({classesList.length} Kelas Berdaftar)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tetapkan senarai kelas sebenar mengikut tingkatan untuk enrolmen murid dan perekodan kehadiran harian guru kelas.
                </p>
              </div>
            </div>

            {/* Borang Tambah Kelas Baharu */}
            <div className="p-3 bg-white rounded-xl border border-blue-100 flex flex-wrap items-center gap-2 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 text-[11px]">Tingkatan:</span>
                <select
                  value={newClassForm}
                  onChange={e => setNewClassForm(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg p-1.5 font-bold text-xs bg-slate-50"
                >
                  <option value={1}>Tingkatan 1</option>
                  <option value={2}>Tingkatan 2</option>
                  <option value={3}>Tingkatan 3</option>
                  <option value={4}>Tingkatan 4</option>
                  <option value={5}>Tingkatan 5</option>
                </select>
              </div>

              <div className="flex-1 min-w-[160px]">
                <input
                  type="text"
                  placeholder="Nama Kelas (cth: Arif, Bestari, Sains, Kemanusiaan)"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-semibold"
                />
              </div>

              <button
                type="button"
                onClick={handleAddClass}
                disabled={savingClass || !newClassName.trim()}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kelas</span>
              </button>
            </div>

            {/* Senarai Badge Kelas Sedia Ada */}
            <div className="flex flex-wrap gap-2 pt-1">
              {classesList.map(c => (
                <div
                  key={c.id}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 group hover:border-blue-400 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-xs">{c.nama}</span>
                  <span className="text-[10px] text-slate-400">Tingkatan {c.tingkatan}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(c.id)}
                    className="text-slate-300 hover:text-red-600 p-0.5 rounded transition-colors"
                    title="Padam kelas ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: PENGURUSAN DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <DashboardSettingsTab
          initialSettings={dashboardSettings}
          onSave={async (newSettings) => {
            setSaving(true);
            try {
              await updateDashboardSettings(newSettings);
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      )}

      {/* ================= TAB 3: PERATURAN & AMBANG ================= */}
      {activeTab === 'peraturan' && (
        <form onSubmit={handleSaveRules} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Peraturan & Ambang Kehadiran (Firestore: settings/rules)</h2>
              <p className="text-slate-500 text-[11px]">Menetapkan formula pengesanan awal risiko cicir SOP 1:3:7</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Peraturan'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="font-bold text-blue-900 block mb-1">Sasaran Kehadiran Sekolah (%)</label>
              <input
                type="number"
                step="0.1"
                value={rulesForm.sasaranKehadiranSekolah}
                onChange={e => setRulesForm({ ...rulesForm, sasaranKehadiranSekolah: Number(e.target.value) })}
                className="w-full border border-blue-300 rounded-lg p-2 font-black text-blue-900"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <label className="font-bold text-blue-900 block mb-1">Amaran 1 (Hari Berturut-turut)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran1HariBerturut}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran1HariBerturut: Number(e.target.value) }
                })}
                className="w-full border border-blue-300 rounded-lg p-2 font-black"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <label className="font-bold text-amber-900 block mb-1">Amaran 2 (Hari Berturut-turut)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran2HariBerturut}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran2HariBerturut: Number(e.target.value) }
                })}
                className="w-full border border-amber-300 rounded-lg p-2 font-black"
              />
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <label className="font-bold text-red-900 block mb-1">Amaran 3 (Hari Berturut-turut)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran3HariBerturut}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran3HariBerturut: Number(e.target.value) }
                })}
                className="w-full border border-red-300 rounded-lg p-2 font-black"
              />
            </div>
          </div>

          {/* Ambang Peratus Terkumpul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="font-bold text-slate-800 block mb-1">Amaran 1 (Peratus Terkumpul &le; %)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran1PeratusTerkumpul}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran1PeratusTerkumpul: Number(e.target.value) }
                })}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="font-bold text-slate-800 block mb-1">Amaran 2 (Peratus Terkumpul &le; %)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran2PeratusTerkumpul}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran2PeratusTerkumpul: Number(e.target.value) }
                })}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="font-bold text-slate-800 block mb-1">Amaran 3 (Peratus Terkumpul &le; %)</label>
              <input
                type="number"
                value={rulesForm.ambangRisikoCicir.amaran3PeratusTerkumpul}
                onChange={e => setRulesForm({
                  ...rulesForm,
                  ambangRisikoCicir: { ...rulesForm.ambangRisikoCicir, amaran3PeratusTerkumpul: Number(e.target.value) }
                })}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              />
            </div>
          </div>

          {/* Panduan Rujukan Lapor Pihak Luar (Polis / JKM / PPD) */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Panduan Pantas Rujukan Pihak Luar (KPM SOP Perlindungan Kanak-kanak):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                <label className="font-bold text-blue-900 block mb-1">Syarat Rujuk Polis (PDRM):</label>
                <textarea
                  rows={3}
                  value={rulesForm.panduanLaporPihakLuar.syaratPolis}
                  onChange={e => setRulesForm({
                    ...rulesForm,
                    panduanLaporPihakLuar: { ...rulesForm.panduanLaporPihakLuar, syaratPolis: e.target.value }
                  })}
                  className="w-full border border-blue-300 rounded-lg p-2 text-[11px]"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="font-bold text-amber-900 block mb-1">Syarat Rujuk JKM:</label>
                <textarea
                  rows={3}
                  value={rulesForm.panduanLaporPihakLuar.syaratJKM}
                  onChange={e => setRulesForm({
                    ...rulesForm,
                    panduanLaporPihakLuar: { ...rulesForm.panduanLaporPihakLuar, syaratJKM: e.target.value }
                  })}
                  className="w-full border border-amber-300 rounded-lg p-2 text-[11px]"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <label className="font-bold text-indigo-900 block mb-1">Syarat Lapor PPD Kota Marudu:</label>
                <textarea
                  rows={3}
                  value={rulesForm.panduanLaporPihakLuar.syaratPPD}
                  onChange={e => setRulesForm({
                    ...rulesForm,
                    panduanLaporPihakLuar: { ...rulesForm.panduanLaporPihakLuar, syaratPPD: e.target.value }
                  })}
                  className="w-full border border-indigo-300 rounded-lg p-2 text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-800">Templat Teks Surat Amaran Pertama (Boleh Diedit):</h3>
            <textarea
              rows={4}
              value={rulesForm.templatSuratAmaran.amaran1}
              onChange={e => setRulesForm({
                ...rulesForm,
                templatSuratAmaran: { ...rulesForm.templatSuratAmaran, amaran1: e.target.value }
              })}
              className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-[11px]"
            />
          </div>
        </form>
      )}

      {/* ================= TAB 4: PENGURUSAN PENTADBIR & GURU ================= */}
      {activeTab === 'pengguna' && (
        <TeacherManagementTab
          allUsers={allUsers}
          classesList={classesList}
          currentUser={currentUser}
          onRefreshUsers={refreshUsers}
          onSwitchUser={loginAsDemoUser}
          showToast={showToast}
        />
      )}

      {/* ================= TAB 4: SANDARAN & MOD LUAR TALIAN ================= */}
      {activeTab === 'sandaran' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <HardDrive className="w-5 h-5 text-blue-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sandaran Setempat & Ketahanan Luar Talian (Sabah Offline-First)</h2>
              <p className="text-slate-500 text-[11px]">
                Direka khas untuk SMK Salaping, Kota Marudu bagi memastikan operasi HEM berterusan walaupun ketiadaan liputan internet
              </p>
            </div>
          </div>

          {/* Kad Kawalan Data Sebenar vs Demo */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className="font-extrabold text-sm text-emerald-950">Penyediaan Sistem untuk Data Sekolah Sebenar</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900 border border-emerald-300">
                  MOD PENGELUARAN
                </span>
              </div>
              <p className="text-slate-700 text-[11px] leading-relaxed max-w-2xl">
                Kosongkan semua data fiktif (murid demo, kehadiran demo, kes disiplin demo) supaya pihak sekolah boleh memulakan kemasukan murid sebenar dan perekodan harian tanpa percampuran rekod.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearAllDemoData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-xs shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kosongkan Semua Rekod Demo</span>
            </button>
          </div>

          {/* Kad Mod Capaian Rendah (Low Data Mode) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Mod Capaian Rendah (Low Data Mode)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${lowDataMode ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'}`}>
                  {lowDataMode ? 'SEDANG AKTIF' : 'TIDAK AKTIF'}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed max-w-2xl">
                Mengurangkan animasi antara muka, menyembunyikan pemuatan gambar profil berat, dan memaksimumkan paparan teks ringkas untuk menjimatkan kuota data selular guru di kawasan pedalaman Kota Marudu.
              </p>
            </div>

            <button
              onClick={toggleLowDataMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-xs shrink-0 ${
                lowDataMode
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              {lowDataMode ? <Zap className="w-4 h-4 text-emerald-300" /> : <ZapOff className="w-4 h-4 text-slate-500" />}
              <span>{lowDataMode ? 'Matikan Mod Data Rendah' : 'Aktifkan Mod Data Rendah'}</span>
            </button>
          </div>

          {/* Chrome Extension HEM Sync Card */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Download className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Chrome Extension: HEM Sync (idMe KPM)
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Pakej fail lengkap (.zip) untuk menyelaraskan senarai murid dan kehadiran idMe KPM terus ke Firestore.
                  </p>
                </div>
              </div>
              <a
                href="/hem-extension.zip"
                download="hem-extension.zip"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun Extension (hem-extension.zip)</span>
              </a>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
              <span className="font-bold text-emerald-950 block">Panduan Pemasangan di Chrome:</span>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-600">
                <li>Klik butang hijau di atas untuk memuat turun <code>hem-extension.zip</code>.</li>
                <li>Buka fail zip di komputer anda, klik kanan dan pilih <strong>"Extract All..." (Ekstrak Semua)</strong> ke dalam satu folder.</li>
                <li>Di Google Chrome, buka alamat <code>chrome://extensions</code> dan aktifkan suis <strong>Developer mode</strong> di penjuru atas kanan.</li>
                <li>Klik butang <strong>"Load unpacked"</strong>. <em>(Perhatian: Tetingkap yang muncul adalah tetingkap <strong>Pilih Folder</strong>. Klik pada folder hasil ekstrak tadi dan tekan butang <strong>"Select Folder"</strong> di bahagian bawah kanan. Fail di dalamnya memang tidak akan dipaparkan kerana tetingkap ini mencari folder, bukan fail).</em></li>
              </ol>
            </div>
          </div>

          {/* Sandaran Keseluruhan Sistem JSON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Muat Turun Sandaran */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Download className="w-4 h-4 text-blue-700" />
                <span>Eksport Sandaran Kecemasan (Disaster Recovery)</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Muat turun fail JSON mengandungi keseluruhan rekod murid, kehadiran harian, kes disiplin, sesi kaunseling disulitkan, dan rekod biasiswa. Simpan fail ini ke dalam pemacu kilat (pen drive) atau komputer riba sekolah.
              </p>
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{backupLoading ? 'Menjana Fail...' : 'Muat Turun Sandaran Penuh (JSON)'}</span>
              </button>
            </div>

            {/* Pulihkan Sandaran */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>Pulihkan Sistem daripada Fail Sandaran</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Gunakan fail JSON sandaran terdahulu untuk memulihkan seluruh data pangkalan data jika peranti bertukar atau data rosak selepas terputus bekalan internet.
              </p>
              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Pilih Fail Sandaran (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Protokol & SOP Luar Talian */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <h3 className="font-bold text-slate-800 text-xs">SOP Pengurusan Semasa Tiada Liputan Internet di SMK Salaping:</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>Guru kelas boleh terus merekod kehadiran dan Guru Disiplin boleh merekod kes — enjin Firestore Offline Persistence (<code>persistentLocalCache</code>) menyimpan semua transaksi secara selamat di dalam storan pelayar telefon.</li>
              <li>Jangan kosongkan sejarah pelayar (Clear Browser Cache) semasa dalam mod luar talian.</li>
              <li>Sebaik sahaja telefon menerima isyarat internet (cth. di Pekan Kota Marudu atau kawasan liputan), semua rekod akan diselaraskan secara automatik ke pelayan awan.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ================= TAB 5: PANDUAN FIREBASE CONSOLE ================= */}
      {activeTab === 'firebase' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Status Sambungan Firebase & Panduan Pelayan</h2>
          </div>

          <div className={`p-4 rounded-xl border ${
            isFirebaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              {isFirebaseConfigured ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Firebase Berjaya Dikonfigurasikan!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Mod Setempat / Demo Berjalan (Firebase Config Belum Disediakan)</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed">
              {isFirebaseConfigured
                ? 'Aplikasi sedang disambungkan secara langsung ke Cloud Firestore dengan caching luar talian persistentLocalCache aktif.'
                : 'Aplikasi sedang beroperasi sepenuhnya menggunakan enjin cache berprestasi tinggi tempatan dengan data demo lengkap SMK Salaping. Untuk menyambung ke projek Firebase sebenar, ikuti langkah mudah di bawah:'}
            </p>
          </div>

          <div className="space-y-3 pt-2 text-slate-700">
            <h3 className="font-extrabold text-slate-900 text-sm">Langkah Menyediakan Firebase Console untuk SMK Salaping:</h3>

            <div className="space-y-2 border-l-2 border-blue-600 pl-4">
              <div>
                <strong className="text-slate-900">1. Cipta Projek Firebase:</strong>
                <p className="text-slate-600">Layari <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">console.firebase.google.com</code> dan cipta projek baharu bernama <code>smk-salaping-hem</code>.</p>
              </div>

              <div>
                <strong className="text-slate-900">2. Aktifkan Cloud Firestore:</strong>
                <p className="text-slate-600">Pilih <em>Build &gt; Firestore Database</em>. Pilih lokasi <code>asia-southeast1</code> (Singapura) untuk kelajuan optimum dari Sabah. Mulakan dalam Production Mode.</p>
              </div>

              <div>
                <strong className="text-slate-900">3. Aktifkan Firebase Authentication:</strong>
                <p className="text-slate-600">Pilih <em>Build &gt; Authentication</em>, aktifkan penyedia <strong>Email/Password</strong>.</p>
              </div>

              <div>
                <strong className="text-slate-900">4. Masukkan Kunci dalam Fail .env:</strong>
                <p className="text-slate-600">Salin kunci Web App SDK dan masukkan ke dalam pembolehubah persekitaran fail <code>.env</code> (seperti contoh dalam <code>.env.example</code>):</p>
                <pre className="p-3 bg-slate-900 text-amber-300 rounded-lg font-mono text-[11px] overflow-x-auto mt-1">
{`VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="smk-salaping-hem.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="smk-salaping-hem"
VITE_FIREBASE_STORAGE_BUCKET="smk-salaping-hem.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
