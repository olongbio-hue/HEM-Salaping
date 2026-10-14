import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { DisciplineCase, Student, DisciplineSeverity, DisciplineCaseFlow, DisciplinaryBoardMeeting } from '../types';
import {
  getDisciplineCases,
  getStudents,
  saveDisciplineCase,
  getDisciplinaryBoardMeetings,
  saveDisciplinaryBoardMeeting
} from '../services/dataService';
import {
  generateSuratPanggilanPenjagaDisiplinPDF,
  generateSuratTindakanDisiplinPDF
} from '../services/pdfService';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  ArrowRight,
  HeartHandshake,
  AlertTriangle,
  User,
  Download,
  Calendar,
  Building,
  FileDown,
  Lock,
  Layers,
  History,
  Info,
  Check,
  X,
  Camera,
  MapPin
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const Discipline: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem, canManageDiscipline } = useAuth();
  const { school, rules, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<DisciplineCase[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [boardMeetings, setBoardMeetings] = useState<DisciplinaryBoardMeeting[]>([]);

  // Active view: 'kes' (list & workflow), 'lembaga' (board meetings), 'analitik' (heatmap & recidivism)
  const [activeTab, setActiveTab] = useState<'kes' | 'lembaga' | 'analitik'>('kes');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTahap, setFilterTahap] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterJenis, setFilterJenis] = useState<string>('semua');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState<DisciplineCase | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);

  // New Case Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [jenisSalahLaku, setJenisSalahLaku] = useState<'disiplin' | 'jenayah'>('disiplin');
  const [kategori, setKategori] = useState(rules.kategoriKesalahan[0] || 'Lewat / Ponteng Kelas');
  const [tahap, setTahap] = useState<DisciplineSeverity>('sederhana');
  const [tarikhKejadian, setTarikhKejadian] = useState(new Date().toISOString().split('T')[0]);
  const [masaKejadian, setMasaKejadian] = useState('08:30 AM');
  const [lokasi, setLokasi] = useState('Tandas Blok B');
  const [perincian, setPerincian] = useState('');
  const [saksi, setSaksi] = useState('');
  const [tindakan, setTindakan] = useState('Nasihat & Peringatan Lisan');
  const [mockPhotoName, setMockPhotoName] = useState<string | null>(null);

  // Workflow Update State
  const [wfStatusAliran, setWfStatusAliran] = useState<DisciplineCaseFlow>('disiasat');
  const [wfPertuduhan, setWfPertuduhan] = useState(false);
  const [wfBelaDiri, setWfBelaDiri] = useState(false);
  const [wfBelaDiriText, setWfBelaDiriText] = useState('');
  const [wfKaunseling, setWfKaunseling] = useState(false);
  const [wfKaunselingText, setWfKaunselingText] = useState('');
  const [wfTindakanAkhir, setWfTindakanAkhir] = useState('');

  // Board Meeting Form State
  const [boardRujukan, setBoardRujukan] = useState(`LD/SMKS/2026/0${boardMeetings.length + 1}`);
  const [boardTarikh, setBoardTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [boardMasa, setBoardMasa] = useState('02:30 PM');
  const [boardTempat, setBoardTempat] = useState('Bilik Gerakan HEM SMK Salaping');
  const [boardMinit, setBoardMinit] = useState('');
  const [boardKeputusan, setBoardKeputusan] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [dpList, stList, bmList] = await Promise.all([
        getDisciplineCases(),
        getStudents(),
        getDisciplinaryBoardMeetings()
      ]);
      setCases(dpList);
      setStudents(stList);
      setBoardMeetings(bmList);
      if (stList.length > 0) setSelectedStudentId(stList[0].id);
    } catch (err) {
      console.error('Ralat memuatkan data disiplin:', err);
    } finally {
      setLoading(false);
    }
  }

  // Save new misconduct case
  const handleSaveNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !perincian) {
      showToast('Sila pilih murid dan lengkapkan perincian kejadian.', 'error');
      return;
    }

    try {
      const stu = students.find(s => s.id === selectedStudentId);
      const newCase: DisciplineCase = {
        id: `disp_${Date.now()}`,
        noRujukan: `DISP/SMKS/2026/${String(Math.floor(Math.random() * 900) + 100)}`,
        studentId: selectedStudentId,
        tarikhKejadian,
        masaKejadian,
        jenisSalahLaku,
        kategori,
        perincianKes: perincian,
        lokasi,
        tahap,
        tindakanDiambil: tindakan,
        statusAliran: 'dilaporkan',
        statusKes: 'dalam_siasatan',
        saksi: saksi || undefined,
        dilaporOleh: currentUser?.nama || 'Guru',
        guruDisiplinUid: currentUser?.uid || 'guru',
        gambarUrl: mockPhotoName ? `lampiran_${mockPhotoName}` : undefined,
        langkahWajib: {
          pertuduhanLengkap: false,
          belaDiriLengkap: false,
          kaunselingLengkap: false
        },
        tarikhKemaskiniTerakhir: tarikhKejadian,
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      await saveDisciplineCase(newCase, { uid: operator.uid, nama: operator.nama }, true);

      setCases(prev => [newCase, ...prev]);
      setShowAddModal(false);
      setPerincian('');
      setSaksi('');
      setMockPhotoName(null);
      showToast(`Kes ${newCase.noRujukan} bagi ${stu?.nama} berjaya direkodkan.`, 'success');
    } catch (err) {
      showToast('Gagal merekod kes disiplin.', 'error');
    }
  };

  // Save case workflow progression
  const handleUpdateWorkflow = async () => {
    if (!showWorkflowModal) return;

    // RULE ENFORCEMENT: Untuk kes berat (gantung / buang sekolah), pastikan pertuduhan, bela diri & kaunseling telah lengkap!
    const isSevereAction =
      wfTindakanAkhir.includes('Gantung') ||
      wfTindakanAkhir.includes('Buang') ||
      showWorkflowModal.tahap === 'berat' ||
      showWorkflowModal.tahap === 'jenayah';

    if (isSevereAction && wfStatusAliran === 'selesai') {
      if (!wfPertuduhan || !wfBelaDiri || !wfKaunseling) {
        showToast(
          'HALANGAN TATATERTIB KPM: Kes berat TIDAK BOLEH diselesaikan sebelum langkah Pertuduhan, Bela Diri, dan Kaunseling ditanda lengkap!',
          'error'
        );
        return;
      }
    }

    // Hanya Pengetua / GPK HEM boleh menetapkan keputusan gantung atau buang sekolah
    if ((wfTindakanAkhir.includes('Gantung') || wfTindakanAkhir.includes('Buang')) && !isPengetuaOrGpkHem) {
      showToast('KEBENARAN DIHADKAN: Keputusan gantung/buang sekolah hanya boleh dimasukkan oleh Pengetua atau GPK HEM.', 'error');
      return;
    }

    try {
      const updated: DisciplineCase = {
        ...showWorkflowModal,
        statusAliran: wfStatusAliran,
        statusKes: wfStatusAliran === 'selesai' ? 'selesai' : showWorkflowModal.statusKes,
        tindakanDiambil: wfTindakanAkhir || showWorkflowModal.tindakanDiambil,
        langkahWajib: {
          pertuduhanLengkap: wfPertuduhan,
          belaDiriLengkap: wfBelaDiri,
          kaunselingLengkap: wfKaunseling
        },
        kenyataanBelaDiri: wfBelaDiriText || showWorkflowModal.kenyataanBelaDiri,
        catatanKaunselingIntervensi: wfKaunselingText || showWorkflowModal.catatanKaunselingIntervensi,
        keputusanOleh: currentUser?.nama,
        tarikhKemaskiniTerakhir: new Date().toISOString().split('T')[0]
      };

      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      await saveDisciplineCase(updated, { uid: operator.uid, nama: operator.nama }, false);

      setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
      setShowWorkflowModal(null);
      showToast(`Aliran kes ${updated.noRujukan} dikemaskini kepada: ${updated.statusAliran.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Gagal mengemaskini aliran kes.', 'error');
    }
  };

  // Schedule Board Meeting
  const handleSaveBoardMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newMeeting: DisciplinaryBoardMeeting = {
        id: `board_${Date.now()}`,
        noRujukan: boardRujukan,
        tarikh: boardTarikh,
        masa: boardMasa,
        tempat: boardTempat,
        kesIds: cases.filter(c => c.statusKes === 'lembaga_disiplin').map(c => c.id),
        studentIds: cases.filter(c => c.statusKes === 'lembaga_disiplin').map(c => c.studentId),
        pengerusi: school.namaPengetua ? `${school.namaPengetua} (Pengetua)` : 'Pengetua',
        ahliHadir: [
          school.namaGpkHem ? `${school.namaGpkHem} (GPK HEM)` : 'GPK HEM',
          school.namaKetuaDisiplin ? `${school.namaKetuaDisiplin} (Ketua Guru Disiplin)` : 'Ketua Guru Disiplin',
          school.namaGbk ? `${school.namaGbk} (GBK)` : 'Guru Bimbingan & Kaunseling (GBK)'
        ],
        minitRingkas: boardMinit || 'Sidang khas membincangkan kes salah laku disiplin murid bersama ibu bapa.',
        keputusan: boardKeputusan || 'Keputusan dalam pertimbangan Lembaga Disiplin Sekolah.',
        status: 'dijadualkan',
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'system', nama: 'GPK HEM' };
      await saveDisciplinaryBoardMeeting(newMeeting, operator, true);
      setBoardMeetings(prev => [newMeeting, ...prev]);
      setShowBoardModal(false);
      showToast('Sidang Lembaga Disiplin berjaya dijadualkan!', 'success');
    } catch (err) {
      showToast('Gagal menjadualkan sidang Lembaga Disiplin.', 'error');
    }
  };

  // Export SSDM CSV
  const handleExportSSDM = () => {
    const headers = ['Nama Murid', 'No KP (MyKad)', 'Tingkatan', 'Kelas', 'Jenis Salah Laku', 'Kategori Kesalahan', 'Tarikh Kejadian', 'Lokasi', 'Tahap', 'Tindakan Ambilan', 'Status Aliran'];
    const rows = cases.map(c => {
      const stu = students.find(s => s.id === c.studentId);
      return [
        `"${stu?.nama || ''}"`,
        `"${stu?.noKP || ''}"`,
        stu?.tingkatan || '',
        `"${stu?.kelas || ''}"`,
        `"${c.jenisSalahLaku.toUpperCase()}"`,
        `"${c.kategori}"`,
        `"${c.tarikhKejadian}"`,
        `"${c.lokasi}"`,
        `"${c.tahap.toUpperCase()}"`,
        `"${c.tindakanDiambil}"`,
        `"${c.statusAliran.toUpperCase()}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Eksport_Disiplin_SSDM_SMK_Salaping_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Fail CSV untuk kemasukan manual SSDM berjaya dijana.', 'success');
  };

  // Generate Letters (PDF)
  const handlePrintPanggilanPenjaga = (c: DisciplineCase) => {
    const stu = students.find(s => s.id === c.studentId);
    if (!stu) return;
    const doc = generateSuratPanggilanPenjagaDisiplinPDF(c, stu, school);
    doc.save(`Surat_Panggilan_Penjaga_${stu.nama.replace(/\s+/g, '_')}.pdf`);
    showToast('Surat panggilan penjaga PDF dimuat turun.', 'success');
  };

  const handlePrintSuratTindakan = (c: DisciplineCase) => {
    const stu = students.find(s => s.id === c.studentId);
    if (!stu) return;
    const doc = generateSuratTindakanDisiplinPDF(c, stu, school, c.tindakanDiambil);
    doc.save(`Surat_Tindakan_Disiplin_${stu.nama.replace(/\s+/g, '_')}.pdf`);
    showToast('Surat keputusan tatatertib PDF dimuat turun.', 'success');
  };

  // Recidivism analysis (students with >= 3 offenses)
  const studentOffenseCounts = new Map<string, DisciplineCase[]>();
  cases.forEach(c => {
    const existing = studentOffenseCounts.get(c.studentId) || [];
    studentOffenseCounts.set(c.studentId, [...existing, c]);
  });

  const recidivistList = Array.from(studentOffenseCounts.entries())
    .filter(([_, caseList]) => caseList.length >= 3)
    .map(([stuId, caseList]) => ({
      student: students.find(s => s.id === stuId),
      cases: caseList
    }))
    .filter(item => item.student != null);

  // Heatmap: Location vs Time blocks
  const locationStats = new Map<string, number>();
  cases.forEach(c => {
    locationStats.set(c.lokasi, (locationStats.get(c.lokasi) || 0) + 1);
  });

  // Resolution Rate
  const completedCasesCount = cases.filter(c => c.statusAliran === 'selesai').length;
  const resolutionRate = cases.length > 0 ? Math.round((completedCasesCount / cases.length) * 100) : 100;

  const filteredCases = cases.filter(c => {
    if (filterTahap !== 'semua' && c.tahap !== filterTahap) return false;
    if (filterStatus !== 'semua' && c.statusAliran !== filterStatus) return false;
    if (filterJenis !== 'semua' && c.jenisSalahLaku !== filterJenis) return false;

    if (searchTerm) {
      const stu = students.find(s => s.id === c.studentId);
      const q = searchTerm.toLowerCase();
      const matchStu = stu?.nama.toLowerCase().includes(q);
      const matchKat = c.kategori.toLowerCase().includes(q);
      const matchRuj = c.noRujukan.toLowerCase().includes(q);
      if (!matchStu && !matchKat && !matchRuj) return false;
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
              Prinsip SSDM (Salah Laku & Tindakan Sahaja)
            </span>
            <span className="text-xs text-slate-500">
              Ketua Guru Disiplin: {school.namaKetuaDisiplin || 'Ketua Guru Disiplin'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengurusan Disiplin & Tatatertib Murid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perekodan salah laku disiplin vs jenayah, aliran tatatertib lengkap, sidang Lembaga Disiplin, dan eksport SSDM
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Rekod Kes Pantas</span>
          </button>

          <button
            onClick={handleExportSSDM}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
            title="Eksport data untuk kemasukan manual ke portal SSDM KPM"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Eksport untuk SSDM</span>
          </button>
        </div>
      </div>

      {/* SSDM Non-direct Connection Notice */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Pemberitahuan SSDM KPM:</strong> Sistem ini tidak bersambung terus dengan portal SSDM KPM. Modul eksport menyediakan format jadual teratur bagi memudahkan guru memasukkan rekod ke SSDM secara manual.
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Jumlah Kes Dilapor</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{cases.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Disiplin: {cases.filter(c => c.jenisSalahLaku === 'disiplin').length} • Jenayah: {cases.filter(c => c.jenisSalahLaku === 'jenayah').length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
          <span className="text-xs font-bold text-amber-900">Dalam Siasatan / Bela Diri</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {cases.filter(c => c.statusAliran === 'disiasat' || c.statusAliran === 'pertuduhan_bela_diri').length}
          </div>
          <p className="text-[10px] text-amber-800 mt-0.5">Sesi pembelaan adil</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20">
          <span className="text-xs font-bold text-purple-900">Intervensi Kaunseling</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {cases.filter(c => c.statusAliran === 'kaunseling').length}
          </div>
          <p className="text-[10px] text-purple-800 mt-0.5">Rujukan UBK wajib</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20">
          <span className="text-xs font-bold text-rose-900">Murid Berulang (≥ 3 Kes)</span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {recidivistList.length} Murid
          </div>
          <p className="text-[10px] text-rose-800 mt-0.5">Perlu perhatian PGB</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-emerald-900">Kadar Penyelesaian</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {resolutionRate}%
          </div>
          <p className="text-[10px] text-emerald-800 mt-0.5">{completedCasesCount} kes selesai</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('kes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'kes' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Senarai & Aliran Kes Tatatertib ({cases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lembaga')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'lembaga' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Sidang Lembaga Disiplin ({boardMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analitik')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'analitik' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Analitik Lokasi & Rekod Berulang (Recidivism)</span>
        </button>
      </div>

      {/* ================= TAB 1: SENARAI & ALIRAN KES ================= */}
      {activeTab === 'kes' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari murid, kategori, rujukan kes..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterJenis}
                onChange={e => setFilterJenis(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Jenis Salah Laku</option>
                <option value="disiplin">Salah Laku Disiplin Biasa</option>
                <option value="jenayah">Salah Laku Jenayah Berat</option>
              </select>

              <select
                value={filterTahap}
                onChange={e => setFilterTahap(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Tahap</option>
                <option value="ringan">Ringan</option>
                <option value="sederhana">Sederhana</option>
                <option value="berat">Berat</option>
                <option value="jenayah">Jenayah</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Status Aliran</option>
                <option value="dilaporkan">1. Dilaporkan</option>
                <option value="disiasat">2. Disiasat</option>
                <option value="pertuduhan_bela_diri">3. Pertuduhan & Bela Diri</option>
                <option value="kaunseling">4. Sesi Kaunseling UBK</option>
                <option value="keputusan">5. Keputusan Hukuman</option>
                <option value="selesai">6. Selesai / Dipantau</option>
              </select>
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-3">
            {filteredCases.map(c => {
              const stu = students.find(s => s.id === c.studentId);
              const pastCases = cases.filter(other => other.studentId === c.studentId && other.id !== c.id);

              return (
                <div
                  key={c.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-500">{c.noRujukan}</span>
                      <span className="font-black text-sm text-slate-900">{stu?.nama || 'Murid'}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                        {stu?.kelas}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          c.jenisSalahLaku === 'jenayah'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.jenisSalahLaku === 'jenayah' ? 'JENAYAH' : 'DISIPLIN'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          c.tahap === 'jenayah'
                            ? 'bg-purple-700 text-white'
                            : c.tahap === 'berat'
                            ? 'bg-red-600 text-white'
                            : c.tahap === 'sederhana'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Tahap: {c.tahap}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Tarikh: {c.tarikhKejadian}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase bg-blue-100 text-blue-900">
                        Aliran: {c.statusAliran.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Misconduct Details */}
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900">
                      Kesalahan: <span className="text-rose-800">{c.kategori}</span> • Lokasi: {c.lokasi} ({c.masaKejadian || 'Waktu Sekolah'})
                    </p>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {c.perincianKes}
                    </p>
                  </div>

                  {/* Step Checklist Indicator (Pertuduhan, Bela Diri, Kaunseling) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">Langkah SSDM:</span>
                      <span className={`flex items-center gap-1 font-semibold ${c.langkahWajib.pertuduhanLengkap ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {c.langkahWajib.pertuduhanLengkap ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>Pertuduhan</span>
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${c.langkahWajib.belaDiriLengkap ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {c.langkahWajib.belaDiriLengkap ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>Bela Diri</span>
                      </span>
                      <span className={`flex items-center gap-1 font-semibold ${c.langkahWajib.kaunselingLengkap ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {c.langkahWajib.kaunselingLengkap ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>Kaunseling</span>
                      </span>
                    </div>

                    <span className="text-slate-600">
                      Tindakan: <strong>{c.tindakanDiambil}</strong>
                    </span>
                  </div>

                  {/* Rekod Lampau Murid (PGB Perlu Tahu) */}
                  {pastCases.length > 0 && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                      <History className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Rekod Lampau Murid ({pastCases.length} kes terdahulu):</strong> Murid ini pernah terlibat dalam kesalahan{' '}
                        {pastCases.map(pc => `${pc.kategori} (${pc.tarikhKejadian})`).join(', ')}.
                      </div>
                    </div>
                  )}

                  {/* Actions Button Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrintPanggilanPenjaga(c)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Surat Panggil Penjaga</span>
                      </button>

                      <button
                        onClick={() => handlePrintSuratTindakan(c)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Surat Tindakan</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setShowWorkflowModal(c);
                        setWfStatusAliran(c.statusAliran);
                        setWfPertuduhan(c.langkahWajib.pertuduhanLengkap);
                        setWfBelaDiri(c.langkahWajib.belaDiriLengkap);
                        setWfBelaDiriText(c.kenyataanBelaDiri || '');
                        setWfKaunseling(c.langkahWajib.kaunselingLengkap);
                        setWfKaunselingText(c.catatanKaunselingIntervensi || '');
                        setWfTindakanAkhir(c.tindakanDiambil);
                      }}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-2xs"
                    >
                      Kemas Kini Aliran Tatatertib
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCases.length === 0 && (
              <EmptyState
                title="Tiada Kes Disiplin"
                description="Tiada rekod salah laku yang memenuhi tapisan carian."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SIDANG LEMBAGA DISIPLIN ================= */}
      {activeTab === 'lembaga' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Sidang Jawatankuasa Lembaga Disiplin Sekolah</h3>
              <p className="text-slate-500">Mendengar pertuduhan kes berat, bela diri murid & penjaga, serta merumuskan hukuman tatatertib</p>
            </div>
            {isPengetuaOrGpkHem && (
              <button
                onClick={() => setShowBoardModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Jadualkan Sidang Baharu</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {boardMeetings.map(bm => (
              <div key={bm.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-600">{bm.noRujukan}</span>
                    <span className="font-bold text-slate-900 text-sm">Sidang Disiplin ({bm.tarikh})</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                    bm.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {bm.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                  <div>
                    <span className="font-bold text-slate-800">Masa & Tempat: </span>
                    {bm.masa} • {bm.tempat}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Pengerusi: </span>
                    {bm.pengerusi}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <strong className="text-slate-800">Minit & Bukti Dikemukakan:</strong>
                  <p className="text-slate-700 mt-1">{bm.minitRingkas}</p>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                  <strong>Keputusan Lembaga Disiplin: </strong>
                  {bm.keputusan}
                  {bm.tarikhSusulan && (
                    <span className="block text-[11px] text-rose-700 mt-1">
                      Tarikh Semakan Susulan: {bm.tarikhSusulan}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ANALITIK LOKASI & REKOD BERULANG ================= */}
      {activeTab === 'analitik' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Heatmap / Analisis Lokasi Panas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Taburan Lokasi Panas Salah Laku (Heatmap)</h3>
              <p className="text-slate-500">Kawasan tumpuan pemantauan rondaan guru disiplin & pengawas</p>
            </div>

            <div className="space-y-2 pt-2">
              {Array.from(locationStats.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([loc, count]) => {
                  const pct = Math.round((count / cases.length) * 100);
                  return (
                    <div key={loc} className="space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{loc}</span>
                        <span>{count} kes ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${
                            count >= 4 ? 'bg-red-600' : count >= 2 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Murid Berulang Kesalahan (Recidivism) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Murid Berulang Kesalahan (≥ 3 Kes)</h3>
              <p className="text-slate-500">Memerlukan intervensi kaunseling berfokus dan perhatian Pengetua</p>
            </div>

            <div className="space-y-2.5 pt-2">
              {recidivistList.map(({ student: s, cases: sCases }) => (
                <div key={s!.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{s!.nama}</span>
                    <span className="px-2 py-0.5 rounded font-black text-rose-800 bg-rose-100 text-xs">
                      {sCases.length} Rekod Kes
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Kelas: <strong>{s!.kelas}</strong> • Kampung: {s!.kampung}
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-rose-200/80">
                    Kesalahan terlibat: {sCases.map(c => c.kategori).join(', ')}
                  </div>
                </div>
              ))}

              {recidivistList.length === 0 && (
                <div className="p-6 text-center text-slate-500">
                  Tiada murid yang mencatatkan 3 atau lebih rekod salah laku berulang.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rekod Kes Pantas (Mobile First) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
                <span>Perekodan Kes Salah Laku Pantas (SSDM)</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCase} className="space-y-3.5 py-3">
              {/* Carian & Pemilihan Murid */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cari & Pilih Murid *</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearchInput}
                    onChange={e => setStudentSearchInput(e.target.value)}
                    placeholder="Tapis senarai murid ikut nama..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-slate-50"
                >
                  {students
                    .filter(s => s.nama.toLowerCase().includes(studentSearchInput.toLowerCase()))
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas}) - {s.noMurid}
                      </option>
                    ))}
                </select>
              </div>

              {/* Jenis & Tahap Salah Laku */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Salah Laku</label>
                  <select
                    value={jenisSalahLaku}
                    onChange={e => {
                      const val = e.target.value as 'disiplin' | 'jenayah';
                      setJenisSalahLaku(val);
                      if (val === 'jenayah') {
                        setKategori(rules.kategoriJenayah[0] || 'Kecurian Wang / Barangan');
                        setTahap('jenayah');
                      } else {
                        setKategori(rules.kategoriKesalahan[0] || 'Lewat / Ponteng Kelas');
                        setTahap('sederhana');
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="disiplin">Salah Laku Disiplin</option>
                    <option value="jenayah">Salah Laku Jenayah</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahap Kesalahan</label>
                  <select
                    value={tahap}
                    onChange={e => setTahap(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="ringan">Ringan</option>
                    <option value="sederhana">Sederhana</option>
                    <option value="berat">Berat</option>
                    <option value="jenayah">Jenayah</option>
                  </select>
                </div>
              </div>

              {/* Kategori Kesalahan */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Kesalahan *</label>
                <select
                  value={kategori}
                  onChange={e => setKategori(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  {(jenisSalahLaku === 'jenayah' ? rules.kategoriJenayah : rules.kategoriKesalahan).map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Tarikh, Masa, Lokasi */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarikh</label>
                  <input
                    type="date"
                    value={tarikhKejadian}
                    onChange={e => setTarikhKejadian(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Masa</label>
                  <input
                    type="text"
                    value={masaKejadian}
                    onChange={e => setMasaKejadian(e.target.value)}
                    placeholder="08:30 AM"
                    className="w-full border border-slate-300 rounded-lg p-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tempat</label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={e => setLokasi(e.target.value)}
                    placeholder="Tandas Blok B"
                    className="w-full border border-slate-300 rounded-lg p-1.5"
                  />
                </div>
              </div>

              {/* Perincian Kes & Saksi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Penerangan Kejadian *</label>
                <textarea
                  rows={3}
                  required
                  value={perincian}
                  onChange={e => setPerincian(e.target.value)}
                  placeholder="Ceritakan kejadian sebenar, barang dirampas, atau pengakuan awal..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Saksi (Jika ada)</label>
                  <input
                    type="text"
                    value={saksi}
                    onChange={e => setSaksi(e.target.value)}
                    placeholder="Pengawas / guru bertugas"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tindakan Awal</label>
                  <select
                    value={tindakan}
                    onChange={e => setTindakan(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {rules.jenisTindakanDisiplin.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lampiran Gambar Pilihan (Mobile Camera / Photo) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-700">Lampiran Bukti Bergambar (Pilihan):</span>
                </div>
                {mockPhotoName ? (
                  <span className="font-mono text-emerald-700 font-bold">{mockPhotoName}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMockPhotoName(`foto_bukti_${Date.now().toString().slice(-4)}.jpg`)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Ambil / Muat Naik Foto
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
                >
                  Simpan Rekod Salah Laku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aliran Tatatertib (SSDM Workflow Step by Step) */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Aliran Tatatertib Kes: {showWorkflowModal.noRujukan}
            </h3>
            <p className="text-slate-500 mb-4">
              Murid: <strong>{students.find(s => s.id === showWorkflowModal.studentId)?.nama}</strong> • Kesalahan: {showWorkflowModal.kategori}
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Aliran Tatatertib Semasa</label>
                <select
                  value={wfStatusAliran}
                  onChange={e => setWfStatusAliran(e.target.value as DisciplineCaseFlow)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-slate-50"
                >
                  <option value="dilaporkan">1. Dilaporkan (Aduan Masuk)</option>
                  <option value="disiasat">2. Disiasat (Kumpul Bukti & Saksi)</option>
                  <option value="pertuduhan_bela_diri">3. Pertuduhan & Sesi Bela Diri</option>
                  <option value="kaunseling">4. Sesi Kaunseling UBK Wajib</option>
                  <option value="keputusan">5. Sidang Penentuan Hukuman</option>
                  <option value="selesai">6. Selesai / Dalam Pemantauan</option>
                </select>
              </div>

              {/* 3 Langkah Wajib (Checklist) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-extrabold text-slate-900 block">
                  Semakan Langkah Tatatertib KPM (Wajib sebelum kes ditutup):
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stepPertuduhan"
                    checked={wfPertuduhan}
                    onChange={e => setWfPertuduhan(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="stepPertuduhan" className="font-bold text-slate-800">
                    Langkah 1: Sesi Pertuduhan Rasmi Dijalankan
                  </label>
                </div>

                <div className="space-y-1 pl-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="stepBelaDiri"
                      checked={wfBelaDiri}
                      onChange={e => setWfBelaDiri(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="stepBelaDiri" className="font-bold text-slate-800">
                      Langkah 2: Ruang Bela Diri Diberikan kepada Murid/Waris
                    </label>
                  </div>
                  {wfBelaDiri && (
                    <textarea
                      rows={2}
                      value={wfBelaDiriText}
                      onChange={e => setWfBelaDiriText(e.target.value)}
                      placeholder="Ringkasan hujah / kenyataan bela diri murid..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white mt-1"
                    />
                  )}
                </div>

                <div className="space-y-1 pl-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="stepKaunseling"
                      checked={wfKaunseling}
                      onChange={e => setWfKaunseling(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="stepKaunseling" className="font-bold text-slate-800">
                      Langkah 3: Sesi Bimbingan & Kaunseling UBK Dilaksanakan
                    </label>
                  </div>
                  {wfKaunseling && (
                    <textarea
                      rows={2}
                      value={wfKaunselingText}
                      onChange={e => setWfKaunselingText(e.target.value)}
                      placeholder="Catatan intervensi sahsiah oleh GBK..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white mt-1"
                    />
                  )}
                </div>
              </div>

              {/* Tindakan / Hukuman Akhir */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tindakan / Hukuman Akhir</label>
                <select
                  value={wfTindakanAkhir}
                  onChange={e => setWfTindakanAkhir(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {rules.jenisTindakanDisiplin.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {(wfTindakanAkhir.includes('Gantung') || wfTindakanAkhir.includes('Buang')) && (
                  <p className="text-[11px] text-red-700 font-bold mt-1">
                    * Perhatian: Keputusan gantung/buang sekolah memerlukan kelulusan Pengetua / PPD mengikut Ordinan Pelajaran 1957.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowWorkflowModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateWorkflow}
                className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
              >
                Simpan Aliran Tatatertib
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jadualkan Sidang Lembaga Disiplin */}
      {showBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Jadualkan Sidang Lembaga Disiplin Sekolah</h3>
            <p className="text-slate-500 mb-4">Pengurusan Tatatertib Tertinggi SMK Salaping</p>

            <form onSubmit={handleSaveBoardMeeting} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">No. Rujukan Sidang</label>
                <input
                  type="text"
                  required
                  value={boardRujukan}
                  onChange={e => setBoardRujukan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Tarikh Sidang</label>
                  <input
                    type="date"
                    value={boardTarikh}
                    onChange={e => setBoardTarikh(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Masa</label>
                  <input
                    type="text"
                    value={boardMasa}
                    onChange={e => setBoardMasa(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Tempat Sidang</label>
                <input
                  type="text"
                  value={boardTempat}
                  onChange={e => setBoardTempat(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Minit / Catatan Kes Dibincangkan</label>
                <textarea
                  rows={3}
                  value={boardMinit}
                  onChange={e => setBoardMinit(e.target.value)}
                  placeholder="Ringkasan pertuduhan dan bukti..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBoardModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
                >
                  Sahkan Jadual Sidang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
