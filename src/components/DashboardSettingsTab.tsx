import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSettings } from '../types';
import { DEFAULT_DASHBOARD_SETTINGS } from '../constants';
import {
  LayoutDashboard,
  Save,
  RotateCcw,
  Eye,
  Megaphone,
  Sliders,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trophy,
  Users,
  TrendingUp,
  UserX,
  ShieldAlert,
  HeartHandshake,
  Award,
  Home,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DashboardSettingsTabProps {
  initialSettings: DashboardSettings;
  onSave: (settings: DashboardSettings) => Promise<void>;
  saving: boolean;
}

export const DashboardSettingsTab: React.FC<DashboardSettingsTabProps> = ({
  initialSettings,
  onSave,
  saving
}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<DashboardSettings>({
    ...DEFAULT_DASHBOARD_SETTINGS,
    ...initialSettings,
    kpiCards: {
      ...DEFAULT_DASHBOARD_SETTINGS.kpiCards,
      ...(initialSettings?.kpiCards || {})
    }
  });

  const [activeSection, setActiveSection] = useState<'banner' | 'pengumuman' | 'kpi' | 'panel' | 'carta'>('banner');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Adakah anda pasti ingin mengembalikan susun atur dashboard kepada nilai lalai sekolah?')) {
      setForm({ ...DEFAULT_DASHBOARD_SETTINGS });
    }
  };

  const handleToggleAllKpi = (value: boolean) => {
    setForm(prev => ({
      ...prev,
      kpiCards: {
        enrolmen: value,
        kehadiran: value,
        ketidakhadiran: value,
        risikoCicir: value,
        disiplin: value,
        kaunseling: value,
        bantuan: value,
        asrama: value
      }
    }));
  };

  const kpiItems = [
    {
      key: 'enrolmen' as const,
      label: 'Jumlah Enrolmen Murid',
      desc: 'Pecahan bilangan murid lelaki & perempuan semasa',
      icon: Users,
      color: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      key: 'kehadiran' as const,
      label: 'Peratus Kehadiran Hari Ini',
      desc: 'Peratusan murid hadir berbanding sasaran sekolah',
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      key: 'ketidakhadiran' as const,
      label: 'Murid Tidak Hadir Hari Ini',
      desc: 'Bilangan murid yang belum atau tidak hadir',
      icon: UserX,
      color: 'text-rose-700 bg-rose-50 border-rose-200'
    },
    {
      key: 'risikoCicir' as const,
      label: 'Murid Berisiko Cicir (SOP 1:3:7)',
      desc: 'Murid yang melepasi ambang amaran ketidakhadiran',
      icon: AlertTriangle,
      color: 'text-amber-700 bg-amber-50 border-amber-300'
    },
    {
      key: 'disiplin' as const,
      label: 'Kes Disiplin Terbuka',
      desc: 'Kes sahsiah yang masih dalam siasatan / tindakan',
      icon: ShieldAlert,
      color: 'text-red-700 bg-red-50 border-red-200'
    },
    {
      key: 'kaunseling' as const,
      label: 'Sesi Kaunseling Aktif',
      desc: 'Bimbingan berfokus murid oleh Guru Kaunseling (GBK)',
      icon: HeartHandshake,
      color: 'text-purple-700 bg-purple-50 border-purple-200'
    },
    {
      key: 'bantuan' as const,
      label: 'Penerima Skim Bantuan Kebajikan',
      desc: 'Pemantauan kuota dan agihan biasiswa murid',
      icon: Award,
      color: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      key: 'asrama' as const,
      label: 'Penghuni Asrama Desa',
      desc: 'Kapasiti katil dan penghuni Blok Putera/Puteri',
      icon: Home,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Pengurusan Dashboard */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[11px] flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-700" />
              <span>Pengurusan Penuh Dashboard HEM</span>
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Segerak Masa Nyata
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Konfigurasi Kandungan & Paparan Dashboard Utama
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Urus semua butiran banner, teks ucapan, hebahan pentadbiran, keterlihatan kad KPI, had senarai, dan carta statistik dengan mudah tanpa perlu ubah kod sistem.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Kembalikan semua nilai ke lalai"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Set Semula Lalai</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-2.5 rounded-xl border border-blue-200 text-blue-800 bg-blue-50 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Buka paparan dashboard"
          >
            <Eye className="w-4 h-4 text-blue-700" />
            <span>Pratonton Dashboard</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Tetapan Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Maklum Balas Berjaya Disimpan */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="font-semibold">
            Semua konfigurasi dashboard berjaya dikemaskini dan disimpan ke storan sistem. Perubahan kini aktif di Dashboard Utama!
          </div>
        </div>
      )}

      {/* Navigasi Sub-Tab Tetapan Dashboard */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSection('banner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSection === 'banner'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Banner & Identiti Utama</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('pengumuman')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSection === 'pengumuman'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-blue-600" />
          <span>Hebahan Pentadbiran HEM</span>
          {form.pengumumanAktif && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('kpi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSection === 'kpi'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Kad KPI & Keterlihatan Widget</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('panel')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSection === 'panel'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Panel Intervensi & Tugasan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('carta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSection === 'carta'
              ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-cyan-600" />
          <span>Analisis & Carta Kehadiran</span>
        </button>
      </div>

      {/* ================= SEKSYEN 1: BANNER & IDENTITI UTAMA ================= */}
      {activeSection === 'banner' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pengurusan Banner Header Dashboard Utama</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Sesuaikan ucapan alu-aluan, ilustrasi visual murid, teks aspirasi sekolah, dan lencana banner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Ucapan Awalan Pengguna
              </label>
              <input
                type="text"
                value={form.ucapanAwalan}
                onChange={e => setForm({ ...form, ucapanAwalan: e.target.value })}
                placeholder="cth: Selamat Bertugas, Selamat Datang"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dipaparkan di hadapan nama pengguna yang sedang log masuk.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Subteks Keterangan Banner
              </label>
              <input
                type="text"
                value={form.subteksBanner}
                onChange={e => setForm({ ...form, subteksBanner: e.target.value })}
                placeholder="cth: Portal Pengurusan Hal Ehwal Murid (HEM) Bersepadu"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Keterangan atau slogan ringkas di bawah tajuk utama ucapan.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Teks Lencana Ilustrasi Atas
              </label>
              <input
                type="text"
                value={form.lencanaBannerText}
                onChange={e => setForm({ ...form, lencanaBannerText: e.target.value })}
                placeholder="cth: Kemenjadian Murid Salaping"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tajuk Aspirasi Kapsul Ilustrasi
              </label>
              <input
                type="text"
                value={form.tajukAspirasi}
                onChange={e => setForm({ ...form, tajukAspirasi: e.target.value })}
                placeholder="cth: Aspirasi Murid Salaping • Modal Insan"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Subtajuk Aspirasi Ilustrasi
              </label>
              <input
                type="text"
                value={form.subtajukAspirasi}
                onChange={e => setForm({ ...form, subtajukAspirasi: e.target.value })}
                placeholder="cth: Kepimpinan • Kejayaan Akademik • Keunggulan Sahsiah"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Konfigurasi Gambar Banner & Pilihan Pantas */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-700" />
                <span>Pautan / Fail Gambar Ilustrasi Banner</span>
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">
                Boleh guna aset tempatan atau URL gambar luar
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={form.gambarBannerUrl}
                onChange={e => setForm({ ...form, gambarBannerUrl: e.target.value })}
                placeholder="URL atau laluan fail gambar..."
                className="flex-1 border border-slate-300 rounded-xl p-2 font-mono text-xs text-slate-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, gambarBannerUrl: '/banner.jpg' })}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-[11px] whitespace-nowrap transition-colors"
              >
                Guna Gambar Pelajar Salaping (Asal)
              </button>
            </div>

            {form.gambarBannerUrl && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 shrink-0">
                  <img
                    src={form.gambarBannerUrl.startsWith('/src/assets/images/') ? '/banner.jpg' : form.gambarBannerUrl}
                    alt="Pratonton Banner"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/banner.jpg')) {
                        target.src = '/banner.jpg';
                      }
                    }}
                  />
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">Pratonton Gambar Semasa</span>
                  Gambar dipaparkan di sebelah kanan banner dashboard utama dengan kesan bingkai kemas dan bayangan moden.
                </div>
              </div>
            )}
          </div>

          {/* Suis Togol Elemen Banner */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3 text-xs">
              Elemen Keterlihatan pada Banner:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.tunjukLogo}
                  onChange={e => setForm({ ...form, tunjukLogo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Papar Logo Sekolah</span>
                  <span className="text-[10px] text-slate-500">Logo SMK Salaping bersebelahan teks ucapan</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.tunjukIlustrasiBanner}
                  onChange={e => setForm({ ...form, tunjukIlustrasiBanner: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Papar Ilustrasi Kanan</span>
                  <span className="text-[10px] text-slate-500">Gambar murid & aspirasi di lajur kanan banner</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.tunjukMetrikModalInsan}
                  onChange={e => setForm({ ...form, tunjukMetrikModalInsan: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Metrik Modal Insan</span>
                  <span className="text-[10px] text-slate-500">3 kad pantas (Sahsiah, Kehadiran, Kebajikan)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.tunjukPautanPantas}
                  onChange={e => setForm({ ...form, tunjukPautanPantas: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Butang Tindakan Pantas</span>
                  <span className="text-[10px] text-slate-500">Pautan pantas Kehadiran, Kalendar & Bantuan</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEKSYEN 2: HEBAHAN & PENGUMUMAN HEM ================= */}
      {activeSection === 'pengumuman' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <span>Hebahan Pentadbiran & Notis Khas HEM</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Hebahan ini akan terpapar di bahagian atas dashboard utama untuk dibaca oleh semua guru dan staf.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={form.pengumumanAktif}
                onChange={e => setForm({ ...form, pengumumanAktif: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-800">
                {form.pengumumanAktif ? 'Hebahan Aktif' : 'Hebahan Ditutup'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tajuk Hebahan Pentadbiran
              </label>
              <input
                type="text"
                value={form.pengumumanTajuk}
                onChange={e => setForm({ ...form, pengumumanTajuk: e.target.value })}
                placeholder="cth: Peringatan Pengisian Kehadiran e-Kehadiran KPM"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Kategori / Tahap Hebahan
              </label>
              <select
                value={form.pengumumanJenis}
                onChange={e => setForm({ ...form, pengumumanJenis: e.target.value as any })}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="info">Makluman Am (Warna Biru / Tenang)</option>
                <option value="amaran">Peringatan Penting (Warna Kuning / Perhatian)</option>
                <option value="penting">Tindakan Segera / Mandatori (Warna Merah / Kritikal)</option>
                <option value="kejayaan">Pencapaian & Tahniah (Warna Hijau / Kemenjadian)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Kandungan & Mesej Penuh Hebahan
            </label>
            <textarea
              rows={3}
              value={form.pengumumanMesej}
              onChange={e => setForm({ ...form, pengumumanMesej: e.target.value })}
              placeholder="Tulis kenyataan atau arahan pentadbiran untuk semua guru..."
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 font-medium leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tarikh Hebahan Dikeluarkan
              </label>
              <input
                type="date"
                value={form.pengumumanTarikh}
                onChange={e => setForm({ ...form, pengumumanTarikh: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Teks Butang Pautan (Pilihan)
              </label>
              <input
                type="text"
                value={form.teksPautanPengumuman || ''}
                onChange={e => setForm({ ...form, teksPautanPengumuman: e.target.value })}
                placeholder="cth: Semak Takwim / Buka Borang"
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Pautan Destinasi (Pilihan)
              </label>
              <input
                type="text"
                value={form.urlPautanPengumuman || ''}
                onChange={e => setForm({ ...form, urlPautanPengumuman: e.target.value })}
                placeholder="cth: /program-mesyuarat atau URL luar"
                className="w-full border border-slate-300 rounded-xl p-2 text-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Kotak Pratonton Hebahan */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Pratonton Paparan Pengumuman Pada Dashboard:
            </span>
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                form.pengumumanJenis === 'amaran'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : form.pengumumanJenis === 'penting'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : form.pengumumanJenis === 'kejayaan'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-blue-50/90 border-blue-300 text-blue-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {form.pengumumanJenis === 'amaran' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : form.pengumumanJenis === 'penting' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  ) : form.pengumumanJenis === 'kejayaan' ? (
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm">{form.pengumumanTajuk || 'Tajuk Hebahan'}</span>
                    <span className="text-[10px] opacity-75 font-medium">({form.pengumumanTarikh || 'Tarikh'})</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {form.pengumumanMesej || 'Kandungan mesej hebahan akan kelihatan di sini.'}
                  </p>
                </div>
              </div>

              {form.teksPautanPengumuman && (
                <div className="shrink-0 self-end sm:self-center">
                  <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-current text-xs font-bold inline-flex items-center gap-1.5 shadow-xs">
                    <span>{form.teksPautanPengumuman}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= SEKSYEN 3: KAD KPI & KETERLIHATAN WIDGET ================= */}
      {activeSection === 'kpi' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Kawalan Keterlihatan Kad KPI (Widget Kemenjadian Murid)</span>
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Togol mana-mana kad KPI mengikut keperluan dan fokus semakan pihak pentadbir sekolah.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAllKpi(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllKpi(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
              >
                Nyahpilih Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {kpiItems.map((item) => {
              const IconComp = item.icon;
              const isChecked = form.kpiCards[item.key] !== false;

              return (
                <label
                  key={item.key}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-white border-blue-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight block">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {isChecked ? 'DIPAPARKAN' : 'DISEMBUNYIKAN'}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        setForm({
                          ...form,
                          kpiCards: {
                            ...form.kpiCards,
                            [item.key]: e.target.checked
                          }
                        });
                      }}
                      className="w-4.5 h-4.5 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SEKSYEN 4: PANEL INTERVENSI & TUGASAN ================= */}
      {activeSection === 'panel' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi Panel Kandungan, Tindakan Segera & Jadual</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Kawal paparan senarai murid berisiko cicir dan tindakan susulan mesyuarat jawatankuasa HEM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Had Bilangan Murid dalam Panel Tindakan Segera</span>
                <span className="text-blue-700 font-extrabold text-sm">{form.hadSenaraiTindakanSegera} Murid</span>
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={form.hadSenaraiTindakanSegera}
                onChange={e => setForm({ ...form, hadSenaraiTindakanSegera: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>2 Murid (Kompak)</span>
                <span>4 (Lalai)</span>
                <span>10 Murid (Penuh)</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparPanelTindakanSegera !== false}
                  onChange={e => setForm({ ...form, paparPanelTindakanSegera: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Papar Panel Tindakan Segera</span>
                  <span className="text-[10px] text-slate-500">Senarai murid melepasi ambang Amaran 2 & 3 untuk intervensi pantas</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparPanelMesyuarat !== false}
                  onChange={e => setForm({ ...form, paparPanelMesyuarat: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Papar Panel Mesyuarat HEM</span>
                  <span className="text-[10px] text-slate-500">Tindakan susulan dan amanah pegawai mesyuarat yang belum selesai</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparBarisPintasPantas !== false}
                  onChange={e => setForm({ ...form, paparBarisPintasPantas: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Papar Baris Modul Pantas</span>
                  <span className="text-[10px] text-slate-500">3 kad akses modul (3K/Kesihatan, Pengawas Sekolah, Takwim HEM)</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEKSYEN 5: ANALISIS & CARTA KEHADIRAN ================= */}
      {activeSection === 'carta' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              <span>Konfigurasi Analisis Statistik & Carta Dashboard</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Pilih julat hari analisis trend dan tentukan carta visual yang ingin dipaparkan.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <label className="font-bold text-slate-800 block">
              Julat Hari Analisis Carta Trend Kehadiran:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { val: 7, label: '7 Hari Terkini', desc: 'Pemantauan trend seminggu yang padat' },
                { val: 14, label: '14 Hari Terkini', desc: 'Analisis dwi-mingguan berkala' },
                { val: 30, label: '30 Hari Terkini (Lalai)', desc: 'Analisis trend bulanan komprehensif' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setForm({ ...form, julatHariGrafTrend: opt.val as any })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.julatHariGrafTrend === opt.val
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3 text-xs">
              Keterlihatan Komponen Carta & Analisis:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparCartaTrend !== false}
                  onChange={e => setForm({ ...form, paparCartaTrend: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Carta Trend Kehadiran Sekolah</span>
                  <span className="text-[10px] text-slate-500">Carta garis harian berbanding sasaran KPM</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparCartaTingkatan !== false}
                  onChange={e => setForm({ ...form, paparCartaTingkatan: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Carta Kehadiran Mengikut Tingkatan</span>
                  <span className="text-[10px] text-slate-500">Carta bar peratus kehadiran Tingkatan 1 hingga 5</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparTaburanJantina !== false}
                  onChange={e => setForm({ ...form, paparTaburanJantina: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Taburan Enrolmen & Jantina</span>
                  <span className="text-[10px] text-slate-500">Pecahan bilangan murid lelaki dan perempuan</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.paparKelasTerendah !== false}
                  onChange={e => setForm({ ...form, paparKelasTerendah: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800 block">5 Kelas Kehadiran Terendah</span>
                  <span className="text-[10px] text-slate-500">Senarai kelas yang memerlukan tindakan intensif guru kelas</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bar Simpan Bawah (Sticky/Footer Action Bar) */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            Perubahan konfigurasi akan disimpan ke storan sistem sekolah serta-merta tanpa mengganggu data murid.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            Batal & Buka Dashboard
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Sedang Menyimpan...' : 'Simpan Konfigurasi Dashboard'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
