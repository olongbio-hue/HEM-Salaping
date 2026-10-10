import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  CounselingSession,
  Student,
  MentalHealthScreening,
  MentorMenteePair,
  CareerCounselingProfile
} from '../types';
import {
  getCounselingSessions,
  getStudents,
  saveCounselingSession,
  getMentalHealthScreenings,
  saveMentalHealthScreening,
  getMentorMenteePairs,
  saveMentorMenteePair,
  getCareerProfiles,
  saveCareerProfile
} from '../services/dataService';
import { encryptCounselingNote, decryptCounselingNote } from '../services/cryptoService';
import {
  HeartHandshake,
  Lock,
  Unlock,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  User,
  ShieldCheck,
  Activity,
  Compass,
  Users2,
  BarChart3,
  AlertCircle,
  Clock,
  KeyRound,
  FileText
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export const Counseling: React.FC = () => {
  const { currentUser, canViewCounseling, isPengetuaOrGpkHem } = useAuth();
  const { showToast } = useSchool();

  const isGBK = currentUser?.peranan.includes('gbk') || false;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [screenings, setScreenings] = useState<MentalHealthScreening[]>([]);
  const [mentorMentees, setMentorMentees] = useState<MentorMenteePair[]>([]);
  const [careerProfiles, setCareerProfiles] = useState<CareerCounselingProfile[]>([]);

  // Active View Tabs
  const [activeTab, setActiveTab] = useState<'sesi' | 'saringan' | 'mentor' | 'kerjaya' | 'dashboard'>('sesi');

  // Encryption Key State for GBK session notes
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passKey, setPassKey] = useState('salaping_gbk_secret_2026');
  const [decryptedNotesMap, setDecryptedNotesMap] = useState<Record<string, string>>({});

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [filterRujukan, setFilterRujukan] = useState<string>('semua');

  // Modals
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddScreening, setShowAddScreening] = useState(false);

  // New Session Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [jenisSesi, setJenisSesi] = useState<CounselingSession['jenisSesi']>('individu');
  const [kategoriIsu, setKategoriIsu] = useState<CounselingSession['kategoriIsu']>('emosi');
  const [rujukanDari, setRujukanDari] = useState<CounselingSession['rujukanDari']>('guru');
  const [tahapKeutamaan, setTahapKeutamaan] = useState<CounselingSession['tahapKeutamaan']>('sederhana');
  const [isuUtama, setIsuUtama] = useState('');
  const [catatanSesi, setCatatanSesi] = useState('');
  const [tindakanSusulan, setTindakanSusulan] = useState('');
  const [tempohMinit, setTempohMinit] = useState(45);

  // Screening Form State
  const [screenStudentId, setScreenStudentId] = useState('');
  const [skorStres, setSkorStres] = useState(12);
  const [skorKeresahan, setSkorKeresahan] = useState(10);
  const [skorKemurungan, setSkorKemurungan] = useState(8);
  const [screenCatatan, setScreenCatatan] = useState('');
  const [screenHospital, setScreenHospital] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const operator = currentUser || { uid: 'auth', nama: 'Pengguna' };
        const [csList, stList, scList, mmList, cpList] = await Promise.all([
          getCounselingSessions(operator),
          getStudents(),
          getMentalHealthScreenings(),
          getMentorMenteePairs(),
          getCareerProfiles()
        ]);
        setSessions(csList);
        setStudents(stList);
        setScreenings(scList);
        setMentorMentees(mmList);
        setCareerProfiles(cpList);
        if (stList.length > 0) {
          setSelectedStudentId(stList[0].id);
          setScreenStudentId(stList[0].id);
        }
      } catch (err) {
        console.error('Ralat memuatkan UBK:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  // Unlock / Decrypt notes for GBK
  const handleUnlockNotes = async () => {
    try {
      const map: Record<string, string> = {};
      for (const s of sessions) {
        map[s.id] = await decryptCounselingNote(s.catatanSesi, passKey);
      }
      setDecryptedNotesMap(map);
      setIsUnlocked(true);
      showToast('Penyulitan nota sesi berjaya dinyahkunci untuk sesi kaunselor.', 'success');
    } catch {
      showToast('Kunci nyahsulit tidak sah.', 'error');
    }
  };

  // Save new session with application-level Web Crypto encryption
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isuUtama || !catatanSesi) {
      showToast('Sila isikan isu dan catatan sesi.', 'error');
      return;
    }

    try {
      // Encrypt the session note using AES-GCM
      const encryptedNote = await encryptCounselingNote(catatanSesi, passKey);

      const newSession: CounselingSession = {
        id: `coun_${Date.now()}`,
        studentId: selectedStudentId,
        tarikh: new Date().toISOString().split('T')[0],
        tempohMinit: Number(tempohMinit),
        jenisSesi,
        kategoriIsu,
        rujukanDari,
        tahapKeutamaan,
        isuUtama,
        catatanSesi: encryptedNote,
        tindakanSusulan: tindakanSusulan || 'Pemantauan berterusan',
        gbkUid: currentUser?.uid || 'gbk',
        namaGbk: currentUser?.nama || 'Cik Norazimah Binti Abdullah (GBK)',
        status: 'aktif',
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'system', nama: 'GBK' };
      await saveCounselingSession(newSession, operator, true);

      setSessions(prev => [newSession, ...prev]);
      if (isUnlocked) {
        setDecryptedNotesMap(prev => ({ ...prev, [newSession.id]: catatanSesi }));
      }
      setShowAddSession(false);
      setIsuUtama('');
      setCatatanSesi('');
      setTindakanSusulan('');
      showToast('Sesi bimbingan kaunseling berjaya disulitkan dan direkodkan!', 'success');
    } catch (err) {
      showToast('Gagal merekod sesi kaunseling.', 'error');
    }
  };

  // Save new mental health screening
  const handleSaveScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const maxScore = Math.max(skorStres, skorKeresahan, skorKemurungan);
      let tahap: MentalHealthScreening['tahapKeseluruhan'] = 'normal';
      let perluRujuk = false;

      if (maxScore >= 20) {
        tahap = 'teruk';
        perluRujuk = true;
      } else if (maxScore >= 15) {
        tahap = 'sederhana';
      } else if (maxScore >= 10) {
        tahap = 'ringan';
      }

      const newScreening: MentalHealthScreening = {
        id: `mhs_${Date.now()}`,
        studentId: screenStudentId,
        tarikh: new Date().toISOString().split('T')[0],
        skorStres: Number(skorStres),
        skorKeresahan: Number(skorKeresahan),
        skorKemurungan: Number(skorKemurungan),
        tahapKeseluruhan: tahap,
        perluRujukanKKM: perluRujuk,
        catatanGbk: screenCatatan || 'Saringan berkala minda sihat KPM.',
        statusRujukan: perluRujuk ? 'dirujuk_kkm' : 'dalam_pantauan',
        namaKlinikHospital: perluRujuk ? (screenHospital || 'Klinik Kesihatan Tandek / Hospital Kota Marudu') : undefined,
        dicipta: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'system', nama: 'GBK' };
      await saveMentalHealthScreening(newScreening, operator);
      setScreenings(prev => [newScreening, ...prev]);
      setShowAddScreening(false);
      setScreenCatatan('');
      showToast('Saringan kesihatan mental berjaya direkodkan.', 'success');
    } catch (err) {
      showToast('Gagal merekod saringan minda sihat.', 'error');
    }
  };

  if (!canViewCounseling) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <Lock className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-black text-red-900">Akses Terhad (Kerahsiaan Kaunselor)</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto leading-relaxed">
            Hanya Guru Bimbingan & Kaunseling (GBK) berdaftar, Pengetua, dan GPK HEM dibenarkan mengakses modul ini. Kandungan nota sesi dilindungi di bawah Akta Kaunselor 1998.
          </p>
        </div>
      </div>
    );
  }

  // Filtered Sessions
  const filteredSessions = sessions.filter(s => {
    if (filterJenis !== 'semua' && s.jenisSesi !== filterJenis) return false;
    if (filterRujukan !== 'semua' && s.rujukanDari !== filterRujukan) return false;
    if (searchTerm) {
      const stu = students.find(st => st.id === s.studentId);
      const q = searchTerm.toLowerCase();
      const matchName = stu?.nama.toLowerCase().includes(q);
      const matchIsu = s.isuUtama.toLowerCase().includes(q);
      if (!matchName && !matchIsu) return false;
    }
    return true;
  });

  // Aggregate stats for UBK dashboard
  const issueCounts: Record<string, number> = {};
  sessions.forEach(s => {
    const k = s.kategoriIsu || 'emosi';
    issueCounts[k] = (issueCounts[k] || 0) + 1;
  });

  const pieData = Object.entries(issueCounts).map(([k, val]) => ({
    name: k.toUpperCase(),
    value: val
  }));
  const COLORS = ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-800 text-purple-200 border border-purple-700">
              Unit Bimbingan & Kaunseling (UBK)
            </span>
            <span className="text-xs text-purple-300">
              Guru Kaunselor: Cik Norazimah Binti Abdullah
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Perkhidmatan Bimbingan, Kaunseling & Minda Sihat
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Pengendalian sesi bimbingan sulit, saringan kesihatan mental, program mentor-mentee, dan halatuju kerjaya murid SMK Salaping.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isGBK && (
            <button
              onClick={() => setShowAddSession(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Sesi Kaunseling</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Disclaimer Banner */}
      <div className="p-3 bg-purple-50 border border-purple-300 rounded-2xl text-purple-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0" />
          <span>
            <strong>Penafian Etika Sulit:</strong> Maklumat dalam modul ini adalah sulit dan dilindungi di bawah Akta Kaunselor 1998. Setiap akses, tontonan atau ubah suai direkodkan dalam Log Audit Keselamatan.
          </span>
        </div>

        {/* GBK Note Decryption Toggle */}
        {isGBK && (
          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked ? (
              <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                <Unlock className="w-3.5 h-3.5" />
                <span>Nota Terbuka (Nyahsulit Aktif)</span>
              </span>
            ) : (
              <button
                onClick={handleUnlockNotes}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Nyahsulit Nota GBK</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('sesi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'sesi' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Rekod Sesi & Rujukan Masuk ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saringan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'saringan' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Saringan Minda Sihat ({screenings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mentor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'mentor' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Program Mentor-Mentee ({mentorMentees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kerjaya')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'kerjaya' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Kaunseling Kerjaya & Pasca-SPM ({careerProfiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard Agregat UBK</span>
        </button>
      </div>

      {/* ================= TAB 1: REKOD SESI & RUJUKAN MASUK ================= */}
      {activeTab === 'sesi' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari isu atau murid..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterJenis}
                onChange={e => setFilterJenis(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Jenis Sesi</option>
                <option value="individu">Sesi Individu</option>
                <option value="kelompok">Sesi Kelompok</option>
                <option value="krisis">Sesi Krisis</option>
                <option value="kerjaya">Bimbingan Kerjaya</option>
                <option value="disiplin">Intervensi Disiplin</option>
              </select>

              <select
                value={filterRujukan}
                onChange={e => setFilterRujukan(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Punca Rujukan</option>
                <option value="guru">Rujukan Guru</option>
                <option value="disiplin">Rujukan Disiplin</option>
                <option value="kehadiran">Rujukan Kehadiran (Cicir)</option>
                <option value="ibu_bapa">Rujukan Ibu Bapa</option>
                <option value="kendiri">Rujukan Kendiri</option>
              </select>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-3">
            {filteredSessions.map(s => {
              const stu = students.find(st => st.id === s.studentId);
              const noteText = decryptedNotesMap[s.id] || (isUnlocked ? s.catatanSesi : '[KANDUNGAN SULIT: Disulitkan dengan AES-GCM]');

              return (
                <div
                  key={s.id}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {isPengetuaOrGpkHem && !isGBK ? `Kes Murid (${stu?.kelas})` : stu?.nama || 'Murid'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                        {stu?.kelas}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] uppercase">
                        Sesi {s.jenisSesi}
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-slate-100 text-slate-700">
                        Rujukan: {s.rujukanDari || 'guru'}
                      </span>
                      {s.tahapKeutamaan === 'tinggi' && (
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase bg-red-100 text-red-800">
                          Keutamaan Tinggi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Tarikh: {s.tarikh} ({s.tempohMinit || 45} min)</span>
                      <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase bg-emerald-100 text-emerald-800">
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="font-extrabold text-purple-950">
                      Isu Utama: {s.isuUtama}
                    </p>

                    {/* Catatan Sesi: Hanya GBK Boleh Baca Kandungan Sebenar */}
                    {isGBK ? (
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                        <div className="flex items-center justify-between font-bold text-purple-900">
                          <span>Catatan Sesi Kaunselor (Sulit AES-GCM):</span>
                          {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                          {noteText}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 italic text-[11px] flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Kandungan sesi ini dilindungi kerahsiaan etika GBK. Hanya ringkasan status dan tindakan susulan dipaparkan kepada pihak pentadbir.</span>
                      </div>
                    )}

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                      <span className="font-bold text-slate-900">Pelan Tindakan Susulan: </span>
                      {s.tindakanSusulan}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                    <span>Kaunselor: <strong>{s.namaGbk}</strong></span>
                    <span>Status: {s.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}

            {filteredSessions.length === 0 && (
              <EmptyState
                title="Tiada Sesi Kaunseling Ditemui"
                description="Tiada rekod sesi yang sepadan dengan tapisan semasa."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SARINGAN MINDA SIHAT ================= */}
      {activeTab === 'saringan' && (
        <div className="space-y-4 text-xs">
          {/* Header Strip & Disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Saringan Kesejahteraan Minda Sihat (Skala DASS-21)</h3>
              <p className="text-slate-500">Alat pengesanan awal tahap stres, keresahan, dan kemurungan murid</p>
            </div>
            {isGBK && (
              <button
                onClick={() => setShowAddScreening(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Rekod Saringan Baharu</span>
              </button>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>PERINGATAN PERUBATAN:</strong> Borang saringan berskala ini adalah instrumen pengesanan awal kesejahteraan emosi dan <strong>BUKAN ALAT DIAGNOSIS PERUBATAN/PSIKIATRI</strong>. Murid yang mendapat skor tahap teruk wajib dirujuk kepada Pegawai Perubatan Klinik Kesihatan / Hospital Kota Marudu untuk penilaian klinikal rasmi.
            </p>
          </div>

          <div className="space-y-3">
            {screenings.map(sc => {
              const stu = students.find(s => s.id === sc.studentId);
              return (
                <div key={sc.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{stu?.nama || 'Murid'}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-xs">{stu?.kelas}</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                        sc.tahapKeseluruhan === 'teruk' ? 'bg-red-100 text-red-800 border border-red-300' :
                        sc.tahapKeseluruhan === 'sederhana' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Tahap: {sc.tahapKeseluruhan}
                      </span>
                    </div>
                    <span className="text-slate-400">Tarikh Saringan: {sc.tarikh}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold block text-[10px]">Skor Stres</span>
                      <strong className="text-base text-slate-900">{sc.skorStres}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold block text-[10px]">Skor Keresahan</span>
                      <strong className="text-base text-slate-900">{sc.skorKeresahan}</strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-semibold block text-[10px]">Skor Kemurungan</span>
                      <strong className="text-base text-slate-900">{sc.skorKemurungan}</strong>
                    </div>
                  </div>

                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {sc.catatanGbk}
                  </p>

                  {sc.perluRujukanKKM && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950 flex items-center justify-between">
                      <div>
                        <strong>Dirujuk kepada Fasiliti Kesihatan KKM:</strong>
                        <p className="text-[11px]">{sc.namaKlinikHospital || 'Hospital Kota Marudu / Klinik Kesihatan Tandek'}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg text-[10px] uppercase">
                        RUJUKAN KKM DIAKTIFKAN
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PROGRAM MENTOR-MENTEE ================= */}
      {activeTab === 'mentor' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Program Mentor-Mentee SMK Salaping 2026</h3>
            <p className="text-slate-500">Pemadanan guru mentor bagi bimbingan sahsiah dan motivasi berterusan murid</p>
          </div>

          <div className="space-y-3">
            {mentorMentees.map(mm => (
              <div key={mm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">Mentee: {mm.namaMentee}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">{mm.kelasMentee}</span>
                  </div>
                  <span className="font-bold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg">
                    Mentor: {mm.namaMentor}
                  </span>
                </div>

                <p className="text-slate-600">
                  Fokus Bimbingan: <strong>{mm.fokusBimbingan}</strong>
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-800 block text-[11px]">Log Pertemuan Mentor-Mentee:</span>
                  {mm.logPertemuan.map(l => (
                    <div key={l.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-start gap-2">
                      <span className="font-mono font-bold text-slate-500 shrink-0">[{l.tarikh}]</span>
                      <div>
                        <strong className="text-slate-900">{l.topik}: </strong>
                        <span className="text-slate-600">{l.catatan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: KAUNSELING KERJAYA ================= */}
      {activeTab === 'kerjaya' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Bimbingan Kerjaya & Hala Tuju Pasca-SPM</h3>
            <p className="text-slate-500">Inventori minat kerjaya (RIASEC), laluan TVET Sabah, dan permohonan biasiswa pengajian tinggi</p>
          </div>

          <div className="space-y-3">
            {careerProfiles.map(cp => {
              const stu = students.find(s => s.id === cp.studentId);
              return (
                <div key={cp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm text-slate-900">{stu?.nama || 'Murid'}</span>
                      <span className="text-slate-500 ml-2">({stu?.kelas})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-900">
                      {cp.minatRIASEC}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800">Pilihan Institusi / Kursus Sasaran:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cp.pilihanPascaSPM.map((opt, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800">
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    {cp.rekodBimbingan.map((rb, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                        <strong>{rb.tarikh} - {rb.halaTuju}:</strong> {rb.catatan}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 5: DASHBOARD AGREGAT UBK ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 text-xs">
          {/* Aggregate KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-semibold">Jumlah Sesi Kaunseling</span>
              <div className="text-2xl font-black text-purple-900 mt-1">{sessions.length}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-semibold">Sesi Bulan Semasa</span>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {sessions.filter(s => s.tarikh.startsWith('2026-09') || s.tarikh.startsWith('2026-10')).length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-semibold">Kes Diselesaikan</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {sessions.filter(s => s.status === 'selesai').length}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-semibold">Rujukan Saringan KKM</span>
              <div className="text-2xl font-black text-red-700 mt-1">
                {screenings.filter(sc => sc.perluRujukanKKM).length}
              </div>
            </div>
          </div>

          {/* Charts (Without revealing individual identities) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">Taburan Isu Kaunseling (Agregat)</h4>
              <p className="text-slate-500 mb-4">Statistik kategori isu tanpa mendedahkan identiti peribadi murid</p>

              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">Punca Rujukan Masuk</h4>
              <p className="text-slate-500 mb-4">Saluran rujukan murid ke perkhidmatan kaunseling</p>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Guru', count: sessions.filter(s => s.rujukanDari === 'guru').length },
                    { name: 'Disiplin', count: sessions.filter(s => s.rujukanDari === 'disiplin').length },
                    { name: 'Kehadiran', count: sessions.filter(s => s.rujukanDari === 'kehadiran').length },
                    { name: 'Ibu Bapa', count: sessions.filter(s => s.rujukanDari === 'ibu_bapa').length },
                    { name: 'Kendiri', count: sessions.filter(s => s.rujukanDari === 'kendiri').length }
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Bilangan Kes" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buka Sesi Kaunseling */}
      {showAddSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Buka Sesi Kaunseling & Intervensi</h3>
            <p className="text-slate-500 mb-3">Unit Bimbingan & Kaunseling SMK Salaping</p>

            <form onSubmit={handleSaveSession} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Pilih Murid *</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Jenis Sesi</label>
                  <select
                    value={jenisSesi}
                    onChange={e => setJenisSesi(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="individu">Sesi Individu</option>
                    <option value="kelompok">Sesi Kelompok</option>
                    <option value="krisis">Sesi Krisis</option>
                    <option value="kerjaya">Kerjaya / TVET</option>
                    <option value="disiplin">Intervensi Disiplin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Punca Rujukan</label>
                  <select
                    value={rujukanDari}
                    onChange={e => setRujukanDari(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="guru">Guru Mata Pelajaran</option>
                    <option value="disiplin">Rujukan Disiplin</option>
                    <option value="kehadiran">Rujukan Kehadiran (Cicir)</option>
                    <option value="ibu_bapa">Ibu Bapa / Waris</option>
                    <option value="kendiri">Sukarela (Kendiri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Isu Utama *</label>
                <input
                  type="text"
                  required
                  value={isuUtama}
                  onChange={e => setIsuUtama(e.target.value)}
                  placeholder="Contoh: Bimbingan emosi / Masalah penyesuaian diri"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 flex items-center justify-between">
                  <span>Catatan Sesi Kaunselor (Akan disulitkan dengan AES-GCM) *</span>
                  <Lock className="w-3.5 h-3.5 text-purple-700" />
                </label>
                <textarea
                  rows={4}
                  required
                  value={catatanSesi}
                  onChange={e => setCatatanSesi(e.target.value)}
                  placeholder="Perincian luahan klien, dinamika sesi, dan intervensi psikososial..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Pelan Tindakan Susulan</label>
                <input
                  type="text"
                  value={tindakanSusulan}
                  onChange={e => setTindakanSusulan(e.target.value)}
                  placeholder="Contoh: Sesi ulangan dalam tempoh 14 hari"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSession(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-700 text-white rounded-lg shadow-xs hover:bg-purple-800"
                >
                  Simpan Sesi Sulit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rekod Saringan Minda Sihat */}
      {showAddScreening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Rekod Saringan Minda Sihat (DASS)</h3>
            <p className="text-slate-500 mb-3">Unit Bimbingan & Kaunseling SMK Salaping</p>

            <form onSubmit={handleSaveScreening} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Pilih Murid *</label>
                <select
                  value={screenStudentId}
                  onChange={e => setScreenStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Skor Stres (0-42)</label>
                  <input
                    type="number"
                    value={skorStres}
                    onChange={e => setSkorStres(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Keresahan (0-42)</label>
                  <input
                    type="number"
                    value={skorKeresahan}
                    onChange={e => setSkorKeresahan(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kemurungan (0-42)</label>
                  <input
                    type="number"
                    value={skorKemurungan}
                    onChange={e => setSkorKemurungan(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Catatan Kaunselor</label>
                <textarea
                  rows={3}
                  value={screenCatatan}
                  onChange={e => setScreenCatatan(e.target.value)}
                  placeholder="Keterangan keadaan murid dan respons saringan..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {(skorStres >= 20 || skorKeresahan >= 20 || skorKemurungan >= 20) && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-1 text-red-950">
                  <strong className="block">Perhatian Rujukan KKM Diperlukan:</strong>
                  <p className="text-[11px]">Skor melepasi ambang tinggi. Masukkan fasiliti kesihatan rujukan:</p>
                  <input
                    type="text"
                    value={screenHospital}
                    onChange={e => setScreenHospital(e.target.value)}
                    placeholder="Contoh: Hospital Kota Marudu / Klinik Kesihatan Tandek"
                    className="w-full border border-red-300 rounded-lg p-1.5 text-xs bg-white mt-1"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddScreening(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-700 text-white rounded-lg shadow-xs hover:bg-purple-800"
                >
                  Simpan Saringan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
