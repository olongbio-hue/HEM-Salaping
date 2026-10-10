import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { BullyingReport, AwarenessProgram } from '../types';
import {
  getBullyingReports,
  saveBullyingReport,
  getAwarenessPrograms,
  saveAwarenessProgram
} from '../services/dataService';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  Search,
  Filter,
  Plus,
  BookOpen,
  Eye,
  Lock,
  ExternalLink,
  Info,
  Calendar,
  Building,
  FileText
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const BullyingCPP: React.FC = () => {
  const { currentUser } = useAuth();
  const { rules, showToast } = useSchool();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<BullyingReport[]>([]);
  const [programs, setPrograms] = useState<AwarenessProgram[]>([]);

  const [activeTab, setActiveTab] = useState<'pelaporan' | 'pemantauan' | 'penyedaran' | 'panduan'>('pelaporan');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');

  // Selected report for investigation / follow-up modal
  const [selectedReport, setSelectedReport] = useState<BullyingReport | null>(null);
  const [actionStatus, setActionStatus] = useState<BullyingReport['status']>('siasatan');
  const [actionNotes, setActionNotes] = useState('');
  const [semakan1MingguNote, setSemakan1MingguNote] = useState('');
  const [semakan1BulanNote, setSemakan1BulanNote] = useState('');

  // Add Awareness Program Modal
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [progNama, setProgNama] = useState('');
  const [progTarikh, setProgTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [progSasaran, setProgSasaran] = useState('Semua Murid Tingkatan 1 - 5');
  const [progPenceramah, setProgPenceramah] = useState('Pegawai Perhubungan Sekolah (PPS) PDRM / GBK');
  const [progCatatan, setProgCatatan] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const operator = currentUser || { uid: 'auth_user', nama: 'Pegawai HEM' };
        const [repList, progList] = await Promise.all([
          getBullyingReports(operator),
          getAwarenessPrograms()
        ]);
        setReports(repList);
        setPrograms(progList);
      } catch (err) {
        console.error('Ralat memuatkan data buli & CPP:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Check if a report has had no updates for > 7 days
  const isStale = (report: BullyingReport) => {
    if (report.status === 'selesai') return false;
    const lastUpdate = new Date(report.tarikhKemaskini).getTime();
    const now = new Date(2026, 9, 9).getTime(); // Oct 9, 2026 current time
    const diffDays = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  };

  const staleReports = reports.filter(r => isStale(r));

  // Save report update
  const handleSaveAction = async () => {
    if (!selectedReport) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const updated: BullyingReport = {
        ...selectedReport,
        status: actionStatus,
        catatanTindakan: actionNotes || selectedReport.catatanTindakan,
        tarikhKemaskini: today,
        dikendalikanOleh: currentUser?.nama || 'GPK HEM'
      };

      if (semakan1MingguNote) {
        updated.semakan1Minggu = {
          tarikh: today,
          catatan: semakan1MingguNote,
          keadaanMangsa: 'Emosi stabil dan selamat',
          selesai: true,
          pegawaiNama: currentUser?.nama || 'GBK'
        };
      }

      if (semakan1BulanNote) {
        updated.semakan1Bulan = {
          tarikh: today,
          catatan: semakan1BulanNote,
          keadaanMangsa: 'Bebas daripada sebarang ancaman',
          selesai: true,
          pegawaiNama: currentUser?.nama || 'GBK'
        };
      }

      const operator = currentUser || { uid: 'system', nama: 'GPK HEM' };
      await saveBullyingReport(updated, operator, false);

      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(null);
      showToast(`Tindakan ke atas aduan ${updated.noAduan} berjaya dikemaskini.`, 'success');
    } catch (err) {
      showToast('Gagal mengemaskini tindakan aduan.', 'error');
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progNama) return;
    try {
      const newProg: AwarenessProgram = {
        id: `prog_${Date.now()}`,
        namaProgram: progNama,
        tarikh: progTarikh,
        sasaran: progSasaran,
        penceramah: progPenceramah,
        catatan: progCatatan
      };
      const operator = currentUser || { uid: 'system', nama: 'GPK HEM' };
      await saveAwarenessProgram(newProg, operator);
      setPrograms(prev => [newProg, ...prev]);
      setShowAddProgram(false);
      setProgNama('');
      setProgCatatan('');
      showToast('Program kesedaran anti-buli berjaya direkodkan!', 'success');
    } catch (err) {
      showToast('Gagal merekod program kesedaran.', 'error');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterKategori !== 'semua' && r.kategoriBuli !== filterKategori) return false;
    if (filterStatus !== 'semua' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNo = r.noAduan.toLowerCase().includes(q);
      const matchMangsa = r.mangsaNama.toLowerCase().includes(q);
      const matchKeterangan = r.keterangan.toLowerCase().includes(q);
      if (!matchNo && !matchMangsa && !matchKeterangan) return false;
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-800 text-rose-200 border border-rose-700">
              Dasar Perlindungan Kanak-Kanak (CPP) KPM
            </span>
            <span className="text-xs text-rose-300">
              Akses Khas: Pengetua, GPK HEM, Ketua Disiplin, GBK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Pengurusan Aduan Buli & Perlindungan Kanak-Kanak
          </h1>
          <p className="text-xs sm:text-sm text-rose-200 mt-1 max-w-2xl">
            Sistem pengesanan, penyiasatan dan pemantauan mangsa mengikut 4 Aspek KPM: Penyedaran, Pelaporan, Pemantauan, dan Tindakan.
          </p>
        </div>

        {/* Action Button: Pautan ke Borang Awam */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/aduan-buli')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Borang Awam Murid/Waris</span>
          </button>
        </div>
      </div>

      {/* Alert Banner: Kes Tiada Kemas Kini Lebih 7 Hari */}
      {staleReports.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-amber-900 block">
                Peringatan Automatik: {staleReports.length} Kes Buli Tiada Kemas Kini &gt; 7 Hari
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Mengikut SOP CPP KPM, setiap kes aktif wajib disemak dan dikemas kini sekurang-kurangnya sekali seminggu.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {staleReports.map(sr => (
              <button
                key={sr.id}
                onClick={() => {
                  setSelectedReport(sr);
                  setActionStatus(sr.status);
                  setActionNotes(sr.catatanTindakan || '');
                }}
                className="px-2.5 py-1 bg-white border border-amber-400 rounded-lg font-bold text-amber-950 hover:bg-amber-100"
              >
                {sr.noAduan} (Mangsa: {sr.mangsaNama})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs 4 Aspek KPM */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('pelaporan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pelaporan' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>1. Pelaporan Aduan ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pemantauan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pemantauan' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Pemantauan Mangsa (1 Minggu & 1 Bulan)</span>
        </button>

        <button
          onClick={() => setActiveTab('penyedaran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'penyedaran' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>3. Penyedaran & Kempen ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('panduan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'panduan' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>4. Panduan Rujukan (Polis / JKM / PPD)</span>
        </button>
      </div>

      {/* ================= TAB 1: PELAPORAN ADUAN ================= */}
      {activeTab === 'pelaporan' && (
        <div className="space-y-4">
          {/* Filter Strip */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nombor aduan, nama mangsa..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterKategori}
                onChange={e => setFilterKategori(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Kategori Buli</option>
                <option value="fizikal">Buli Fizikal</option>
                <option value="lisan">Buli Lisan</option>
                <option value="sosial">Buli Sosial</option>
                <option value="siber">Buli Siber</option>
                <option value="seksual">Gangguan Seksual</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Status</option>
                <option value="baru">Aduan Baharu</option>
                <option value="siasatan">Dalam Siasatan</option>
                <option value="tindakan">Tindakan Diambil</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* List of Reports */}
          <div className="space-y-3">
            {filteredReports.map(r => {
              const stale = isStale(r);
              return (
                <div
                  key={r.id}
                  className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-xs transition-all space-y-3 ${
                    stale ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{r.noAduan}</span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-rose-100 text-rose-800">
                        Buli {r.kategoriBuli}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          r.tahapSegera === 'kritikal_segera'
                            ? 'bg-red-600 text-white'
                            : r.tahapSegera === 'tinggi'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Tahap: {r.tahapSegera.replace('_', ' ')}
                      </span>
                      {r.aduanAnonim && (
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700">
                          Anonim (Rahsia)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Tarikh: {r.tarikhAduan}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                          r.status === 'selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900">
                      Mangsa: <span className="text-blue-900">{r.mangsaNama}</span> ({r.mangsaKelas}) • Lokasi: {r.lokasi}
                    </p>
                    <p className="text-slate-600 font-medium">
                      Pihak Terlibat / Pelaku: <span className="text-rose-800">{r.pihakTerlibat}</span>
                    </p>
                    <p className="text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {r.keterangan}
                    </p>
                  </div>

                  {r.catatanTindakan && (
                    <div className="p-2.5 bg-rose-50/50 rounded-xl text-xs text-rose-900 border border-rose-100">
                      <strong>Tindakan Jawatankuasa:</strong> {r.catatanTindakan}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400">
                      Tarikh Kemaskini: <strong>{r.tarikhKemaskini}</strong> {stale && <span className="text-amber-700 font-bold ml-1">(Tiada kemaskini &gt; 7 hari)</span>}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedReport(r);
                        setActionStatus(r.status);
                        setActionNotes(r.catatanTindakan || '');
                        setSemakan1MingguNote(r.semakan1Minggu?.catatan || '');
                        setSemakan1BulanNote(r.semakan1Bulan?.catatan || '');
                      }}
                      className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-2xs"
                    >
                      Kemas Kini Siasatan / Tindakan
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <EmptyState
                title="Tiada Aduan Ditemui"
                description="Tiada rekod aduan buli yang sepadan dengan tapisan semasa."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PEMANTAUAN MANGSA ================= */}
      {activeTab === 'pemantauan' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Penjejakan Kesan Kepada Mangsa (Semakan 1 Minggu & 1 Bulan)
            </h3>
            <p className="text-slate-500 mt-0.5">
              Setiap mangsa buli dipantau secara berjadual bagi memastikan pemulihan emosi, fizikal, dan keyakinan diri di sekolah.
            </p>
          </div>

          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{r.mangsaNama} ({r.mangsaKelas})</span>
                    <span className="text-slate-500 ml-2">No. Aduan: {r.noAduan}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-blue-100 text-blue-800">
                    Buli {r.kategoriBuli}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Semakan 1 Minggu */}
                  <div className={`p-3 rounded-xl border ${
                    r.semakan1Minggu?.selesai
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Semakan 1 Minggu Pasca-Insiden</span>
                      {r.semakan1Minggu?.selesai ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                    </div>
                    {r.semakan1Minggu ? (
                      <p className="text-[11px] leading-relaxed">
                        {r.semakan1Minggu.catatan} (Pegawai: {r.semakan1Minggu.pegawaiNama} • {r.semakan1Minggu.tarikh})
                      </p>
                    ) : (
                      <p className="text-[11px] italic text-amber-800">Belum disemak. Sila jadualkan sesi bersama mangsa.</p>
                    )}
                  </div>

                  {/* Semakan 1 Bulan */}
                  <div className={`p-3 rounded-xl border ${
                    r.semakan1Bulan?.selesai
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span>Semakan 1 Bulan Pasca-Insiden</span>
                      {r.semakan1Bulan?.selesai ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-500" />}
                    </div>
                    {r.semakan1Bulan?.selesai ? (
                      <p className="text-[11px] leading-relaxed">
                        {r.semakan1Bulan.catatan} (Pegawai: {r.semakan1Bulan.pegawaiNama} • {r.semakan1Bulan.tarikh})
                      </p>
                    ) : (
                      <p className="text-[11px] italic text-slate-500">
                        {r.semakan1Bulan ? r.semakan1Bulan.catatan : 'Dalam jadual giliran pemantauan.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PENYEDARAN & KEMPEN ================= */}
      {activeTab === 'penyedaran' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Log Program Kesedaran Anti-Buli & Perlindungan Kanak-Kanak
              </h3>
              <p className="text-slate-500">Aktiviti pencegahan awal peringkat SMK Salaping</p>
            </div>
            <button
              onClick={() => setShowAddProgram(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program</span>
            </button>
          </div>

          <div className="space-y-3">
            {programs.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">{p.namaProgram}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{p.tarikh}</span>
                </div>
                <p className="text-slate-600">
                  Sasaran: <strong>{p.sasaran}</strong> • Penceramah: <strong>{p.penceramah}</strong>
                </p>
                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                  {p.catatan}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: PANDUAN RUJUKAN PIHAK LUAR ================= */}
      {activeTab === 'panduan' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Panduan Pantas Rujukan Agensi Luar (SOP KPM & Undang-Undang)
            </h3>
            <p className="text-slate-500 mt-0.5">
              Ketetapan bila kes mesti dirujuk kepada Polis Diraja Malaysia, JKM atau Pejabat Pendidikan Daerah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rujukan Polis */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-blue-950">
              <div className="flex items-center gap-2 font-black text-sm text-blue-900">
                <Building className="w-4 h-4 text-blue-700" />
                <span>1. Polis Diraja Malaysia (PDRM)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {rules.panduanLaporPihakLuar?.syaratPolis || 'Laporkan kepada IPD Kota Marudu (088-661222) jika kes melibatkan jenayah berat, senjata, pemerasan, atau pergaduhan mencederakan.'}
              </p>
              <div className="pt-2 border-t border-blue-200/80 font-bold text-[11px]">
                Hubungi: IPD Kota Marudu (088-661222)
              </div>
            </div>

            {/* Rujukan JKM */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-amber-950">
              <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                <Info className="w-4 h-4 text-amber-700" />
                <span>2. Jabatan Kebajikan Masyarakat (JKM)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {rules.panduanLaporPihakLuar?.syaratJKM || 'Rujuk Pegawai Pelindung Kanak-Kanak JKM Daerah Kota Marudu bagi kes penderaan fizikal/emosi/seksual atau pengabaian waris di bawah Akta Kanak-Kanak 2001.'}
              </p>
              <div className="pt-2 border-t border-amber-200/80 font-bold text-[11px]">
                Talian Kasih: 15999 / JKM Kota Marudu
              </div>
            </div>

            {/* Rujukan PPD */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-rose-950">
              <div className="flex items-center gap-2 font-black text-sm text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
                <span>3. Pejabat Pendidikan Daerah (PPD)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {rules.panduanLaporPihakLuar?.syaratPPD || 'Laporan serta-merta kepada Pegawai Pendidikan Daerah / Pegawai Meja HEM PPD Kota Marudu mengikut garis masa 1:3:7 jam bagi kes profil tinggi.'}
              </p>
              <div className="pt-2 border-t border-rose-200/80 font-bold text-[11px]">
                Unit HEM PPD Kota Marudu
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tindakan / Siasatan Aduan */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Tindakan & Siasatan Aduan: {selectedReport.noAduan}
            </h3>
            <p className="text-slate-500 mb-3">
              Mangsa: <strong>{selectedReport.mangsaNama}</strong> ({selectedReport.mangsaKelas}) • Pelaku: {selectedReport.pihakTerlibat}
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Status Aliran Siasatan</label>
                <select
                  value={actionStatus}
                  onChange={e => setActionStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  <option value="baru">Aduan Baharu</option>
                  <option value="siasatan">Dalam Siasatan (Temu Duga Saksi/Pelaku)</option>
                  <option value="tindakan">Tindakan Tatatertib / Intervensi Dijalankan</option>
                  <option value="pantauan">Dalam Pemantauan Pasca-Tindakan</option>
                  <option value="selesai">Selesai Sepenuhnya</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Catatan Tindakan Jawatankuasa</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder="Keterangan tindakan tatatertib, perjumpaan penjaga, atau khidmat kaunseling..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block">Semakan Pasca-Insiden (Kebajikan Mangsa):</span>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Semakan 1 Minggu</label>
                  <input
                    type="text"
                    value={semakan1MingguNote}
                    onChange={e => setSemakan1MingguNote(e.target.value)}
                    placeholder="Contoh: Mangsa tenang dan hadir ke sekolah tanpa ancaman."
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Semakan 1 Bulan</label>
                  <input
                    type="text"
                    value={semakan1BulanNote}
                    onChange={e => setSemakan1BulanNote(e.target.value)}
                    placeholder="Contoh: Pemantauan UBK mendapati mangsa ceria dan pulih sepenuhnya."
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAction}
                className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
              >
                Simpan Kemas Kini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Program Kesedaran */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Program Kesedaran Anti-Buli</h3>
            <p className="text-slate-500 mb-4">Aktiviti Pencegahan Murid SMK Salaping</p>

            <form onSubmit={handleSaveProgram} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Nama Program *</label>
                <input
                  type="text"
                  required
                  value={progNama}
                  onChange={e => setProgNama(e.target.value)}
                  placeholder="Contoh: Ceramah Hentikan Buli & Hargai Diri"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tarikh Program</label>
                <input
                  type="date"
                  value={progTarikh}
                  onChange={e => setProgTarikh(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Kumpulan Sasaran</label>
                <input
                  type="text"
                  value={progSasaran}
                  onChange={e => setProgSasaran(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Penceramah / Fasilitator</label>
                <input
                  type="text"
                  value={progPenceramah}
                  onChange={e => setProgPenceramah(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Catatan & Impak Program</label>
                <textarea
                  rows={3}
                  value={progCatatan}
                  onChange={e => setProgCatatan(e.target.value)}
                  placeholder="Catatan pelaksanaan..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
