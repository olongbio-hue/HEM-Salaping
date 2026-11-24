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
  HemMeeting,
  ClassInfo
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
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Filter,
  CalendarDays,
  UserPlus,
  MoreVertical,
  Plus,
  Play,
  ArrowUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { SkeletonCard, SkeletonTable } from '../components/SkeletonLoader';
import defaultBannerImg from '../assets/images/salaping_student_banner_1791731561584.jpg';

const FORM_BAR_COLORS = ['#0ea5e9', '#7c3aed', '#34d399', '#ff3e6c', '#ffc107'];

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { school, rules, dashboardSettings, theme } = useSchool();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<DailyClassAttendance[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineCase[]>([]);
  const [counseling, setCounseling] = useState<CounselingSession[]>([]);
  const [assistance, setAssistance] = useState<AssistanceRecord[]>([]);
  const [meetings, setMeetings] = useState<HemMeeting[]>([]);
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);
  const [riskList, setRiskList] = useState<StudentRiskAssessment[]>([]);

  const [filterTingkatan, setFilterTingkatan] = useState<string>('semua');
  const [filterKelas, setFilterKelas] = useState<string>('semua');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [stList, atList, dpList, csList, asList, mtList, clsList] = await Promise.all([
          getStudents(),
          getAttendanceList(),
          getDisciplineCases(),
          getCounselingSessions(),
          getAssistanceRecords(),
          getHemMeetings(),
          getClassesList()
        ]);

        setStudents(stList);
        setAttendance(atList);
        setDiscipline(dpList);
        setCounseling(csList);
        setAssistance(asList);
        setMeetings(mtList);
        setClassesList(clsList);

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
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <SkeletonCard count={4} />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  const relevantStudents = students.filter(s => {
    if (filterTingkatan !== 'semua' && s.tingkatan !== Number(filterTingkatan)) return false;
    if (filterKelas !== 'semua' && s.kelas !== filterKelas) return false;
    return true;
  });

  const totalEnrolment = relevantStudents.length;
  const totalLelaki = relevantStudents.filter(s => s.jantina === 'lelaki').length;
  const totalPerempuan = relevantStudents.filter(s => s.jantina === 'perempuan').length;
  const totalHostel = relevantStudents.filter(s => s.penghuniAsrama).length;
  const totalAssistance = assistance.filter(a => relevantStudents.some(s => s.id === a.studentId)).length;

  const uniqueDates = Array.from(new Set(attendance.map(a => a.tarikh))).sort();
  const latestDate = uniqueDates[uniqueDates.length - 1] || new Date().toISOString().split('T')[0];
  const latestAttendanceRecords = attendance.filter(a => a.tarikh === latestDate);

  let todayPresent = 0;
  let todayTotal = 0;

  latestAttendanceRecords.forEach(rec => {
    Object.entries(rec.rekod).forEach(([stuId, item]) => {
      const matchStu = relevantStudents.find(s => s.id === stuId);
      if (matchStu) {
        todayTotal++;
        if (item.status === 'hadir' || item.status === 'lewat' || item.status === 'urusan_rasmi') {
          todayPresent++;
        }
      }
    });
  });

  const todayPercentage = todayTotal > 0 ? Number(((todayPresent / todayTotal) * 100).toFixed(1)) : 0;
  const criticalRiskStudents = riskList.filter(r => r.riskTier === 'amaran3' || r.riskTier === 'amaran2');
  const openDisciplineCases = discipline.filter(d => d.statusKes !== 'selesai');
  const openCounselingCases = counseling.filter(c => c.status === 'aktif');
  const pendingMeetingTasks = meetings.flatMap(m =>
    m.tindakanSusulan
      .filter(fu => fu.status !== 'selesai')
      .map(fu => ({ ...fu, bil: m.bilangan, tajuk: m.tajuk }))
  );

  // Trend Data 14/30 days
  const trendData = uniqueDates.slice(-15).map(d => {
    const dayRecords = attendance.filter(a => a.tarikh === d);
    let hadir = 0;
    let total = 0;
    dayRecords.forEach(r => {
      hadir += r.jumlahHadir;
      total += r.jumlahMurid;
    });
    const peratus = total > 0 ? Number(((hadir / total) * 100).toFixed(1)) : 0;
    const parts = d.split('-');
    return {
      tarikh: `${parts[2]}/${parts[1]}`,
      peratus,
      sasaran: rules.sasaranKehadiranSekolah
    };
  });

  const safeTrendData =
    trendData.length > 0
      ? trendData
      : [
          { tarikh: 'Isnin', peratus: 0, sasaran: rules.sasaranKehadiranSekolah },
          { tarikh: 'Selasa', peratus: 0, sasaran: rules.sasaranKehadiranSekolah }
        ];

  // Attendance by Form (Tingkatan 1 - 5)
  const formStats = [1, 2, 3, 4, 5].map((t, idx) => {
    const tStudents = students.filter(s => s.tingkatan === t);
    const tAttendance = attendance.filter(a => a.tingkatan === t && a.tarikh === latestDate);
    let hadir = 0;
    let total = 0;
    tAttendance.forEach(a => {
      hadir += a.jumlahHadir;
      total += a.jumlahMurid;
    });
    const peratus = total > 0 ? Number(((hadir / total) * 100).toFixed(1)) : 0;
    return {
      tingkatan: `T${t}`,
      namaPenuh: `Tingkatan ${t}`,
      peratus,
      jumlah: tStudents.length,
      color: FORM_BAR_COLORS[idx]
    };
  });

  // Donut Chart Data
  const donutValue = todayTotal > 0 ? todayPercentage : 0;
  const donutData = [
    { name: 'Hadir', value: donutValue > 0 ? donutValue : 0.1 },
    { name: 'Tidak Hadir', value: Math.max(0, Number((100 - donutValue).toFixed(1))) }
  ];

  // Lowest attendance classes
  const classAvgMap = new Map<string, { totalHadir: number; totalMurid: number }>();
  const recentWeekDates = uniqueDates.slice(-5);
  attendance
    .filter(a => recentWeekDates.includes(a.tarikh))
    .forEach(a => {
      const current = classAvgMap.get(a.kelasId) || { totalHadir: 0, totalMurid: 0 };
      classAvgMap.set(a.kelasId, {
        totalHadir: current.totalHadir + a.jumlahHadir,
        totalMurid: current.totalMurid + a.jumlahMurid
      });
    });

  const lowestClasses = Array.from(classAvgMap.entries())
    .map(([kelasId, val]) => ({
      kelas: kelasId.replace('-', ' ').toUpperCase(),
      peratus: val.totalMurid > 0 ? Number(((val.totalHadir / val.totalMurid) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => a.peratus - b.peratus)
    .slice(0, 4);

  // Chart theme tokens
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#2e3959' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1c2337' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    borderRadius: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '12px'
  };

  const modulTeras = [
    {
      code: 'K',
      title: 'Kehadiran & Kelas',
      subtitle: `${todayPresent} / ${todayTotal || totalEnrolment} Rekod Hadir`,
      actionLabel: 'Rekod',
      badgeBg: 'bg-[#ffc107] text-slate-950',
      btnClass: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-[#fef3c7] dark:text-amber-900',
      to: '/kehadiran'
    },
    {
      code: 'D',
      title: 'Disiplin & Buli',
      subtitle: `${openDisciplineCases.length} Kes Aktif Dipantau`,
      actionLabel: 'Semak',
      badgeBg: 'bg-[#ff3e6c] text-white',
      btnClass: 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-[#ffe4e6] dark:text-rose-800',
      to: '/disiplin'
    },
    {
      code: 'B',
      title: 'Biasiswa & Bantuan',
      subtitle: `${totalAssistance} Murid Penerima`,
      actionLabel: 'Lihat',
      badgeBg: 'bg-[#34d399] text-slate-950',
      btnClass: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-[#d1fae5] dark:text-emerald-900',
      to: '/bantuan'
    },
    {
      code: 'A',
      title: 'Asrama & 3K',
      subtitle: `${totalHostel} Penghuni Asrama`,
      actionLabel: 'Urus',
      badgeBg: 'bg-[#0ea5e9] text-white',
      btnClass: 'bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-[#e0f2fe] dark:text-sky-900',
      to: '/asrama'
    }
  ];

  const availableClasses = Array.from(
    new Set([
      ...classesList
        .filter(c => filterTingkatan === 'semua' || c.tingkatan === Number(filterTingkatan))
        .map(c => c.nama),
      ...students
        .filter(s => filterTingkatan === 'semua' || s.tingkatan === Number(filterTingkatan))
        .map(s => s.kelas)
    ])
  ).sort();

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-[1440px] mx-auto pb-24 lg:pb-8">
      {/* BARIS 1: Hero Banner Mint-Teal + Panel Tindakan Pantas Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Hero Banner (8/9 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 rounded-2xl bg-gradient-to-r from-[#4bcbb1] via-[#3bc0a6] to-[#2eb197] text-white p-5 sm:p-7 relative overflow-hidden shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Dekorasi latar lembut */}
          <div className="absolute -right-12 -bottom-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-32 -top-12 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 space-y-4 flex-1 min-w-0">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight text-white leading-snug">
                Selamat Bertugas, {currentUser?.nama || 'Warga Pendidik'}!
              </h1>
              <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
                {school.nama} ({school.kodSekolah}) • Sesi {school.sesi} Tahun {school.tahunSemasa}. Sasaran kehadiran sekolah ditetapkan pada{' '}
                <strong className="font-extrabold text-white">{rules.sasaranKehadiranSekolah}%</strong>.
              </p>
            </div>

            {/* 2 Lencana Bulat Pink & Kuning seperti rekaan rujukan */}
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <button
                onClick={() => navigate('/murid')}
                className="flex items-center gap-3 group text-left"
              >
                <div className="w-11 h-11 rounded-full bg-[#ff3e6c] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-white/85 block">Enrolmen Murid</span>
                  <span className="text-base sm:text-lg font-extrabold text-white tabular-nums">
                    {totalEnrolment} Aktif
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/kehadiran')}
                className="flex items-center gap-3 group text-left"
              >
                <div className="w-11 h-11 rounded-full bg-[#ffc107] text-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-white/85 block">Kehadiran Terkini</span>
                  <span className="text-base sm:text-lg font-extrabold text-white tabular-nums">
                    {todayPercentage}% ({todayPresent})
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Ilustrasi Pelajar Kanan */}
          <div className="relative z-10 hidden sm:block shrink-0">
            <div className="w-48 md:w-56 lg:w-64 h-36 md:h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl bg-teal-900/20">
              <img
                src={
                  dashboardSettings?.gambarBannerUrl &&
                  !dashboardSettings.gambarBannerUrl.startsWith('/src/assets/images/')
                    ? dashboardSettings.gambarBannerUrl
                    : defaultBannerImg || '/banner.jpg'
                }
                alt="Kecemerlangan Murid SMK Salaping"
                onError={e => {
                  const target = e.currentTarget;
                  if (defaultBannerImg && target.src !== defaultBannerImg) {
                    target.src = defaultBannerImg;
                  } else if (!target.src.endsWith('/banner.jpg')) {
                    target.src = '/banner.jpg';
                  }
                }}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </div>

        {/* Panel Tindakan Kanan (3/4 cols) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col justify-between gap-3.5">
          <div className="text-center space-y-2.5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
              Urus Rekod Kehadiran Harian?
            </h2>
            <button
              onClick={() => navigate('/kehadiran')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Rekod Kehadiran Hari Ini</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {/* Kaunter 1: Risiko Cicir */}
            <button
              onClick={() => navigate('/risiko-cicir')}
              className="rounded-xl overflow-hidden bg-white dark:bg-[#222b42] border border-slate-200 dark:border-white/5 shadow-xs hover:border-[#0ea5e9] transition-colors flex flex-col text-center"
            >
              <div className="w-full bg-[#bae6fd] dark:bg-[#bfe3ff] text-[#0369a1] dark:text-[#0c4a6e] text-[11px] font-bold py-1.5 px-2 truncate">
                Risiko Cicir (1:3:7)
              </div>
              <div className="flex-1 flex items-center justify-center py-3 px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {criticalRiskStudents.length}
                </span>
              </div>
            </button>

            {/* Kaunter 2: Kes Disiplin */}
            <button
              onClick={() => navigate('/disiplin')}
              className="rounded-xl overflow-hidden bg-white dark:bg-[#222b42] border border-slate-200 dark:border-white/5 shadow-xs hover:border-[#0ea5e9] transition-colors flex flex-col text-center"
            >
              <div className="w-full bg-[#bae6fd] dark:bg-[#bfe3ff] text-[#0369a1] dark:text-[#0c4a6e] text-[11px] font-bold py-1.5 px-2 truncate">
                Kes Disiplin Aktif
              </div>
              <div className="flex-1 flex items-center justify-center py-3 px-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {openDisciplineCases.length}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding Banner bila pangkalan data murid kosong */}
      {totalEnrolment === 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-sky-400/50 bg-sky-50/70 dark:bg-[#222b42] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] text-white flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pangkalan Data Murid Bersih (Sedia untuk Data Sebenar)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                Mulakan kemasukan rekod murid sebenar SMK Salaping melalui pendaftaran senarai sekelas, muat naik Excel, atau penyegerakan dari idMe KPM / MOEIS.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/murid')}
              className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar / Import Murid</span>
            </button>
          </div>
        </div>
      )}

      {/* Bar Tapis & Pintasan Pantas */}
      <div className="bg-white dark:bg-[#222b42] px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#0ea5e9]" />
            <span>Tapis:</span>
          </div>
          <select
            value={filterTingkatan}
            onChange={e => {
              setFilterTingkatan(e.target.value);
              setFilterKelas('semua');
            }}
            className="border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-[#161e31] text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:border-[#0ea5e9]"
          >
            <option value="semua">Semua Tingkatan</option>
            <option value="1">Tingkatan 1</option>
            <option value="2">Tingkatan 2</option>
            <option value="3">Tingkatan 3</option>
            <option value="4">Tingkatan 4</option>
            <option value="5">Tingkatan 5</option>
          </select>

          <select
            value={filterKelas}
            onChange={e => setFilterKelas(e.target.value)}
            className="border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 bg-slate-50 dark:bg-[#161e31] text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:border-[#0ea5e9]"
          >
            <option value="semua">Semua Kelas</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          {(filterTingkatan !== 'semua' || filterKelas !== 'semua') && (
            <button
              onClick={() => {
                setFilterTingkatan('semua');
                setFilterKelas('semua');
              }}
              className="text-[#0ea5e9] hover:underline font-semibold"
            >
              Set Semula
            </button>
          )}
        </div>

        {/* Pautan pantas ke modul tambahan (3K, Pengawas, Takwim) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/3k')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161e31] hover:bg-slate-200 dark:hover:bg-[#2a3654] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Kesihatan &amp; 3K
          </button>
          <button
            onClick={() => navigate('/pengawas')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161e31] hover:bg-slate-200 dark:hover:bg-[#2a3654] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Badan Pengawas
          </button>
          <button
            onClick={() => navigate('/program-mesyuarat')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#161e31] hover:bg-slate-200 dark:hover:bg-[#2a3654] text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            Takwim &amp; Mesyuarat
          </button>
        </div>
      </div>

      {/* BARIS 2: 3 Kolum Utama (Modul Teras | Aktiviti Semasa + 2 Kad Warna | Intervensi Murid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolum Kiri: Modul Teras HEM (4 kad padat seperti Popular Courses) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Modul Teras HEM</h2>
            <button
              onClick={() => navigate('/murid')}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#0ea5e9]"
            >
              Semua Modul
            </button>
          </div>

          <div className="space-y-3">
            {modulTeras.map(mod => (
              <div
                key={mod.code}
                onClick={() => navigate(mod.to)}
                className="bg-white dark:bg-[#222b42] rounded-2xl p-3.5 border border-slate-200 dark:border-white/5 hover:border-[#0ea5e9]/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${mod.badgeBg}`}
                  >
                    {mod.code}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{mod.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${mod.btnClass}`}>
                    {mod.actionLabel}
                  </span>
                  <MoreVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolum Tengah: Aktiviti Semasa (Carta Area + Kad Kuning & Pink) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Aktiviti Semasa</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">30 Hari Terkini</span>
          </div>

          <div className="bg-white dark:bg-[#222b42] rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trend Kehadiran</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Prestasi harian berbanding sasaran {rules.sasaranKehadiranSekolah}%
                </p>
              </div>
              <button
                onClick={() => navigate('/kehadiran')}
                className="w-9 h-9 rounded-full bg-sky-50 dark:bg-white text-[#0ea5e9] flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-xs"
                title="Buka Rekod Kehadiran"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>

            <div className="h-36 w-full mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeTrendData} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hemAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="tarikh" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Kehadiran']} contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="peratus"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hemAreaFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2 Kad KPI Warna Cerah (Kuning & Merah Jambu seperti rujukan) */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => navigate('/kaunseling')}
              className="rounded-2xl bg-[#ffc107] hover:bg-[#f5b800] text-slate-950 p-4 text-left flex flex-col justify-between min-h-[116px] transition-transform hover:-translate-y-0.5 shadow-sm"
            >
              <div>
                <div className="text-2xl font-extrabold tabular-nums leading-tight">
                  {openCounselingCases.length} Sesi
                </div>
                <div className="text-xs font-bold text-slate-900/85 mt-0.5">Kaunseling Aktif</div>
              </div>
              <div className="flex items-end justify-between gap-2 mt-3">
                <span className="text-[11px] font-semibold text-slate-900/75 leading-tight">
                  Bimbingan Berfokus
                </span>
                <span className="w-8 h-8 rounded-full bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate('/program-mesyuarat')}
              className="rounded-2xl bg-[#ff3e6c] hover:bg-[#f02f5e] text-white p-4 text-left flex flex-col justify-between min-h-[116px] transition-transform hover:-translate-y-0.5 shadow-sm"
            >
              <div>
                <div className="text-2xl font-extrabold tabular-nums leading-tight">
                  {pendingMeetingTasks.length} Tugasan
                </div>
                <div className="text-xs font-bold text-white/90 mt-0.5">Amanah Mesyuarat</div>
              </div>
              <div className="flex items-end justify-between gap-2 mt-3">
                <span className="text-[11px] font-medium text-white/80 leading-tight">
                  Susulan Jawatankuasa
                </span>
                <span className="w-8 h-8 rounded-full bg-white text-[#ff3e6c] flex items-center justify-center shrink-0 shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Kolum Kanan: Intervensi Murid / Tindakan Segera (4 kad seperti Best Instructors) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Intervensi Segera</h2>
            <button
              onClick={() => navigate('/risiko-cicir')}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#0ea5e9]"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3">
            {criticalRiskStudents.length > 0 ? (
              criticalRiskStudents.slice(0, 4).map(risk => {
                const isCritical = risk.riskTier === 'amaran3';
                return (
                  <div
                    key={risk.student.id}
                    onClick={() => navigate('/risiko-cicir')}
                    className="bg-white dark:bg-[#222b42] rounded-2xl p-3.5 border border-slate-200 dark:border-white/5 hover:border-[#0ea5e9]/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                        }`}
                      >
                        {risk.student.nama.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {risk.student.nama}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                          {risk.student.kelas} • {risk.consecutiveAbsences}H Tidak Hadir
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#13192b] hover:bg-[#0ea5e9] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shrink-0">
                      Tindakan
                    </span>
                  </div>
                );
              })
            ) : pendingMeetingTasks.length > 0 ? (
              pendingMeetingTasks.slice(0, 4).map(task => (
                <div
                  key={task.id}
                  onClick={() => navigate('/program-mesyuarat')}
                  className="bg-white dark:bg-[#222b42] rounded-2xl p-3.5 border border-slate-200 dark:border-white/5 hover:border-[#0ea5e9]/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center font-extrabold text-xs shrink-0">
                      {task.namaTindakanOleh.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.perkara}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {task.namaTindakanOleh} • {task.tarikhAkhir}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#13192b] text-slate-700 dark:text-slate-200 text-xs font-semibold shrink-0">
                    Semak
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#222b42] rounded-2xl p-6 border border-slate-200 dark:border-white/5 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Tiada Kes Cicir Kritikal</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semua murid berada di bawah ambang amaran ketidakhadiran semasa.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BARIS 3: 3 Kad Analitik & Carta Bawah */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Carta 1: Prestasi Kehadiran Tingkatan 1-5 (Multi-Color BarChart) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#222b42] rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Prestasi Kehadiran Tingkatan
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Terkini</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {formStats.map(f => (
                <div key={f.tingkatan} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: f.color }} />
                  <span>{f.namaPenuh}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formStats} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="tingkatan" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Kehadiran']}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)' }}
                />
                <Bar dataKey="peratus" radius={[6, 6, 0, 0]} maxBarSize={34}>
                  {formStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carta 2: Peratus Kehadiran Keseluruhan (Donut PieChart) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#222b42] rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Peratus Kehadiran Keseluruhan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sasaran KPM: {rules.sasaranKehadiranSekolah}%
            </p>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#7c3aed" />
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Peratus']} contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {todayPercentage}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Hadir</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="text-slate-500 dark:text-slate-400">Jumlah Rekod:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {todayPresent} / {todayTotal} murid
            </span>
          </div>
        </div>

        {/* Carta 3: Pemantauan Kelas & Enrolmen (Dotted LineChart + Kelas Perhatian) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#222b42] rounded-2xl p-5 border border-slate-200 dark:border-white/5 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pemantauan Kelas</h3>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-8 h-8 rounded-lg bg-[#ffc107] text-slate-950 flex items-center justify-center shadow-xs hover:bg-[#f5b800] transition-colors"
                title="Kembali ke atas"
                aria-label="Kembali ke atas"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-semibold text-[#0ea5e9] mt-1 tabular-nums">
              Enrolmen: {totalLelaki} Lelaki • {totalPerempuan} Perempuan
            </p>
          </div>

          <div className="h-28 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeTrendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Kehadiran']} contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="peratus"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#ffffff', stroke: '#0ea5e9', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span>Kelas Perlu Perhatian</span>
              <span>Kehadiran</span>
            </div>
            {lowestClasses.length > 0 ? (
              lowestClasses.slice(0, 3).map(cls => (
                <div key={cls.kelas} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{cls.kelas}</span>
                  <span
                    className={`font-bold tabular-nums ${
                      cls.peratus < rules.sasaranKehadiranSekolah ? 'text-[#ff3e6c]' : 'text-[#34d399]'
                    }`}
                  >
                    {cls.peratus}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada rekod kehadiran mingguan direkodkan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
