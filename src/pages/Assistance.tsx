import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { AssistanceRecord, AssistanceApplication, Student } from '../types';
import {
  getAssistanceRecords,
  saveAssistanceRecord,
  getAssistanceApplications,
  saveAssistanceApplication,
  getStudents
} from '../services/dataService';
import { DEFAULT_ASSISTANCE_TYPES, DEFAULT_ASSISTANCE_BUDGETS } from '../constants';
import { generateAssistanceRecipientsPDF } from '../services/pdfService';
import {
  Award,
  Download,
  Search,
  CheckCircle2,
  DollarSign,
  Users,
  Plus,
  AlertTriangle,
  FileText,
  Filter,
  Check,
  X,
  FileCheck,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  ShieldAlert
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const Assistance: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem, canManageAssistance } = useAuth();
  const { school, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AssistanceRecord[]>([]);
  const [applications, setApplications] = useState<AssistanceApplication[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [activeTab, setActiveTab] = useState<'senarai' | 'permohonan' | 'bajet' | 'pertindihan'>('senarai');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('semua');
  const [filterYear, setFilterYear] = useState<number>(2026);

  // Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStudentId, setApplyStudentId] = useState('');
  const [applyJenis, setApplyJenis] = useState(DEFAULT_ASSISTANCE_TYPES[0]);
  const [applySebab, setApplySebab] = useState('');
  const [applyDocName, setApplyDocName] = useState('surat_pengesahan_ketua_kampung.pdf');

  // New Recipient Modal
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [recStudentId, setRecStudentId] = useState('');
  const [recJenis, setRecJenis] = useState(DEFAULT_ASSISTANCE_TYPES[0]);
  const [recJumlah, setRecJumlah] = useState(150);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [recList, appList, stList] = await Promise.all([
        getAssistanceRecords(),
        getAssistanceApplications(),
        getStudents()
      ]);
      setRecords(recList);
      setApplications(appList);
      setStudents(stList);
      if (stList.length > 0) {
        setApplyStudentId(stList[0].id);
        setRecStudentId(stList[0].id);
      }
    } catch (err) {
      console.error('Ralat memuatkan data bantuan:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Mark as Received / Signed
  const handleToggleReceived = async (rec: AssistanceRecord) => {
    const operator = currentUser || { uid: 'auth', nama: 'Penyelaras Bantuan' };
    const today = new Date().toISOString().split('T')[0];
    const isNowReceived = rec.statusAgihan !== 'telah_terima';
    const stu = students.find(s => s.id === rec.studentId);
    const parentName = stu?.penjaga[0]?.nama || 'Ibu Bapa / Penjaga';

    const updated: AssistanceRecord = {
      ...rec,
      statusAgihan: isNowReceived ? 'telah_terima' : 'layak',
      tarikhTerima: isNowReceived ? today : undefined,
      disahkanOlehPenjaga: isNowReceived,
      namaPenjagaPenerima: isNowReceived ? parentName : undefined
    };

    await saveAssistanceRecord(updated, operator, false);
    setRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    showToast(
      isNowReceived
        ? `Akukan terima bantuan untuk ${stu?.nama} berjaya disahkan.`
        : `Status agihan ditetapkan semula kepada 'Layak'.`,
      'success'
    );
  };

  // Submit Internal Application
  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find(s => s.id === applyStudentId);
    if (!stu) return;

    try {
      const operator = currentUser || { uid: 'auth', nama: 'Guru' };
      const newApp: AssistanceApplication = {
        id: `app_${Date.now()}`,
        studentId: stu.id,
        jenisBantuan: applyJenis,
        sebab: applySebab || `Keluarga B40 dari ${stu.kampung} memohon bantuan bagi menampung keperluan sekolah.`,
        kategoriPendapatan: stu.kategoriPendapatan,
        dokumenSokongan: applyDocName,
        status: 'baharu',
        tarikhMohon: new Date().toISOString().split('T')[0]
      };

      await saveAssistanceApplication(newApp, operator, true);
      setApplications(prev => [newApp, ...prev]);
      setShowApplyModal(false);
      setApplySebab('');
      showToast('Permohonan bantuan berjaya dihantar ke Jawatankuasa Kebajikan.', 'success');
    } catch (err) {
      showToast('Gagal menghantar permohonan.', 'error');
    }
  };

  // Update Application Status (Disemak -> Disyorkan -> Lulus / Ditolak)
  const handleUpdateAppStatus = async (
    app: AssistanceApplication,
    newStatus: AssistanceApplication['status']
  ) => {
    const operator = currentUser || { uid: 'auth', nama: 'Penyelaras Bantuan' };
    const today = new Date().toISOString().split('T')[0];
    const updated: AssistanceApplication = {
      ...app,
      status: newStatus,
      tarikhStatus: today,
      pegawaiPenyemak: currentUser?.nama || 'Penyelaras Bantuan',
      catatanKelulusan:
        newStatus === 'lulus'
          ? 'Diluluskan oleh Mesyuarat JBMS SMK Salaping.'
          : newStatus === 'ditolak'
          ? 'Pendapatan isi rumah melepasi garis PGK semasa.'
          : 'Dokumen sedang disahkan bersama ketua kampung.'
    };

    await saveAssistanceApplication(updated, operator, false);
    setApplications(prev => prev.map(a => (a.id === app.id ? updated : a)));

    // Jika diluluskan, automatik masukkan ke senarai rekod bantuan
    if (newStatus === 'lulus') {
      const budgetConfig = DEFAULT_ASSISTANCE_BUDGETS[app.jenisBantuan];
      const newRec: AssistanceRecord = {
        id: `rec_${Date.now()}`,
        studentId: app.studentId,
        jenisBantuan: app.jenisBantuan,
        tahun: 2026,
        jumlahBantuan: budgetConfig?.perMurid || 150,
        statusAgihan: 'layak'
      };
      await saveAssistanceRecord(newRec, operator, true);
      setRecords(prev => [newRec, ...prev]);
      showToast(`Permohonan ${newStatus}. Rekod murid dimasukkan ke jadual agihan.`, 'success');
    } else {
      showToast(`Status permohonan dikemaskini kepada '${newStatus}'.`, 'info');
    }
  };

  // Add Direct Recipient
  const handleAddDirectRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find(s => s.id === recStudentId);
    if (!stu) return;

    try {
      const operator = currentUser || { uid: 'auth', nama: 'Penyelaras Bantuan' };
      const newRec: AssistanceRecord = {
        id: `rec_${Date.now()}`,
        studentId: stu.id,
        jenisBantuan: recJenis,
        tahun: 2026,
        jumlahBantuan: Number(recJumlah),
        statusAgihan: 'layak'
      };

      await saveAssistanceRecord(newRec, operator, true);
      setRecords(prev => [newRec, ...prev]);
      setShowAddRecipientModal(false);
      showToast(`Murid ${stu.nama} berjaya ditambah ke senarai penerima ${recJenis}.`, 'success');
    } catch (err) {
      showToast('Gagal menambah penerima bantuan.', 'error');
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    try {
      const pdf = generateAssistanceRecipientsPDF(
        filteredRecords,
        students,
        school,
        filterType === 'semua' ? 'Semua Skim Bantuan' : filterType,
        filterYear
      );
      pdf.save(`Akuan_Penyerahan_Bantuan_${filterType.replace(/\s+/g, '_')}_${filterYear}.pdf`);
      showToast('Dokumen PDF rasmi berjaya dimuat turun.', 'success');
    } catch (err) {
      showToast('Gagal menjana PDF.', 'error');
    }
  };

  // Export CSV / Excel
  const handleExportCSV = () => {
    const headers = ['Bil', 'No Murid', 'Nama Murid', 'Kelas', 'Kategori Pendapatan', 'Jenis Bantuan', 'Tahun', 'Jumlah (RM)', 'Status Agihan', 'Tarikh Diserah', 'Penerima'];
    const rows = filteredRecords.map((r, i) => {
      const stu = students.find(s => s.id === r.studentId);
      return [
        i + 1,
        `"${stu?.noMurid || ''}"`,
        `"${stu?.nama || ''}"`,
        `"${stu?.kelas || ''}"`,
        `"${stu?.kategoriPendapatan || ''}"`,
        `"${r.jenisBantuan}"`,
        r.tahun,
        r.jumlahBantuan,
        `"${r.statusAgihan}"`,
        `"${r.tarikhTerima || '-'}"`,
        `"${r.namaPenjagaPenerima || '-'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Senarai_Penerima_Bantuan_SMKS_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fail CSV berjaya dieksport.', 'success');
  };

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (filterYear && r.tahun !== filterYear) return false;
    if (filterType !== 'semua' && r.jenisBantuan !== filterType) return false;
    if (searchTerm) {
      const stu = students.find(s => s.id === r.studentId);
      const q = searchTerm.toLowerCase();
      const matchName = stu?.nama.toLowerCase().includes(q);
      const matchClass = stu?.kelas.toLowerCase().includes(q);
      if (!matchName && !matchClass) return false;
    }
    return true;
  });

  // Calculate Overlaps (Murid receiving > 1 assistance scheme)
  const studentAssistanceCount: Record<string, AssistanceRecord[]> = {};
  records.forEach(r => {
    if (!studentAssistanceCount[r.studentId]) studentAssistanceCount[r.studentId] = [];
    studentAssistanceCount[r.studentId].push(r);
  });
  const overlappingStudents = Object.entries(studentAssistanceCount).filter(([_, recs]) => recs.length > 1);

  // Total Calculations
  const totalAgihanDone = records.filter(r => r.statusAgihan === 'telah_terima').reduce((acc, curr) => acc + curr.jumlahBantuan, 0);
  const totalDanaPeruntukan = records.reduce((acc, curr) => acc + curr.jumlahBantuan, 0);
  const uniqueRecipients = new Set(records.map(r => r.studentId)).size;

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
              Unit Biasiswa & Kebajikan Murid (HEM Fasa 3)
            </span>
            <span className="text-xs text-slate-500">Penyelaras: Pn. Grace Liew • SMK Salaping</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengurusan Biasiswa & Agihan Bantuan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengesanan permohonan, penyerahan berakuan terima, semakan pertindihan, dan peruntukan bajet KPM
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Permohonan Baharu</span>
          </button>

          {canManageAssistance && (
            <button
              onClick={() => setShowAddRecipientModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Penerima</span>
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Muat turun borang akuan penyerahan dengan ruang tandatangan"
          >
            <Download className="w-4 h-4" />
            <span>PDF Akuan Terima</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Eksport data untuk Excel"
          >
            <Download className="w-4 h-4" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Bajet vs Agihan & Statistik) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Penerima Unik</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{uniqueRecipients} Murid</div>
          <p className="text-[10px] text-teal-700 mt-1 font-semibold">
            {overlappingStudents.length > 0 ? `⚠️ ${overlappingStudents.length} murid terima > 1 bantuan` : 'Tiada pertindihan berganda'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Peruntukan Disasarkan</span>
          <div className="text-2xl font-black text-blue-900 mt-1">RM {totalDanaPeruntukan.toLocaleString()}</div>
          <p className="text-[10px] text-slate-500 mt-1">{records.length} rekod bantuan diluluskan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Dana Telah Diagih</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">RM {totalAgihanDone.toLocaleString()}</div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">
            {totalDanaPeruntukan > 0 ? ((totalAgihanDone / totalDanaPeruntukan) * 100).toFixed(0) : 0}% telah diserah dengan akuan terima
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Permohonan Dalam Semakan</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{applications.filter(a => a.status !== 'lulus' && a.status !== 'ditolak').length} Kes</div>
          <p className="text-[10px] text-slate-500 mt-1">JBMS SMK Salaping</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('senarai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'senarai' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Senarai Penerima & Akuan Terima ({filteredRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('permohonan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'permohonan' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Borang & Status Permohonan ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pertindihan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pertindihan' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Semak Pertindihan ({overlappingStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bajet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'bajet' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>Pemantauan Bajet Skim</span>
        </button>
      </div>

      {/* ================= TAB 1: SENARAI PENERIMA & AKUAN TERIMA ================= */}
      {activeTab === 'senarai' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nama murid, no. murid atau kelas..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Jenis Bantuan</option>
                {DEFAULT_ASSISTANCE_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="border border-slate-300 rounded-lg p-2 font-bold bg-slate-50"
              >
                <option value={2026}>Tahun 2026</option>
                <option value={2025}>Tahun 2025</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Bil</th>
                    <th className="p-3">Murid & Tingkatan</th>
                    <th className="p-3">Kampung / Pendapatan</th>
                    <th className="p-3">Jenis Bantuan</th>
                    <th className="p-3">Jumlah (RM)</th>
                    <th className="p-3">Status Agihan</th>
                    <th className="p-3">Akuan Penyerahan</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r, idx) => {
                    const stu = students.find(s => s.id === r.studentId);
                    const isReceived = r.statusAgihan === 'telah_terima';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{stu?.nama || 'Murid'}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {stu?.noMurid} • Tingkatan {stu?.kelas}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{stu?.kampung}</div>
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {stu?.kategoriPendapatan}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-teal-100 text-teal-900 border border-teal-200">
                            {r.jenisBantuan}
                          </span>
                        </td>
                        <td className="p-3 font-black text-teal-800">RM {r.jumlahBantuan}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {isReceived ? 'Telah Diserah' : 'Belum Diserah'}
                          </span>
                        </td>
                        <td className="p-3">
                          {isReceived ? (
                            <div className="text-[11px]">
                              <div className="font-semibold text-slate-900 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{r.namaPenjagaPenerima || 'Penjaga'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Tarikh: {r.tarikhTerima}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Menunggu tandatangan</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleReceived(r)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isReceived
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            {isReceived ? 'Batal Serah' : 'Tanda Diserah'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRecords.length === 0 && (
              <EmptyState
                title="Tiada Rekod Agihan Dijumpai"
                description="Tiada maklumat penerima yang sepadan dengan kriteria tapisan semasa."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: BORANG & STATUS PERMOHONAN ================= */}
      {activeTab === 'permohonan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Senarai Permohonan Dalaman Murid (JBMS)</h3>
                <p className="text-xs text-slate-500">Aliran kelulusan: Baharu &rarr; Disemak &rarr; Disyorkan &rarr; Lulus / Ditolak</p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Borang Permohonan Baharu</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Murid</th>
                    <th className="p-3">Skim Bantuan</th>
                    <th className="p-3">Justifikasi / Sebab</th>
                    <th className="p-3">Dokumen Sokongan</th>
                    <th className="p-3">Status Permohonan</th>
                    <th className="p-3">Tindakan Kelulusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map(app => {
                    const stu = students.find(s => s.id === app.studentId);
                    return (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{stu?.nama || 'Murid'}</div>
                          <div className="text-[11px] text-slate-500">
                            {stu?.kelas} • {stu?.kampung} ({stu?.kategoriPendapatan})
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-teal-800">{app.jenisBantuan}</td>
                        <td className="p-3 text-slate-600 max-w-xs">{app.sebab}</td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1 w-max">
                            <FileText className="w-3 h-3" />
                            <span>{app.dokumenSokongan || 'Borang Pengesahan'}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                              app.status === 'lulus'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'ditolak'
                                ? 'bg-red-100 text-red-800'
                                : app.status === 'disyorkan'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {isPengetuaOrGpkHem || canManageAssistance ? (
                            <div className="flex items-center gap-1">
                              {app.status !== 'lulus' && (
                                <button
                                  onClick={() => handleUpdateAppStatus(app, 'lulus')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                                  title="Luluskan & Tambah ke agihan"
                                >
                                  Lulus
                                </button>
                              )}
                              {app.status === 'baharu' && (
                                <button
                                  onClick={() => handleUpdateAppStatus(app, 'disemak')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px]"
                                >
                                  Semak
                                </button>
                              )}
                              {app.status !== 'ditolak' && (
                                <button
                                  onClick={() => handleUpdateAppStatus(app, 'ditolak')}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-[10px]"
                                >
                                  Tolak
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Tiada Akses Kuasa</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SEMAK PERTINDIHAN ================= */}
      {activeTab === 'pertindihan' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">Enjin Pengesanan Pertindihan Agihan Bantuan</strong>
              <p className="mt-0.5 leading-relaxed">
                Memastikan agihan dana kerajaan dan PIBG adil serta tiada murid menerima dua biasiswa tunai yang tidak dibenarkan serentak (contohnya pertindihan KWAPM dan BKP).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Murid Menerima Lebih Daripada Satu (1) Bantuan ({overlappingStudents.length} Orang)
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {overlappingStudents.map(([studentId, recs]) => {
                const stu = students.find(s => s.id === studentId);
                const totalReceived = recs.reduce((a, b) => a + b.jumlahBantuan, 0);

                return (
                  <div key={studentId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{stu?.nama}</div>
                      <div className="text-slate-500 text-[11px]">
                        Tingkatan {stu?.kelas} • {stu?.kampung} • Kategori: <strong>{stu?.kategoriPendapatan}</strong>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {recs.map(r => (
                          <span
                            key={r.id}
                            className="px-2 py-0.5 rounded font-bold text-[10px] bg-teal-100 text-teal-900 border border-teal-300"
                          >
                            {r.jenisBantuan} (RM{r.jumlahBantuan})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-slate-500 text-[10px] block">Jumlah Terkumpul:</span>
                      <span className="text-base font-black text-teal-800">RM {totalReceived}</span>
                    </div>
                  </div>
                );
              })}

              {overlappingStudents.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Tiada pertindihan agihan dikesan. Semua murid menerima maksimum 1 bantuan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PEMANTAUAN BAJET SKIM ================= */}
      {activeTab === 'bajet' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_ASSISTANCE_TYPES.map(type => {
              const matchingRecs = records.filter(r => r.jenisBantuan === type);
              const totalUsed = matchingRecs.reduce((a, b) => a + b.jumlahBantuan, 0);
              const budgetConfig = DEFAULT_ASSISTANCE_BUDGETS[type] || { perMurid: 150, peruntukanSekolah: 20000 };
              const percentUsed = budgetConfig.peruntukanSekolah > 0 ? (totalUsed / budgetConfig.peruntukanSekolah) * 100 : 0;

              return (
                <div key={type} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{type}</h4>
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-teal-100 text-teal-800">
                      {matchingRecs.length} Penerima
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Kadar Per Murid:</span>
                      <span className="font-bold text-slate-800">RM {budgetConfig.perMurid}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Jumlah Dana Diguna:</span>
                      <span className="font-black text-teal-800">RM {totalUsed.toLocaleString()}</span>
                    </div>
                    {budgetConfig.peruntukanSekolah > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Peruntukan Siling Sekolah:</span>
                        <span className="font-bold text-slate-800">RM {budgetConfig.peruntukanSekolah.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {budgetConfig.peruntukanSekolah > 0 && (
                    <div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block text-right font-semibold">
                        {percentUsed.toFixed(1)}% dimanfaatkan
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL PERMOHONAN BAHARU ================= */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Borang Permohonan Bantuan Dalaman</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Murid Pemohon:</label>
                <select
                  value={applyStudentId}
                  onChange={e => setApplyStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.kampung} - {s.kategoriPendapatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Jenis Bantuan:</label>
                <select
                  value={applyJenis}
                  onChange={e => setApplyJenis(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {DEFAULT_ASSISTANCE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Justifikasi / Sebab Permohonan:</label>
                <textarea
                  rows={3}
                  required
                  value={applySebab}
                  onChange={e => setApplySebab(e.target.value)}
                  placeholder="Contoh: Bapa kehilangan punca pendapatan, tanggungan 6 anak bersekolah, kediaman pedalaman..."
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Nama Fail / Dokumen Sokongan:</label>
                <input
                  type="text"
                  value={applyDocName}
                  onChange={e => setApplyDocName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Hantar Permohonan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH PENERIMA DIRECT ================= */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Daftar Penerima Bantuan Terus</h3>
              <button onClick={() => setShowAddRecipientModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDirectRecipient} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Murid:</label>
                <select
                  value={recStudentId}
                  onChange={e => setRecStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.kampung})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Jenis Bantuan:</label>
                <select
                  value={recJenis}
                  onChange={e => {
                    setRecJenis(e.target.value);
                    const b = DEFAULT_ASSISTANCE_BUDGETS[e.target.value];
                    if (b) setRecJumlah(b.perMurid);
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {DEFAULT_ASSISTANCE_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Kadar Amaun (RM):</label>
                <input
                  type="number"
                  required
                  value={recJumlah}
                  onChange={e => setRecJumlah(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddRecipientModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Daftar Penerima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
