import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  Student,
  DailyClassAttendance,
  DisciplineCase,
  CounselingSession,
  AssistanceRecord,
  HemMeeting
} from '../types';
import {
  getStudents,
  getAttendanceList,
  getDisciplineCases,
  getCounselingSessions,
  getAssistanceRecords,
  getClassesList,
  getHemMeetings
} from '../services/dataService';
import { evaluateAllStudentsRisk, StudentRiskAssessment } from '../services/dropoutEngine';
import {
  Users,
  CalendarCheck,
  UserX,
  AlertTriangle,
  ShieldAlert,
  HeartHandshake,
  Award,
  Home,
  TrendingUp,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  HeartPulse,
  CalendarDays,
  CheckSquare,
  FileText,
  Trophy,
  GraduationCap,
  UserPlus,
  Settings,
  Megaphone,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';
import { SchoolLogo } from '../components/SchoolLogo';

export const Dashboard: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem } = useAuth();
  const { school, rules, dashboardSettings } = useSchool();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<DailyClassAttendance[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineCase[]>([]);
  const [counseling, setCounseling] = useState<CounselingSession[]>([]);
  const [assistance, setAssistance] = useState<AssistanceRecord[]>([]);
  const [meetings, setMeetings] = useState<HemMeeting[]>([]);
  const [riskList, setRiskList] = useState<StudentRiskAssessment[]>([]);

  // Filters
  const [filterTingkatan, setFilterTingkatan] = useState<string>('semua');
  const [filterKelas, setFilterKelas] = useState<string>('semua');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [stList, atList, dpList, csList, asList, mtList] = await Promise.all([
          getStudents(),
          getAttendanceList(),
          getDisciplineCases(),
          getCounselingSessions(),
          getAssistanceRecords(),
          getHemMeetings()
        ]);

        setStudents(stList);
        setAttendance(atList);
        setDiscipline(dpList);
        setCounseling(csList);
        setAssistance(asList);
        setMeetings(mtList);

        const evaluatedRisks = evaluateAllStudentsRisk(stList, atList, rules);
        setRiskList(evaluatedRisks);
      } catch (err) {
        console.error('Ralat memuatkan data dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [rules]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <SkeletonCard count={4} />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  // Filter students if class teacher has specific class
  const isClassTeacher = currentUser?.peranan.includes('guru_kelas') && !isPengetuaOrGpkHem;
  const teacherClassId = currentUser?.kelasDiajar?.[0]; // e.g. "3-marikh"
  const teacherClassName = teacherClassId === '3-marikh' ? '3 Marikh' : undefined;

  const relevantStudents = students.filter(s => {
    if (filterTingkatan !== 'semua' && s.tingkatan !== Number(filterTingkatan)) return false;
    if (filterKelas !== 'semua' && s.kelas !== filterKelas) return false;
    return true;
  });

  // Calculate Metrics
  const totalEnrolment = relevantStudents.length;
  const totalLelaki = relevantStudents.filter(s => s.jantina === 'lelaki').length;
  const totalPerempuan = relevantStudents.filter(s => s.jantina === 'perempuan').length;
  const totalHostel = relevantStudents.filter(s => s.penghuniAsrama).length;
  const totalAssistance = assistance.filter(a => relevantStudents.some(s => s.id === a.studentId)).length;

  // Today's attendance calculation
  // Find latest date in attendance records
  const uniqueDates = Array.from(new Set(attendance.map(a => a.tarikh))).sort();
  const latestDate = uniqueDates[uniqueDates.length - 1] || '2026-10-09';
  const latestAttendanceRecords = attendance.filter(a => a.tarikh === latestDate);

  let todayPresent = 0;
  let todayTotal = 0;
  let todayAbsentStudents: Student[] = [];

  latestAttendanceRecords.forEach(rec => {
    Object.entries(rec.rekod).forEach(([stuId, item]) => {
      const matchStu = relevantStudents.find(s => s.id === stuId);
      if (matchStu) {
        todayTotal++;
        if (item.status === 'hadir' || item.status === 'lewat' || item.status === 'urusan_rasmi') {
          todayPresent++;
        } else if (item.status === 'tidak_hadir') {
          todayAbsentStudents.push(matchStu);
        }
      }
    });
  });

  const todayPercentage = todayTotal > 0 ? Number(((todayPresent / todayTotal) * 100).toFixed(1)) : 0;
  const criticalRiskStudents = riskList.filter(r => r.riskTier === 'amaran3' || r.riskTier === 'amaran2');
  const openDisciplineCases = discipline.filter(d => d.statusKes !== 'selesai');
  const openCounselingCases = counseling.filter(c => c.status === 'aktif');

  // 30 Days Trend Data for Recharts
  const trendData = uniqueDates.slice(-30).map(d => {
    const dayRecords = attendance.filter(a => a.tarikh === d);
    let hadir = 0;
    let total = 0;
    dayRecords.forEach(r => {
      hadir += r.jumlahHadir;
      total += r.jumlahMurid;
    });
    const peratus = total > 0 ? Number(((hadir / total) * 100).toFixed(1)) : 0;
    // format date as DD/MM
    const parts = d.split('-');
    const label = `${parts[2]}/${parts[1]}`;
    return { tarikh: label, peratus, sasaran: rules.sasaranKehadiranSekolah };
  });

  // Attendance by Form (Tingkatan 1 to 5)
  const formStats = [1, 2, 3, 4, 5].map(t => {
    const tStudents = students.filter(s => s.tingkatan === t);
    const tAttendance = attendance.filter(a => a.tingkatan === t && a.tarikh === latestDate);
    let hadir = 0;
    let total = 0;
    tAttendance.forEach(a => {
      hadir += a.jumlahHadir;
      total += a.jumlahMurid;
    });
    const peratus = total > 0 ? Number(((hadir / total) * 100).toFixed(1)) : 92.0;
    return {
      tingkatan: `Ting. ${t}`,
      peratus,
      jumlah: tStudents.length,
      lelaki: tStudents.filter(s => s.jantina === 'lelaki').length,
      perempuan: tStudents.filter(s => s.jantina === 'perempuan').length
    };
  });

  // 5 Lowest Attendance Classes this week
  const classAvgMap = new Map<string, { totalHadir: number; totalMurid: number }>();
  const recentWeekDates = uniqueDates.slice(-5);
  attendance.filter(a => recentWeekDates.includes(a.tarikh)).forEach(a => {
    const current = classAvgMap.get(a.kelasId) || { totalHadir: 0, totalMurid: 0 };
    classAvgMap.set(a.kelasId, {
      totalHadir: current.totalHadir + a.jumlahHadir,
      totalMurid: current.totalMurid + a.jumlahMurid
    });
  });

  const lowestClasses = Array.from(classAvgMap.entries())
    .map(([kelasId, val]) => ({
      kelas: kelasId.replace('-', ' ').toUpperCase(),
      peratus: val.totalMurid > 0 ? Number(((val.totalHadir / val.totalMurid) * 100).toFixed(1)) : 90
    }))
    .sort((a, b) => a.peratus - b.peratus)
    .slice(0, 5);

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-20 lg:pb-8">
      {/* Header Utama: Ilustrasi Pelajar & Kecemerlangan HEM */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl border border-blue-900/40">
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-5 sm:p-7 lg:p-8">
          {/* Kolum Kiri: Informasi, Ucapan & Metrik Kecemerlangan Modal Insan */}
          <div className="lg:col-span-7 space-y-4">
            {/* Lencana Sesi & Kemenjadian */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-800/80 text-amber-300 border border-blue-700/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Sesi {school.sesi} • Tahun {school.tahunSemasa}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-white/10 text-emerald-300 border border-white/10">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kecemerlangan & Kemenjadian Murid</span>
              </span>
              <span className="text-xs text-blue-200/80 hidden sm:inline">
                {new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Ucapan Pengguna & Identiti Sekolah */}
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="shrink-0 p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                <SchoolLogo size="lg" className="drop-shadow-md hover:scale-105 transition-transform" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  Selamat Bertugas, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">{currentUser?.nama || 'Warga Pendidik'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
                  {school.nama} ({school.kodSekolah}) • {school.bandar}, Sabah.
                  <span className="block text-blue-200/85 mt-0.5">
                    Moto: <em>"{school.motoSekolah || 'Ilmuan Gemilang'}"</em> • Sasaran Kehadiran Sekolah: <strong className="text-amber-300">{rules.sasaranKehadiranSekolah}%</strong>
                  </span>
                </p>
              </div>
            </div>

            {/* Metrik Pantas Kemenjadian & Kesejahteraan Murid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-extrabold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Sahsiah & Disiplin</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white mt-1">
                  {totalEnrolment - openDisciplineCases.length} / {totalEnrolment}
                </div>
                <span className="text-[10px] text-blue-200/70 block truncate">Bebas tindakan kes</span>
              </div>

              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-extrabold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kehadiran Hari Ini</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white mt-1">
                  {todayPercentage}%
                </div>
                <span className="text-[10px] text-blue-200/70 block truncate">{todayPresent} hadir ke sekolah</span>
              </div>

              <div className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <div className="flex items-center gap-1.5 text-teal-300 text-[11px] font-extrabold">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>Kebajikan & Bantuan</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white mt-1">
                  {totalAssistance} Penerima
                </div>
                <span className="text-[10px] text-blue-200/70 block truncate">Biasiswa & agihan</span>
              </div>
            </div>

            {/* Butang Tindakan Pantas */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => navigate('/kehadiran')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Rekod Kehadiran Hari Ini</span>
              </button>

              <button
                onClick={() => navigate('/program-mesyuarat')}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-2 backdrop-blur-xs"
              >
                <CalendarDays className="w-4 h-4 text-blue-300" />
                <span>Kalendar & Program HEM</span>
              </button>

              <button
                onClick={() => navigate('/bantuan')}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-2 backdrop-blur-xs"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Skim Bantuan</span>
              </button>
            </div>
          </div>

          {/* Kolum Kanan: Ilustrasi Bergambar Pelajar & Kecemerlangan */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl group bg-slate-950">
              <img
                src="/src/assets/images/salaping_student_banner_1791731561584.jpg"
                alt="Ilustrasi Kecemerlangan & Kemenjadian Murid SMK Salaping"
                referrerPolicy="no-referrer"
                className="w-full h-56 sm:h-64 lg:h-72 object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {/* Lapisan Bayangan Gradien */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Lencana Atas Ilustrasi */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-[10px] font-extrabold text-amber-300 shadow-md">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Kemenjadian Murid Salaping</span>
              </div>

              {/* Kapsul Penerangan Bawah Ilustrasi */}
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 text-white">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 block">
                      Aspirasi Murid Salaping • Modal Insan
                    </span>
                    <h3 className="text-xs font-bold text-slate-100">
                      Kepimpinan • Kejayaan Akademik • Keunggulan Sahsiah
                    </h3>
                  </div>
                  <span className="shrink-0 w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs border border-amber-500/30">
                    ★
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Banner untuk Mod Data Sebenar */}
      {totalEnrolment === 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-sm text-blue-950">
                Pangkalan Data Murid Bersih (Sedia untuk Data Sekolah Sebenar)
              </h3>
              <p className="text-xs text-blue-900/80 leading-relaxed max-w-2xl">
                Data demo fiktif telah dipadamkan sepenuhnya. Mulakan kemasukan rekod murid sebenar SMK Salaping melalui borang pendaftaran individu atau import fail CSV (APDM).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/murid')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar / Import Murid</span>
            </button>
            <button
              onClick={() => navigate('/tetapan')}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-colors"
            >
              <span>Tetapan Sekolah</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-blue-700" />
          <span>Tapis Paparan Dashboard:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="text-slate-500 mr-1.5 font-medium">Tingkatan:</label>
            <select
              value={filterTingkatan}
              onChange={(e) => {
                setFilterTingkatan(e.target.value);
                setFilterKelas('semua');
              }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600"
            >
              <option value="semua">Semua Tingkatan</option>
              <option value="1">Tingkatan 1</option>
              <option value="2">Tingkatan 2</option>
              <option value="3">Tingkatan 3</option>
              <option value="4">Tingkatan 4</option>
              <option value="5">Tingkatan 5</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 mr-1.5 font-medium">Kelas:</label>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium focus:ring-1 focus:ring-blue-600"
            >
              <option value="semua">Semua Kelas</option>
              <option value="1 Arif">1 Arif</option>
              <option value="1 Bestari">1 Bestari</option>
              <option value="2 Arif">2 Arif</option>
              <option value="2 Bestari">2 Bestari</option>
              <option value="3 Arif">3 Arif</option>
              <option value="3 Marikh">3 Marikh</option>
              <option value="4 Sains">4 Sains</option>
              <option value="5 Sains">5 Sains</option>
            </select>
          </div>

          {(filterTingkatan !== 'semua' || filterKelas !== 'semua') && (
            <button
              onClick={() => {
                setFilterTingkatan('semua');
                setFilterKelas('semua');
              }}
              className="text-blue-700 hover:underline font-semibold ml-2"
            >
              Set Semula
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Enrolmen */}
        <div
          onClick={() => navigate('/murid')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Jumlah Enrolmen</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalEnrolment}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lelaki: <strong className="text-slate-700">{totalLelaki}</strong> • Perempuan:{' '}
            <strong className="text-slate-700">{totalPerempuan}</strong>
          </p>
        </div>

        {/* KPI 2: Peratus Kehadiran Hari Ini */}
        <div
          onClick={() => navigate('/kehadiran')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Kehadiran Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-700">{todayPercentage}%</span>
            <span className="text-[10px] text-slate-400">
              (Sasaran: {rules.sasaranKehadiranSekolah}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Hadir: <strong className="text-emerald-700">{todayPresent}</strong> / {todayTotal} murid
          </p>
        </div>

        {/* KPI 3: Tidak Hadir Hari Ini */}
        <div
          onClick={() => navigate('/kehadiran')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tidak Hadir Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{todayAbsentStudents.length}</div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {todayAbsentStudents.length > 0 ? 'Perlu tindakan semakan sebab' : 'Semua hadir'}
          </p>
        </div>

        {/* KPI 4: Berisiko Cicir (SOP 1:3:7) */}
        <div
          onClick={() => navigate('/risiko-cicir')}
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs bg-amber-50/40 hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900">Murid Berisiko Cicir</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">{criticalRiskStudents.length}</div>
          <p className="text-[11px] text-amber-900 font-medium mt-1">
            Melepasi ambang Amaran 2 & 3
          </p>
        </div>

        {/* KPI 5: Kes Disiplin Bulan Ini */}
        <div
          onClick={() => navigate('/disiplin')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-red-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Kes Disiplin Terbuka</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{openDisciplineCases.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Jumlah kes dilaporkan: {discipline.length}
          </p>
        </div>

        {/* KPI 6: Kaunseling Terbuka */}
        <div
          onClick={() => navigate('/kaunseling')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Kaunseling Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{openCounselingCases.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Bimbingan berfokus GBK
          </p>
        </div>

        {/* KPI 7: Penerima Bantuan */}
        <div
          onClick={() => navigate('/bantuan')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Penerima Bantuan</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-800">{totalAssistance}</div>
          <p className="text-[11px] text-teal-700 font-semibold mt-1">
            Pantau Kuota & Agihan Skim
          </p>
        </div>

        {/* KPI 8: Penghuni Asrama */}
        <div
          onClick={() => navigate('/asrama')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Penghuni Asrama Desa</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-800">{totalHostel} <span className="text-xs font-medium text-slate-500">/ 60</span></div>
          <p className="text-[11px] text-indigo-700 font-semibold mt-1">
            Kapasiti & Kuota Katil Asrama
          </p>
        </div>
      </div>

      {/* Panel "Perlukan Tindakan Segera" (Action Required) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Panel Tindakan Segera (Intervensi HEM)
              </h2>
              <p className="text-xs text-slate-500">
                Murid melepasi ambang amaran ketidakhadiran & kes belum selesai
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/risiko-cicir')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>Semua Tindakan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {criticalRiskStudents.slice(0, 4).map((risk) => (
            <div
              key={risk.student.id}
              onClick={() => navigate(`/risiko-cicir`)}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    risk.riskTier === 'amaran3'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {risk.consecutiveAbsences}H
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{risk.student.nama}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {risk.student.kelas}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        risk.riskTier === 'amaran3'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {risk.riskTier === 'amaran3' ? 'Amaran 3 (Kritikal)' : 'Amaran 2 (Tinggi)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {risk.student.kampung} • {risk.consecutiveAbsences} hari berturut-turut tidak hadir ({risk.attendancePercentage}% keseluruhan)
                  </p>
                  <p className="text-xs text-amber-900 font-medium mt-1">
                    Cadangan: {risk.cadanganTindakan}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                  <span>Jana Surat / WhatsApp</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}

          {criticalRiskStudents.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Tiada murid yang melepasi ambang kritikal pada masa ini.
            </div>
          )}
        </div>
      </div>

      {/* Panel Tugasan Tertunggak Mesyuarat HEM (Fasa 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Tindakan Susulan & Amanah Mesyuarat HEM ({meetings.flatMap(m => m.tindakanSusulan.filter(f => f.status !== 'selesai')).length} Tertunggak)
              </h2>
              <p className="text-xs text-slate-500">
                Keputusan mesyuarat jawatankuasa yang memerlukan pelaksanaan oleh pegawai berkaitan
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/program-mesyuarat')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            <span>Semua Minit</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {meetings.flatMap(m =>
            m.tindakanSusulan
              .filter(fu => fu.status !== 'selesai')
              .map(fu => ({ ...fu, bil: m.bilangan, tajuk: m.tajuk }))
          ).slice(0, 4).map(task => (
            <div
              key={task.id}
              onClick={() => navigate('/program-mesyuarat')}
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold text-slate-900 text-sm">{task.perkara}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {task.bil}
                  </span>
                </div>
                <div className="text-slate-500 flex items-center gap-2 pl-4.5 text-[11px]">
                  <span>Pegawai: <strong className="text-slate-800">{task.namaTindakanOleh}</strong></span>
                  <span>•</span>
                  <span>Tarikh Akhir: <strong className="text-red-700">{task.tarikhAkhir}</strong></span>
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center pl-4.5 sm:pl-0">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {task.status === 'dalam_tindakan' ? 'DALAM TINDAKAN' : 'BELUM SELESAI'}
                </span>
              </div>
            </div>
          ))}

          {meetings.flatMap(m => m.tindakanSusulan.filter(f => f.status !== 'selesai')).length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">
              Semua tindakan susulan mesyuarat HEM telah diselesaikan dengan jayanya.
            </div>
          )}
        </div>
      </div>

      {/* Baris Pintas Pantas Modul HEM (3K, Pengawas, Program) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => navigate('/3k')}
          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-red-300 cursor-pointer flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs group-hover:text-red-700 transition-colors">
                Kesihatan, Keselamatan & 3K
              </h4>
              <p className="text-[11px] text-slate-500">Bilik sakit, audit kawasan & talian kecemasan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => navigate('/pengawas')}
          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-indigo-300 cursor-pointer flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-700 transition-colors">
                Badan Pengawas Sekolah
              </h4>
              <p className="text-[11px] text-slate-500">Senarai exco & jadual tugas harian</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => navigate('/program-mesyuarat')}
          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-blue-300 cursor-pointer flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                Takwim HEM & Mesyuarat
              </h4>
              <p className="text-[11px] text-slate-500">Program tahunan, perhimpunan & minit</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carta 1: Trend Kehadiran 30 Hari */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trend Kehadiran Sekolah (30 Hari)</h3>
              <p className="text-xs text-slate-500">Peratus kehadiran harian berbanding sasaran 90%</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
              Purata: 91.5%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tarikh" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Peratus']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="peratus"
                  name="Kehadiran Sebenar"
                  stroke="#1d4ed8"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="sasaran"
                  name="Sasaran KPM"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carta 2: Kehadiran Mengikut Tingkatan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kehadiran Mengikut Tingkatan</h3>
              <p className="text-xs text-slate-500">Perbandingan Tingkatan 1 hingga 5</p>
            </div>
            <span className="text-xs font-semibold text-slate-600">Hari ini</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tingkatan" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Peratus Hadir']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="peratus" name="% Kehadiran" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row: Taburan Jantina & 5 Kelas Kehadiran Terendah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taburan Enrolmen & Jantina */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Taburan Enrolmen Mengikut Tingkatan</h3>
          <p className="text-xs text-slate-500 mb-4">Pecahan bilangan murid lelaki dan perempuan</p>

          <div className="space-y-3">
            {formStats.map((item) => (
              <div key={item.tingkatan} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.tingkatan} ({item.jumlah} Murid)</span>
                  <span className="text-slate-500">
                    L: {item.lelaki} | P: {item.perempuan}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(item.lelaki / item.jumlah) * 100}%` }}
                    className="bg-blue-600 h-full"
                    title={`Lelaki: ${item.lelaki}`}
                  />
                  <div
                    style={{ width: `${(item.perempuan / item.jumlah) * 100}%` }}
                    className="bg-pink-500 h-full"
                    title={`Perempuan: ${item.perempuan}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Kelas Kehadiran Terendah Minggu Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900">5 Kelas Kehadiran Terendah (Minggu Ini)</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
              PERLU PERHATIAN
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Kelas yang memerlukan pemantauan intensif guru kelas</p>

          <div className="space-y-3">
            {lowestClasses.map((item, idx) => {
              const isBelowTarget = item.peratus < rules.sasaranKehadiranSekolah;
              return (
                <div
                  key={item.kelas}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{item.kelas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        isBelowTarget ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.peratus}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
