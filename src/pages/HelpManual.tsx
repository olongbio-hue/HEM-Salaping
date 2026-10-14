import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  CheckCircle2,
  Users,
  CalendarCheck,
  ShieldAlert,
  HeartHandshake,
  Award,
  Home,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  Smartphone,
  WifiOff,
  ClipboardCheck,
  Lock,
  ExternalLink
} from 'lucide-react';

export const HelpManual: React.FC = () => {
  const { school } = useSchool();
  const { currentUser } = useAuth();

  const [activeRoleTab, setActiveRoleTab] = useState<
    'gpk' | 'guru_kelas' | 'disiplin' | 'kaunseling' | 'warden' | 'biasiswa' | 'public' | 'uat'
  >('gpk');

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Pusat Bantuan & Panduan Pengguna • SMK Salaping</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manual Pengguna Ringkas & Panduan Operasi
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Langkah demi langkah penggunaan sistem HEM Digital mengikut peranan kakitangan dan senarai semak UAT.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors shrink-0 no-print"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Panduan</span>
        </button>
      </div>

      {/* Role Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveRoleTab('gpk')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'gpk' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pengetua & GPK HEM</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('guru_kelas')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'guru_kelas' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Guru Kelas</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('disiplin')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'disiplin' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Guru Disiplin</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('kaunseling')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'kaunseling' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Guru Kaunseling (UBK)</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('warden')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'warden' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Warden Asrama</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('biasiswa')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'biasiswa' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Penyelaras Biasiswa</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('public')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'public' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Ibu Bapa / Awam</span>
        </button>

        <button
          onClick={() => setActiveRoleTab('uat')}
          className={`flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeRoleTab === 'uat' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Senarai Semak UAT GPK HEM</span>
        </button>
      </div>

      {/* ================= TAB 1: PENGETUA & GPK HEM ================= */}
      {activeRoleTab === 'gpk' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Operasi Pengetua & GPK Hal Ehwal Murid</h2>
            <p className="text-slate-500 text-xs">Pemantauan eksekutif keseluruhan sekolah, keputusan tatatertib berat, dan pengurusan intervensi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-extrabold text-blue-700 block text-xs">Langkah 1: Pemantauan Dashboard Utama</span>
              <p className="text-slate-600 leading-relaxed">
                Log masuk ke aplikasi untuk melihat KPI kehadiran harian berbanding sasaran 90%, 5 kelas terendah, kes disiplin aktif, serta tugasan tertunggak mesyuarat HEM.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-extrabold text-blue-700 block text-xs">Langkah 2: Panel Intervensi Murid Cicir (SOP 1:3:7)</span>
              <p className="text-slate-600 leading-relaxed">
                Buka menu <strong>Murid Berisiko Cicir</strong> untuk menyemak murid pada tahap Amaran 1, 2, atau 3. Sahkan surat amaran dan pantau tindakan kaunselor atau lawatan ziarah cakna.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-extrabold text-blue-700 block text-xs">Langkah 3: Keputusan Hukuman Berat (Gantung/Buang)</span>
              <p className="text-slate-600 leading-relaxed">
                Sistem menghalang sebarang hukuman gantung atau buang sekolah melainkan langkah <em>Pertuduhan &amp; Bela Diri</em> serta <em>Sesi Kaunseling UBK</em> ditanda lengkap. Hanya Pengetua/GPK HEM dibenarkan memasukkan keputusan ini.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="font-extrabold text-blue-700 block text-xs">Langkah 4: Tetapan Sekolah &amp; Audit Keselamatan</span>
              <p className="text-slate-600 leading-relaxed">
                Uruskan peranan guru dalam modul Tetapan. Buka <strong>Log Audit</strong> untuk memantau sebarang tindakan eksport, kemas kini peranan, atau akses fail sulit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: GURU KELAS ================= */}
      {activeRoleTab === 'guru_kelas' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Guru Kelas: Perekodan Kehadiran &lt; 1 Minit</h2>
            <p className="text-slate-500 text-xs">Direka khas untuk kelajuan operasi menggunakan telefon bimbit setiap pagi.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <strong className="block text-slate-900">Buka Menu "Kehadiran Harian":</strong>
                <p className="text-slate-600 text-xs mt-0.5">Sistem secara automatik memilih kelas yang anda ajar (cth: 3 Marikh) dan tarikh hari ini.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <strong className="block text-slate-900">Tanda Murid Tidak Hadir Sahaja:</strong>
                <p className="text-slate-600 text-xs mt-0.5">Semua murid ditanda "Hadir" secara lalai. Anda hanya perlu menekan murid yang tidak hadir (merah), lewat (kuning), atau cuti sakit (biru).</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <strong className="block text-slate-900">Tekan "Simpan &amp; Hantar":</strong>
                <p className="text-slate-600 text-xs mt-0.5">Sistem menghantar peratus kehadiran ke papan pemuka sekolah serta-merta. Jika tiada liputan internet di dalam kelas, data disimpan setempat dalam telefon secara automatik.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GURU DISIPLIN ================= */}
      {activeRoleTab === 'disiplin' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Guru Disiplin: Pengurusan Kes &amp; Eksport SSDM</h2>
            <p className="text-slate-500 text-xs">Mencatat salah laku dan tindakan tanpa sistem merit tolak markah, selaras SSDM asal.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <strong className="text-slate-900 block text-xs">Rekod Kes Baharu:</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Pilih murid terlibat, tarikh/masa kejadian, tempat (cth: Kantin, Blok A), kategori salah laku, saksi, dan penerangan ringkas.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <strong className="text-slate-900 block text-xs">Jejak Aliran Kes:</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Kemas kini status: <em>Dilaporkan &rarr; Disiasat &rarr; Pertuduhan &amp; Bela Diri &rarr; Kaunseling &rarr; Keputusan &rarr; Selesai</em>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <strong className="text-slate-900 block text-xs">Jadualkan Lembaga Disiplin:</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Gunakan tab "Lembaga Disiplin" untuk menjana sidang tatatertib rasmi sekolah, senarai ahli panel, bukti, dan tarikh susulan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <strong className="text-slate-900 block text-xs">Eksport CSV untuk SSDM:</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Tekan butang "Eksport untuk SSDM (CSV)" bagi menjana fail format serasi untuk dimuat naik secara manual ke portal rasmi KPM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: GBK ================= */}
      {activeRoleTab === 'kaunseling' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Guru Bimbingan &amp; Kaunseling (UBK)</h2>
            <p className="text-slate-500 text-xs">Kerahsiaan maklumat dilindungi dengan penyulitan kriptografi Web Crypto AES-GCM.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
              <strong className="text-purple-900 text-xs block">1. Sesi Kaunseling Individu / Kelompok:</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Semua catatan sesi disulitkan dalam pelayar anda sebelum disimpan. Pihak pentadbir hanya dapat melihat jumlah bilangan sesi yang dijalankan tanpa mendedahkan nota rahsia klien.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
              <strong className="text-purple-900 text-xs block">2. Saringan Kesihatan Mental (DASS):</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Rekodkan markah Stres, Keresahan, dan Kemurungan murid. Sekiranya tahap berada pada paras "Sangat Teruk", sistem menyediakan penanda segera bagi rujukan ke Klinik/Hospital Kota Marudu.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
              <strong className="text-purple-900 text-xs block">3. Hala Tuju Pasca-SPM (Kerjaya):</strong>
              <p className="text-slate-600 text-xs leading-relaxed">
                Bimbing murid Tingkatan 4 dan 5 mengenai laluan TVET (IKM, ILP, Kolej Vokasional), Tingkatan 6, atau Matrikulasi Labuan mengikut minat RIASEC murid.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: WARDEN ================= */}
      {activeRoleTab === 'warden' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Pengurusan Asrama Desa</h2>
            <p className="text-slate-500 text-xs">Blok Kinabalu (Putera) dan Blok Tambuyukon (Puteri) SMK Salaping.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-slate-900 text-xs block">Permit Keluar / Outing:</strong>
              <p className="text-slate-600 text-xs">
                Kemas kini kelulusan permit pulang bermalam atau urusan keluarga. Sahkan kepulangan murid setibanya di asrama.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-slate-900 text-xs block">Spot-Check &amp; Kebersihan:</strong>
              <p className="text-slate-600 text-xs">
                Catatkan markah kebersihan kamar mingguan dan sebarang penemuan barang larangan untuk tindakan segera.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-slate-900 text-xs block">Roll Call Malam:</strong>
              <p className="text-slate-600 text-xs">
                Kira bilangan murid hadir di kamar setiap jam 9:30 malam dan rekodkan laporan harian warden bertugas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: PENYELARAS BIASISWA ================= */}
      {activeRoleTab === 'biasiswa' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Panduan Penyelaras Biasiswa &amp; Bantuan Murid</h2>
            <p className="text-slate-500 text-xs">BAP, KWAPM, BKP, RMT, SPBT, dan sumbangan komuniti/PIBG.</p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1">
              <strong className="text-teal-900 text-xs block">1. Semakan Pertindihan Penerima:</strong>
              <p className="text-slate-600 text-xs">
                Gunakan tab "Penerima Bantuan" untuk menyemak senarai murid yang telah menerima KWAPM agar tiada pertindihan dengan BKP mengikut pekeliling kewangan KPM.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1">
              <strong className="text-teal-900 text-xs block">2. Perakuan &amp; Agihan:</strong>
              <p className="text-slate-600 text-xs">
                Tanda semak murid yang telah menerima agihan beserta tarikh terima dan nama penjaga yang hadir mengambil bantuan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: AWAM / IBU BAPA ================= */}
      {activeRoleTab === 'public' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900">Portal Awam Aduan Buli (KPM Child Protection Policy)</h2>
            <p className="text-slate-500 text-xs">Pautan awam yang selamat dan tidak memerlukan log masuk: <code>/aduan-buli</code></p>
          </div>

          <div className="space-y-3">
            <p className="text-slate-600 leading-relaxed">
              Ibu bapa, murid, atau saksi boleh melayari pautan rasmi aduan tanpa perlu mempunyai akaun kakitangan sekolah. Pengadu boleh memilih untuk memasukkan nama atau menghantar aduan secara <strong>Tanpa Nama (Anonim)</strong> demi melindungi keselamatan pengadu.
            </p>
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold flex items-center justify-between">
              <span>Pautan Rasmi Aduan: /aduan-buli</span>
              <a
                href="/aduan-buli"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs hover:bg-emerald-800"
              >
                <span>Buka Portal Aduan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 8: UAT CHECKLIST (GPK HEM) ================= */}
      {activeRoleTab === 'uat' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs sm:text-sm">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Senarai Semak Ujian Penerimaan Pengguna (UAT Checklist)
              </h2>
              <p className="text-slate-500 text-xs">
                Dokumen pengesahan rasmi untuk disemak dan ditandatangani oleh GPK HEM SMK Salaping sebelum pelaksanaan penuh.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs shrink-0">
              Versi Fasa 4 (Pengerasan Keselamatan)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800">
                  <th className="border border-slate-200 p-2 text-center w-12">Bil</th>
                  <th className="border border-slate-200 p-2 text-left">Modul / Senario Ujian</th>
                  <th className="border border-slate-200 p-2 text-left">Hasil Jangkaan</th>
                  <th className="border border-slate-200 p-2 text-center w-28">Status</th>
                  <th className="border border-slate-200 p-2 text-left w-36">Catatan Penguji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">1</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Perekodan Kehadiran Harian</strong>
                    <p className="text-slate-500 text-[11px]">Guru kelas menanda kehadiran dan menekan Simpan.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Data berjaya disimpan dalam masa &lt; 1 minit, peratus kelas dikemas kini.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Responsif telefon</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">2</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Formula Amaran Cicir SOP 1:3:7</strong>
                    <p className="text-slate-500 text-[11px]">Murid tidak hadir 3, 10, dan 20 hari berturut-turut.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Sistem menjana Amaran 1, 2, dan 3 dengan templat surat rasmi KPM.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Vitest lulus</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">3</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Sekatan Kes Berat (Disiplin)</strong>
                    <p className="text-slate-500 text-[11px]">Percubaan gantung/buang tanpa langkah pertuduhan/kaunseling.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Sistem menyekat penutupan kes; mesej halangan tatatertib dipaparkan.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Rules diuji</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">4</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Portal Aduan Buli Awam</strong>
                    <p className="text-slate-500 text-[11px]">Hantar aduan melalui <code>/aduan-buli</code> tanpa log masuk.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Aduan diterima secara selamat, disimpan, dan nombor rujukan dijana.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Pautan selamat</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">5</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Topeng No. KP &amp; Jejak Audit</strong>
                    <p className="text-slate-500 text-[11px]">Pengguna membuka paparan No. KP murid penuh.</p>
                  </td>
                  <td className="border border-slate-200 p-2">No. KP dipaparkan dan rekod akses dicatat secara kekal dalam Log Audit.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Pematuhan APDP</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">6</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Tamat Sesi Auto (Inactivity Timeout)</strong>
                    <p className="text-slate-500 text-[11px]">Pengguna tidak aktif selama 30 minit.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Sistem memaparkan amaran pada minit ke-28 dan auto log keluar pada minit ke-30.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Keselamatan aktif</td>
                </tr>

                <tr>
                  <td className="border border-slate-200 p-2 text-center font-bold">7</td>
                  <td className="border border-slate-200 p-2">
                    <strong>Ketahanan Luar Talian &amp; Sandaran JSON</strong>
                    <p className="text-slate-500 text-[11px]">Aplikasi digunakan semasa ketiadaan internet di Kota Marudu.</p>
                  </td>
                  <td className="border border-slate-200 p-2">Operasi berjalan lancar melalui cache setempat; fail sandaran boleh dimuat turun.</td>
                  <td className="border border-slate-200 p-2 text-center font-bold text-emerald-700 bg-emerald-50">LULUS (Pass)</td>
                  <td className="border border-slate-200 p-2 text-[11px]">Sabah-friendly</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tandatangan Pengesahan UAT */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-8">
              <p>Diuji dan Disemak oleh:</p>
              <div>
                <strong className="block underline uppercase">{school.namaGuruData || 'Guru Data & Admin Sistem'}</strong>
                <span className="text-slate-500 text-[11px]">Guru Data &amp; Admin Sistem • {school.nama}</span>
              </div>
            </div>

            <div className="space-y-8">
              <p>Disahkan dan Diterima oleh:</p>
              <div>
                <strong className="block underline uppercase">{school.namaGpkHem || 'GPK Hal Ehwal Murid'}</strong>
                <span className="text-slate-500 text-[11px]">GPK Hal Ehwal Murid • {school.nama}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
