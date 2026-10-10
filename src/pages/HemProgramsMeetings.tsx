import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  HemProgram,
  AssemblyDuty,
  HemMeeting,
  HemMeetingFollowUp
} from '../types';
import {
  getHemPrograms,
  saveHemProgram,
  getAssemblyDuties,
  saveAssemblyDuty,
  getHemMeetings,
  saveHemMeeting
} from '../services/dataService';
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Sparkles,
  MapPin,
  DollarSign,
  UserCheck,
  CheckSquare,
  Square,
  X,
  Building,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const HemProgramsMeetings: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem, allUsers } = useAuth();
  const { school, showToast, lowDataMode } = useSchool();

  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<'program_kalendar' | 'perhimpunan' | 'mesyuarat'>('program_kalendar');

  // Program & Calendar State
  const [programs, setPrograms] = useState<HemProgram[]>([]);
  const [viewMode, setViewMode] = useState<'senarai' | 'kalendar'>('senarai');
  const [selectedUnit, setSelectedUnit] = useState<string>('semua');
  const [searchProgram, setSearchProgram] = useState('');
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Assembly Duties State
  const [assemblyDuties, setAssemblyDuties] = useState<AssemblyDuty[]>([]);
  const [searchAssembly, setSearchAssembly] = useState('');

  // Meetings State
  const [meetings, setMeetings] = useState<HemMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<HemMeeting | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Modals
  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  const [showAddAssemblyModal, setShowAddAssemblyModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);

  // New Program Form
  const [progNama, setProgNama] = useState('');
  const [progUnit, setProgUnit] = useState<HemProgram['unit']>('Disiplin');
  const [progTarikh, setProgTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [progMasa, setProgMasa] = useState('08:00 AM - 12:00 PM');
  const [progTempat, setProgTempat] = useState('Dewan Terbuka SMK Salaping');
  const [progBajet, setProgBajet] = useState<number>(500);
  const [progPenyelaras, setProgPenyelaras] = useState(currentUser?.nama || '');
  const [progStatus, setProgStatus] = useState<HemProgram['status']>('dirancang');
  const [progKehadiran, setProgKehadiran] = useState<number>(0);
  const [progRefleksi, setProgRefleksi] = useState('');

  // New Assembly Form
  const [assMinggu, setAssMinggu] = useState<number>(1);
  const [assTarikh, setAssTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [assGuru, setAssGuru] = useState<string>('');
  const [assTema, setAssTema] = useState('Disiplin Diri & Ketepatan Masa');
  const [assPeringatan, setAssPeringatan] = useState('Pemeriksaan kekemasan rambut & stoking di pintu pagar utama');

  // New Meeting Form
  const [meetTajuk, setMeetTajuk] = useState('Mesyuarat Jawatankuasa Pengurusan HEM');
  const [meetBil, setMeetBil] = useState(`Bil. ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  const [meetTarikh, setMeetTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [meetMasa, setMeetMasa] = useState('02:00 PM - 04:30 PM');
  const [meetTempat, setMeetTempat] = useState('Bilik Gerakan SMK Salaping');
  const [meetPengerusi, setMeetPengerusi] = useState(school.namaGpkHem || 'GPK HEM');
  const [meetPencatat, setMeetPencatat] = useState(currentUser?.nama || 'Setiausaha HEM');
  const [meetHadir, setMeetHadir] = useState<string>('Semua Guru Kelas & Ketua Unit HEM');
  const [meetAgenda, setMeetAgenda] = useState('1. Perutusan Pengerusi\n2. Pengesahan Minit Terdahulu\n3. Laporan Kehadiran & SOP 1:3:7\n4. Laporan Disiplin & Anti-Buli\n5. Pengurusan Bantuan & Asrama\n6. Hal-hal Lain');
  const [meetMinit, setMeetMinit] = useState('Pengerusi merakamkan penghargaan atas komitmen semua guru. Isu kehadiran murid dari kawasan pedalaman seperti Kg. Sonsogon Magandai diberi perhatian khusus. Sesi bimbingan UBK ditingkatkan.');
  
  // Follow Up items in meeting form
  const [followUps, setFollowUps] = useState<HemMeetingFollowUp[]>([
    {
      id: `fu_${Date.now()}_1`,
      perkara: 'Kemas kini senarai murid layak KWAPM & e-Kasih',
      tindakanOlehUid: 'demo_biasiswa',
      namaTindakanOleh: 'Penyelaras Biasiswa (Pn. Grace Liew)',
      tarikhAkhir: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'dalam_tindakan'
    },
    {
      id: `fu_${Date.now()}_2`,
      perkara: 'Kunjungan ziarah cakna ke rumah murid Amaran 3 di Kg. Tandek',
      tindakanOlehUid: 'demo_gbk',
      namaTindakanOleh: 'GBK & Guru Kelas 3 Marikh',
      tarikhAkhir: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: 'belum_selesai'
    }
  ]);
  const [newFuPerkara, setNewFuPerkara] = useState('');
  const [newFuPegawai, setNewFuPegawai] = useState('');
  const [newFuTarikh, setNewFuTarikh] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);
      const [progs, assemblies, meets] = await Promise.all([
        getHemPrograms(),
        getAssemblyDuties(),
        getHemMeetings()
      ]);
      setPrograms(progs);
      setAssemblyDuties(assemblies);
      setMeetings(meets);
      if (meets.length > 0) {
        setSelectedMeeting(meets[0]);
      }
    } catch (err) {
      console.error('Ralat memuatkan program/mesyuarat:', err);
      showToast('Gagal memuatkan data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Handlers
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progNama.trim()) return;

    const newProg: HemProgram = {
      id: `prog_${Date.now()}`,
      namaProgram: progNama.trim(),
      unit: progUnit,
      tarikh: progTarikh,
      masa: progMasa,
      tempat: progTempat,
      bajetAnggaran: Number(progBajet) || 0,
      penyelaras: progPenyelaras || currentUser?.nama || 'Penyelaras HEM',
      status: progStatus,
      kehadiranPeserta: Number(progKehadiran) || undefined,
      refleksi: progRefleksi.trim() || undefined
    };

    try {
      await saveHemProgram(newProg, { uid: currentUser?.uid || 'user', nama: currentUser?.nama || 'Guru' }, true);
      showToast('Program HEM berjaya didaftarkan!', 'success');
      setShowAddProgramModal(false);
      resetProgramForm();
      loadAllData();
    } catch {
      showToast('Gagal menyimpan program.', 'error');
    }
  };

  const resetProgramForm = () => {
    setProgNama('');
    setProgBajet(500);
    setProgRefleksi('');
  };

  const handleSaveAssembly = async (e: React.FormEvent) => {
    e.preventDefault();
    const guruList = assGuru.split(',').map(g => g.trim()).filter(Boolean);
    if (guruList.length === 0) {
      showToast('Sila masukkan sekurang-kurangnya satu nama guru bertugas.', 'error');
      return;
    }

    const newDuty: AssemblyDuty = {
      id: `duty_m${assMinggu}_${Date.now()}`,
      minggu: Number(assMinggu),
      tarikh: assTarikh,
      guruBertugas: guruList,
      temaPerhimpunan: assTema,
      peringatanTindakan: assPeringatan
    };

    try {
      await saveAssemblyDuty(newDuty, { uid: currentUser?.uid || 'user', nama: currentUser?.nama || 'Guru' });
      showToast('Jadual pemandu perhimpunan berjaya dikemaskini!', 'success');
      setShowAddAssemblyModal(false);
      loadAllData();
    } catch {
      showToast('Gagal menyimpan jadual perhimpunan.', 'error');
    }
  };

  const handleAddFollowUpToForm = () => {
    if (!newFuPerkara.trim()) return;
    const item: HemMeetingFollowUp = {
      id: `fu_${Date.now()}`,
      perkara: newFuPerkara.trim(),
      tindakanOlehUid: 'custom',
      namaTindakanOleh: newFuPegawai.trim() || 'Pegawai Bertanggungjawab',
      tarikhAkhir: newFuTarikh,
      status: 'belum_selesai'
    };
    setFollowUps([...followUps, item]);
    setNewFuPerkara('');
    setNewFuPegawai('');
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTajuk.trim()) return;

    const newMeeting: HemMeeting = {
      id: `meet_${Date.now()}`,
      tajuk: meetTajuk.trim(),
      bilangan: meetBil.trim(),
      tarikh: meetTarikh,
      masa: meetMasa,
      tempat: meetTempat,
      pengerusi: meetPengerusi,
      pencatatMinit: meetPencatat,
      ahliHadir: meetHadir.split('\n').map(h => h.trim()).filter(Boolean),
      agenda: meetAgenda.split('\n').map(a => a.trim()).filter(Boolean),
      minitRingkas: meetMinit,
      tindakanSusulan: followUps
    };

    try {
      await saveHemMeeting(newMeeting, { uid: currentUser?.uid || 'user', nama: currentUser?.nama || 'Guru' }, true);
      showToast('Minit Mesyuarat HEM berjaya disimpan!', 'success');
      setShowAddMeetingModal(false);
      loadAllData();
    } catch {
      showToast('Gagal menyimpan mesyuarat.', 'error');
    }
  };

  const handleUpdateFollowUpStatus = async (meeting: HemMeeting, fuId: string, newStatus: HemMeetingFollowUp['status']) => {
    const updatedFollowUps = meeting.tindakanSusulan.map(fu => {
      if (fu.id === fuId) return { ...fu, status: newStatus };
      return fu;
    });

    const updatedMeeting: HemMeeting = {
      ...meeting,
      tindakanSusulan: updatedFollowUps
    };

    try {
      await saveHemMeeting(updatedMeeting, { uid: currentUser?.uid || 'user', nama: currentUser?.nama || 'Guru' }, false);
      showToast('Status tindakan susulan dikemaskini!', 'success');
      setSelectedMeeting(updatedMeeting);
      loadAllData();
    } catch {
      showToast('Gagal mengemaskini status tindakan.', 'error');
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter(p => {
    if (selectedUnit !== 'semua' && p.unit !== selectedUnit) return false;
    if (searchProgram && !p.namaProgram.toLowerCase().includes(searchProgram.toLowerCase()) && !p.penyelaras.toLowerCase().includes(searchProgram.toLowerCase())) return false;
    return true;
  });

  // Calculate Budget
  const totalBudget = programs.reduce((acc, p) => acc + (p.bajetAnggaran || 0), 0);
  const completedBudget = programs.filter(p => p.status === 'selesai').reduce((acc, p) => acc + (p.bajetAnggaran || 0), 0);

  // Month navigation for calendar view
  const monthsMalay = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Pengurusan & Takwim HEM • {school.nama}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Program HEM, Perhimpunan & Mesyuarat
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kalendar aktiviti tahunan murid, jadual pemandu perhimpunan mingguan, dan pengesanan minit tindakan susulan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeMainTab === 'program_kalendar' && (
            <button
              onClick={() => setShowAddProgramModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Program HEM</span>
            </button>
          )}

          {activeMainTab === 'perhimpunan' && (
            <button
              onClick={() => setShowAddAssemblyModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tetapkan Guru Bertugas</span>
            </button>
          )}

          {activeMainTab === 'mesyuarat' && (
            <button
              onClick={() => setShowAddMeetingModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Rekod Mesyuarat Baharu</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          onClick={() => setActiveMainTab('program_kalendar')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeMainTab === 'program_kalendar'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Takwim & Program Tahunan HEM ({programs.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('perhimpunan')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeMainTab === 'perhimpunan'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pemandu Perhimpunan Mingguan ({assemblyDuties.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('mesyuarat')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl whitespace-nowrap transition-all ${
            activeMainTab === 'mesyuarat'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Minit Mesyuarat & Tindakan Susulan ({meetings.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: TAKWIM & PROGRAM HEM ================= */}
      {activeMainTab === 'program_kalendar' && (
        <div className="space-y-6">
          {/* Ringkasan Bajet & Status Program */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Program</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{programs.length}</span>
              <span className="text-[10px] text-blue-600 font-bold mt-1 block">Tahun {school.tahunSemasa}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Anggaran Peruntukan</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">RM {totalBudget.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-bold mt-1 block">Pelbagai Unit HEM</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Telah Dilaksanakan</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {programs.filter(p => p.status === 'selesai').length}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">RM {completedBudget.toLocaleString()} dibelanjakan</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Akan Datang / Dirancang</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {programs.filter(p => p.status === 'dirancang' || p.status === 'berjalan').length}
              </span>
              <span className="text-[10px] text-amber-600 font-bold mt-1 block">Perlu penyelarasan rapi</span>
            </div>
          </div>

          {/* Controls: Search, Unit Filter, View Mode */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari program / penyelaras..."
                  value={searchProgram}
                  onChange={e => setSearchProgram(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 font-medium text-xs"
                />
              </div>

              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="py-2 px-3 border border-slate-300 rounded-xl font-medium text-xs"
              >
                <option value="semua">Semua Unit HEM</option>
                <option value="Disiplin">Unit Disiplin</option>
                <option value="UBK">Unit Bimbingan & Kaunseling</option>
                <option value="Kebajikan & Biasiswa">Kebajikan & Biasiswa</option>
                <option value="3K & Kesihatan">3K & Kesihatan</option>
                <option value="Asrama">Asrama Desa</option>
                <option value="Pengawas">Badan Pengawas</option>
                <option value="SPBT">Skim Pinjaman Buku Teks (SPBT)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-center">
              <button
                onClick={() => setViewMode('senarai')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  viewMode === 'senarai' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Senarai Kad
              </button>
              <button
                onClick={() => setViewMode('kalendar')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  viewMode === 'kalendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Paparan Kalendar
              </button>
            </div>
          </div>

          {/* Content: List View or Calendar View */}
          {viewMode === 'senarai' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.map(prog => {
                const isCompleted = prog.status === 'selesai';
                const isOngoing = prog.status === 'berjalan';

                return (
                  <div
                    key={prog.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all hover:border-blue-300 ${
                      isCompleted ? 'border-emerald-200' : isOngoing ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {prog.unit}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOngoing
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {prog.status === 'selesai' ? 'SELESAI' : prog.status === 'berjalan' ? 'SEDANG BERJALAN' : 'DIRANCANG'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {prog.namaProgram}
                      </h3>

                      <div className="space-y-1 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prog.tarikh} {prog.masa && `• ${prog.masa}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prog.tempat}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span>Bajet: RM {prog.bajetAnggaran.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Penyelaras: {prog.penyelaras}</span>
                        </div>
                      </div>

                      {prog.refleksi && (
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 italic">
                          "{prog.refleksi}"
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Kehadiran: <strong>{prog.kehadiranPeserta ? `${prog.kehadiranPeserta} Murid` : 'Belum Ditentukan'}</strong></span>
                      <span className="font-bold text-blue-700">SMK Salaping</span>
                    </div>
                  </div>
                );
              })}

              {filteredPrograms.length === 0 && (
                <div className="col-span-full">
                  <EmptyState
                    title="Tiada Program Ditemui"
                    description="Tiada program HEM yang sepadan dengan carian atau unit yang dipilih."
                  />
                </div>
              )}
            </div>
          ) : (
            /* Month Calendar View */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(prev => prev - 1);
                      } else {
                        setCurrentMonth(prev => prev - 1);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-bold text-sm text-slate-900">
                    {monthsMalay[currentMonth]} {currentYear}
                  </h3>
                  <button
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(prev => prev + 1);
                      } else {
                        setCurrentMonth(prev => prev + 1);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  {programs.filter(p => new Date(p.tarikh).getMonth() === currentMonth).length} aktiviti dijadualkan
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {programs
                  .filter(p => new Date(p.tarikh).getMonth() === currentMonth)
                  .sort((a, b) => new Date(a.tarikh).getTime() - new Date(b.tarikh).getTime())
                  .map(p => (
                    <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-12 text-center py-1.5 bg-blue-50 border border-blue-200 rounded-xl shrink-0">
                          <span className="text-[10px] uppercase font-bold text-blue-600 block">
                            {monthsMalay[new Date(p.tarikh).getMonth()].slice(0, 3)}
                          </span>
                          <span className="text-base font-black text-blue-900 block leading-tight">
                            {new Date(p.tarikh).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{p.namaProgram}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-extrabold bg-blue-100 text-blue-800">
                              {p.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.tempat} • Penyelaras: {p.penyelaras} • Anggaran: RM {p.bajetAnggaran.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          p.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}

                {programs.filter(p => new Date(p.tarikh).getMonth() === currentMonth).length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">
                    Tiada program HEM yang direkodkan pada bulan {monthsMalay[currentMonth]} {currentYear}.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PEMANDU PERHIMPUNAN MINGGUAN ================= */}
      {activeMainTab === 'perhimpunan' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Jadual Pemandu Perhimpunan & Guru Bertugas Mingguan</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Penggiliran tugas guru mingguan untuk ucapan perhimpunan, kawalan disiplin, dan pemeriksaan kekemasan.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jadual Bertugas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assemblyDuties.map(duty => (
              <div
                key={duty.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    MINGGU {duty.minggu}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{duty.tarikh}</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Tema: "{duty.temaPerhimpunan}"
                  </h3>
                  <div className="mt-2 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Guru Bertugas Mingguan:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {duty.guruBertugas.map((guru, idx) => (
                        <span key={idx} className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                          {guru}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {duty.peringatanTindakan && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Fokus Peringatan Minggu Ini:</strong>
                      <span>{duty.peringatanTindakan}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: MESYUARAT HEM & MINIT ================= */}
      {activeMainTab === 'mesyuarat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Meetings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Senarai Sidang Mesyuarat</span>
              </h3>

              <div className="space-y-2">
                {meetings.map(meet => {
                  const isSelected = selectedMeeting?.id === meet.id;
                  const pendingFollowUps = meet.tindakanSusulan.filter(f => f.status !== 'selesai').length;

                  return (
                    <div
                      key={meet.id}
                      onClick={() => setSelectedMeeting(meet)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800">{meet.bilangan}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{meet.tarikh}</span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{meet.tajuk}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pengerusi: {meet.pengerusi}</p>
                      
                      {pendingFollowUps > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-700">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{pendingFollowUps} tugasan susulan belum selesai</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {meetings.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">Tiada rekod mesyuarat.</p>
                )}
              </div>
            </div>

            {/* Selected Meeting Details & Follow-Ups */}
            {selectedMeeting ? (
              <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {selectedMeeting.bilangan}
                      </span>
                      <span className="text-xs text-slate-400">{selectedMeeting.tarikh} • {selectedMeeting.masa}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      {selectedMeeting.tajuk}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tempat: {selectedMeeting.tempat} | Pengerusi: <strong>{selectedMeeting.pengerusi}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0 self-start sm:self-center"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Jana Minit (PDF/Cetak)</span>
                  </button>
                </div>

                {/* Agenda */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Agenda Mesyuarat:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedMeeting.agenda.map((ag, i) => (
                      <li key={i}>{ag}</li>
                    ))}
                  </ul>
                </div>

                {/* Ringkasan Minit */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan Keputusan & Minit:</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    {selectedMeeting.minitRingkas}
                  </div>
                </div>

                {/* Follow Up Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                      <span>Tindakan Susulan & Penanggungjawab ({selectedMeeting.tindakanSusulan.length})</span>
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedMeeting.tindakanSusulan.map(fu => {
                      const isDone = fu.status === 'selesai';
                      const isInProgress = fu.status === 'dalam_tindakan';

                      return (
                        <div key={fu.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                isDone ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {fu.perkara}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 pl-4.5">
                              <span>Tindakan: <strong>{fu.namaTindakanOleh}</strong></span>
                              <span>•</span>
                              <span>Tarikh Akhir: <strong className="text-red-700">{fu.tarikhAkhir}</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pl-4.5 sm:pl-0 shrink-0">
                            <select
                              value={fu.status}
                              onChange={e => handleUpdateFollowUpStatus(selectedMeeting, fu.id, e.target.value as any)}
                              className="text-xs font-semibold py-1 px-2 border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="belum_selesai">Belum Selesai</option>
                              <option value="dalam_tindakan">Dalam Tindakan</option>
                              <option value="selesai">Selesai</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}

                    {selectedMeeting.tindakanSusulan.length === 0 && (
                      <p className="p-4 text-xs text-slate-400 text-center">Tiada tindakan susulan direkodkan.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2">
                <EmptyState
                  title="Pilih Sidang Mesyuarat"
                  description="Pilih salah satu mesyuarat di sebelah kiri untuk melihat minit dan tindakan susulan."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: DAFTAR PROGRAM HEM ================= */}
      {showAddProgramModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Daftar Program / Aktiviti HEM Baharu</h3>
              <button onClick={() => setShowAddProgramModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Program</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Kem Jati Diri & Sahsiah Unggul 2026"
                  value={progNama}
                  onChange={e => setProgNama(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Pengelola</label>
                  <select
                    value={progUnit}
                    onChange={e => setProgUnit(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="Disiplin">Unit Disiplin</option>
                    <option value="UBK">Unit Bimbingan & Kaunseling</option>
                    <option value="Kebajikan & Biasiswa">Kebajikan & Biasiswa</option>
                    <option value="3K & Kesihatan">3K & Kesihatan</option>
                    <option value="Asrama">Asrama Desa</option>
                    <option value="Pengawas">Badan Pengawas</option>
                    <option value="SPBT">Skim Pinjaman Buku Teks (SPBT)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Program</label>
                  <select
                    value={progStatus}
                    onChange={e => setProgStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="dirancang">Dirancang</option>
                    <option value="berjalan">Sedang Berjalan</option>
                    <option value="selesai">Selesai</option>
                    <option value="ditangguhkan">Ditangguhkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarikh Program</label>
                  <input
                    type="date"
                    required
                    value={progTarikh}
                    onChange={e => setProgTarikh(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Masa / Waktu</label>
                  <input
                    type="text"
                    value={progMasa}
                    onChange={e => setProgMasa(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tempat</label>
                  <input
                    type="text"
                    value={progTempat}
                    onChange={e => setProgTempat(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bajet Anggaran (RM)</label>
                  <input
                    type="number"
                    value={progBajet}
                    onChange={e => setProgBajet(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Penyelaras Program</label>
                <input
                  type="text"
                  value={progPenyelaras}
                  onChange={e => setProgPenyelaras(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Refleksi / Catatan Ringkas</label>
                <textarea
                  rows={2}
                  placeholder="Catatan pelaksanaan atau hasil pemantauan..."
                  value={progRefleksi}
                  onChange={e => setProgRefleksi(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProgramModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TETAPKAN GURU PERHIMPUNAN ================= */}
      {showAddAssemblyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Tetapkan Jadual Pemandu Perhimpunan</h3>
              <button onClick={() => setShowAddAssemblyModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssembly} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Minggu Persekolahan</label>
                  <input
                    type="number"
                    min={1}
                    max={43}
                    required
                    value={assMinggu}
                    onChange={e => setAssMinggu(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarikh Hari Isnin</label>
                  <input
                    type="date"
                    required
                    value={assTarikh}
                    onChange={e => setAssTarikh(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Guru Bertugas Mingguan (Asingkan koma)</label>
                <input
                  type="text"
                  required
                  placeholder="Cikgu A, Cikgu B, Cikgu C"
                  value={assGuru}
                  onChange={e => setAssGuru(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tema / Tajuk Ucapan Perhimpunan</label>
                <input
                  type="text"
                  required
                  value={assTema}
                  onChange={e => setAssTema(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fokus Peringatan Disiplin / Tindakan</label>
                <textarea
                  rows={2}
                  value={assPeringatan}
                  onChange={e => setAssPeringatan(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAssemblyModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl"
                >
                  Simpan Jadual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REKOD MESYUARAT HEM ================= */}
      {showAddMeetingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Rekod Mesyuarat Jawatankuasa HEM Baharu</h3>
              <button onClick={() => setShowAddMeetingModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tajuk Mesyuarat</label>
                  <input
                    type="text"
                    required
                    value={meetTajuk}
                    onChange={e => setMeetTajuk(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bilangan Mesyuarat</label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Bil. 2/2026"
                    value={meetBil}
                    onChange={e => setMeetBil(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarikh</label>
                  <input
                    type="date"
                    required
                    value={meetTarikh}
                    onChange={e => setMeetTarikh(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Masa</label>
                  <input
                    type="text"
                    value={meetMasa}
                    onChange={e => setMeetMasa(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tempat</label>
                  <input
                    type="text"
                    value={meetTempat}
                    onChange={e => setMeetTempat(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pengerusi</label>
                  <input
                    type="text"
                    value={meetPengerusi}
                    onChange={e => setMeetPengerusi(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pencatat Minit</label>
                  <input
                    type="text"
                    value={meetPencatat}
                    onChange={e => setMeetPencatat(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Agenda Mesyuarat (1 baris setiap agenda)</label>
                <textarea
                  rows={3}
                  value={meetAgenda}
                  onChange={e => setMeetAgenda(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ringkasan Minit & Keputusan Utama</label>
                <textarea
                  rows={3}
                  value={meetMinit}
                  onChange={e => setMeetMinit(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Seksyen Tindakan Susulan */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold block text-slate-800">Senarai Tindakan Susulan (Tugasan Pegawai):</span>
                <div className="space-y-1.5">
                  {followUps.map(fu => (
                    <div key={fu.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <div>
                        <strong className="block text-slate-900">{fu.perkara}</strong>
                        <span className="text-[10px] text-slate-500">Tindakan: {fu.namaTindakanOleh} • Akhir: {fu.tarikhAkhir}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFollowUps(followUps.filter(f => f.id !== fu.id))}
                        className="text-red-500 hover:text-red-700 font-bold px-2"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Perkara / Tugasan..."
                    value={newFuPerkara}
                    onChange={e => setNewFuPerkara(e.target.value)}
                    className="border border-slate-300 rounded-lg p-1.5 col-span-1"
                  />
                  <input
                    type="text"
                    placeholder="Penanggungjawab..."
                    value={newFuPegawai}
                    onChange={e => setNewFuPegawai(e.target.value)}
                    className="border border-slate-300 rounded-lg p-1.5"
                  />
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={newFuTarikh}
                      onChange={e => setNewFuTarikh(e.target.value)}
                      className="border border-slate-300 rounded-lg p-1.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddFollowUpToForm}
                      className="px-2.5 py-1.5 bg-slate-800 text-white font-bold rounded-lg"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMeetingModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                >
                  Simpan Mesyuarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: JANA MINIT (CETAK/PDF) ================= */}
      {showPrintModal && selectedMeeting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 no-print">
              <span className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                Pratonton Minit Mesyuarat Rasmi KPM
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white font-bold rounded-lg text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Printable Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                {school.nama}
              </h2>
              <p className="text-xs text-slate-600">
                {school.alamat}, {school.poskod} {school.bandar}, {school.negeri}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                KOD SEKOLAH: {school.kodSekolah} • TEL: {school.noTelefon} • EMEL: {school.emel}
              </p>
              <div className="pt-2">
                <h3 className="text-sm font-black text-slate-900 uppercase underline">
                  MINIT {selectedMeeting.tajuk.toUpperCase()} ({selectedMeeting.bilangan})
                </h3>
              </div>
            </div>

            {/* Meeting Details Table */}
            <div className="grid grid-cols-2 gap-2 text-xs border border-slate-300 p-3 bg-slate-50/50">
              <div><strong>Tarikh:</strong> {selectedMeeting.tarikh}</div>
              <div><strong>Masa:</strong> {selectedMeeting.masa}</div>
              <div><strong>Tempat:</strong> {selectedMeeting.tempat}</div>
              <div><strong>Pengerusi:</strong> {selectedMeeting.pengerusi}</div>
            </div>

            {/* Agenda & Discussion */}
            <div className="space-y-3 text-xs text-slate-800 leading-relaxed">
              <div>
                <h4 className="font-bold underline uppercase mb-1">1. Perutusan Pengerusi</h4>
                <p>{selectedMeeting.minitRingkas}</p>
              </div>

              <div>
                <h4 className="font-bold underline uppercase mb-1">2. Perkara-Perkara Berbangkit</h4>
                <p>Minit mesyuarat yang lalu telah dibentangkan dan disahkan sebulat suara tanpa sebarang pindaan.</p>
              </div>

              <div>
                <h4 className="font-bold underline uppercase mb-1">3. Tindakan Susulan Jawatankuasa</h4>
                <table className="w-full border-collapse border border-slate-300 text-[11px] mt-2">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 p-1.5 text-left">Bil</th>
                      <th className="border border-slate-300 p-1.5 text-left">Perkara / Tugasan</th>
                      <th className="border border-slate-300 p-1.5 text-left">Tindakan</th>
                      <th className="border border-slate-300 p-1.5 text-left">Tarikh Akhir</th>
                      <th className="border border-slate-300 p-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeeting.tindakanSusulan.map((fu, idx) => (
                      <tr key={fu.id}>
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{fu.perkara}</td>
                        <td className="border border-slate-300 p-1.5">{fu.namaTindakanOleh}</td>
                        <td className="border border-slate-300 p-1.5">{fu.tarikhAkhir}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold">
                          {fu.status === 'selesai' ? 'SELESAI' : 'DALAM TINDAKAN'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-slate-900 border-t border-slate-200">
              <div className="space-y-12">
                <p>Disediakan oleh:</p>
                <div>
                  <strong className="block underline uppercase">{selectedMeeting.pencatatMinit}</strong>
                  <span className="text-[11px] text-slate-500">Pencatat Minit / Setiausaha HEM</span>
                </div>
              </div>

              <div className="space-y-12">
                <p>Disahkan oleh:</p>
                <div>
                  <strong className="block underline uppercase">{selectedMeeting.pengerusi}</strong>
                  <span className="text-[11px] text-slate-500">Pengerusi / GPK Hal Ehwal Murid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
