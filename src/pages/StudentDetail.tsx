import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  Student,
  DailyClassAttendance,
  DisciplineCase,
  CounselingSession,
  AssistanceRecord,
  FollowUpAction
} from '../types';
import {
  getStudentById,
  getAttendanceList,
  getDisciplineCases,
  getCounselingSessions,
  getAssistanceRecords,
  getFollowUps,
  saveStudent,
  archiveStudent,
  saveDisciplineCase,
  saveCounselingSession,
  addAuditLog
} from '../services/dataService';
import { evaluateStudentDropoutRisk } from '../services/dropoutEngine';
import {
  User,
  ArrowLeft,
  CalendarCheck,
  ShieldAlert,
  HeartHandshake,
  Award,
  Home,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
  Car,
  AlertTriangle,
  Edit,
  Archive,
  CheckCircle2,
  Lock,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  FileText
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isPengetuaOrGpkHem, canViewCounseling, canManageDiscipline } = useAuth();
  const { school, rules, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<DailyClassAttendance[]>([]);
  const [disciplineCases, setDisciplineCases] = useState<DisciplineCase[]>([]);
  const [counselingSessions, setCounselingSessions] = useState<CounselingSession[]>([]);
  const [assistanceRecords, setAssistanceRecords] = useState<AssistanceRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpAction[]>([]);

  const [activeTab, setActiveTab] = useState<
    'peribadi' | 'kehadiran' | 'disiplin' | 'kaunseling' | 'bantuan' | 'asrama' | 'timeline'
  >('peribadi');

  const [showFullIC, setShowFullIC] = useState(false);

  // New discipline record modal state
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);
  const [dispKat, setDispKat] = useState('Ponteng Sekolah / Kelas');
  const [dispTahap, setDispTahap] = useState<'ringan' | 'sederhana' | 'berat'>('ringan');
  const [dispPerincian, setDispPerincian] = useState('');
  const [dispTindakan, setDispTindakan] = useState('Nasihat & Amaran Lisan');

  // New counseling session modal state
  const [showAddCounseling, setShowAddCounseling] = useState(false);
  const [counJenis, setCounJenis] = useState<CounselingSession['jenisSesi']>('individu');
  const [counIsu, setCounIsu] = useState('');
  const [counCatatan, setCounCatatan] = useState('');
  const [counSusulan, setCounSusulan] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [st, atList, dpList, csList, asList, fuList] = await Promise.all([
          getStudentById(id),
          getAttendanceList(),
          getDisciplineCases(),
          getCounselingSessions(),
          getAssistanceRecords(),
          getFollowUps()
        ]);

        setStudent(st);
        setAttendance(atList);
        setDisciplineCases(dpList.filter(d => d.studentId === id));
        setCounselingSessions(csList.filter(c => c.studentId === id));
        setAssistanceRecords(asList.filter(a => a.studentId === id));
        setFollowUps(fuList.filter(f => f.studentId === id));
      } catch (err) {
        console.error('Ralat memuatkan data murid:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-10 bg-slate-200 rounded animate-pulse w-1/4"></div>
        <div className="h-40 bg-white rounded-xl border border-slate-200 p-6 animate-pulse"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/murid')}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Senarai Murid</span>
        </button>
        <EmptyState
          title="Murid Tidak Dijumpai"
          description="Maklumat murid dengan ID ini tidak wujud dalam pangkalan data."
        />
      </div>
    );
  }

  const primaryGuardian = student.penjaga[0] || { nama: 'Penjaga', noTel: '', pekerjaan: '' };
  const riskAssessment = evaluateStudentDropoutRisk(student, attendance, rules);

  // Masked IC
  const formatIC = (ic: string) => {
    if (showFullIC) return ic;
    const parts = ic.split('-');
    if (parts.length === 3) return `${parts[0]}-${parts[1]}-****`;
    return ic.slice(0, 8) + '****';
  };

  // Student Attendance Records list
  const studentDailyAttendance = attendance
    .filter(a => a.rekod && a.rekod[student.id])
    .map(a => ({
      tarikh: a.tarikh,
      ...a.rekod[student.id]
    }))
    .sort((a, b) => b.tarikh.localeCompare(a.tarikh));

  // Add Discipline Case
  const handleSaveDiscipline = async () => {
    if (!dispPerincian) {
      showToast('Sila isikan perincian kes salah laku.', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const newCase: DisciplineCase = {
      id: `disp_${Date.now()}`,
      noRujukan: `DISP/SMKS/${2026}/${String(Math.floor(Math.random() * 800) + 100)}`,
      studentId: student.id,
      tarikhKejadian: today,
      jenisSalahLaku: 'disiplin',
      kategori: dispKat,
      perincianKes: dispPerincian,
      lokasi: 'Kawasan Sekolah',
      tahap: dispTahap,
      tindakanDiambil: dispTindakan,
      statusAliran: 'selesai',
      statusKes: 'selesai',
      dilaporOleh: currentUser?.nama || 'Guru',
      guruDisiplinUid: currentUser?.uid || 'guru',
      langkahWajib: {
        pertuduhanLengkap: true,
        belaDiriLengkap: true,
        kaunselingLengkap: true
      },
      tarikhKemaskiniTerakhir: today,
      dicipta: new Date().toISOString()
    };

    const operator = currentUser || { uid: 'system', nama: 'Guru' };
    await saveDisciplineCase(newCase, { uid: operator.uid, nama: operator.nama }, true);
    setDisciplineCases(prev => [newCase, ...prev]);
    setShowAddDiscipline(false);
    setDispPerincian('');
    showToast('Kes disiplin berjaya direkodkan.', 'success');
  };

  // Add Counseling Session
  const handleToggleShowFullIC = async () => {
    if (!showFullIC) {
      if (currentUser && student) {
        await addAuditLog(
          { uid: currentUser.uid, nama: currentUser.nama },
          'akses_sulit',
          'students',
          student.id,
          `Melihat No. KP penuh murid: ${student.nama} (${student.noMurid})`
        );
      }
      setShowFullIC(true);
      showToast('No. KP penuh dipaparkan. Tindakan telah direkodkan dalam Log Audit.', 'info');
    } else {
      setShowFullIC(false);
    }
  };

  const handleSaveCounseling = async () => {
    if (!counIsu || !counCatatan) {
      showToast('Sila isikan isu utama dan catatan sesi.', 'error');
      return;
    }
    const newSession: CounselingSession = {
      id: `coun_${Date.now()}`,
      studentId: student.id,
      tarikh: new Date().toISOString().split('T')[0],
      jenisSesi: counJenis,
      isuUtama: counIsu,
      catatanSesi: counCatatan,
      tindakanSusulan: counSusulan || 'Pemantauan berkala',
      gbkUid: currentUser?.uid || 'gbk',
      namaGbk: currentUser?.nama || 'Guru Kaunseling',
      status: 'aktif',
      dicipta: new Date().toISOString()
    };

    const operator = currentUser || { uid: 'system', nama: 'GBK' };
    await saveCounselingSession(newSession, { uid: operator.uid, nama: operator.nama }, true);
    setCounselingSessions(prev => [newSession, ...prev]);
    setShowAddCounseling(false);
    setCounIsu('');
    setCounCatatan('');
    setCounSusulan('');
    showToast('Sesi bimbingan kaunseling berjaya direkodkan.', 'success');
  };

  // Combine events for Timeline tab
  const timelineEvents = [
    {
      tarikh: student.dicipta.slice(0, 10),
      tajuk: 'Pendaftaran Murid ke SMK Salaping',
      kategori: 'Pendaftaran',
      deskripsi: `Didaftarkan ke Tingkatan ${student.tingkatan} (${student.kelas}) bagi tahun ${student.tahunMasuk}.`
    },
    ...disciplineCases.map(d => ({
      tarikh: d.tarikhKejadian,
      tajuk: `Kes Disiplin: ${d.kategori} (${d.tahap.toUpperCase()})`,
      kategori: 'Disiplin',
      deskripsi: `${d.tindakanDiambil}. No Ruj: ${d.noRujukan}`
    })),
    ...counselingSessions.map(c => ({
      tarikh: c.tarikh,
      tajuk: `Sesi Bimbingan & Kaunseling (${c.jenisSesi})`,
      kategori: 'Kaunseling',
      deskripsi: `Isu: ${c.isuUtama} - Dikendalikan oleh ${c.namaGbk}`
    })),
    ...assistanceRecords.map(a => ({
      tarikh: a.tarikhTerima || '2026-01-20',
      tajuk: `Bantuan Kebajikan: ${a.jenisBantuan} (RM ${a.jumlahBantuan})`,
      kategori: 'Bantuan',
      deskripsi: a.catatan || 'Bantuan KPM diagihkan'
    })),
    ...followUps.map(f => ({
      tarikh: f.tarikh,
      tajuk: `Tindakan Susulan: ${f.jenis.replace('_', ' ').toUpperCase()}`,
      kategori: 'Susulan HEM',
      deskripsi: `${f.hasil} (${f.namaPegawai})`
    }))
  ].sort((a, b) => b.tarikh.localeCompare(a.tarikh));

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-6xl mx-auto pb-24 lg:pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/murid')}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Senarai Murid</span>
      </button>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {student.nama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {student.nama}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs">
                  {student.kelas}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    student.status === 'aktif'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {student.status.toUpperCase()}
                </span>
                {riskAssessment.riskTier !== 'selamat' && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[11px] border border-red-300">
                    {riskAssessment.riskLabel}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>No. Murid: <strong className="text-slate-800">{student.noMurid}</strong></span>
                <span>
                  No. KP: <strong className="text-slate-800 font-mono">{formatIC(student.noKP)}</strong>
                  <button
                    onClick={handleToggleShowFullIC}
                    className="ml-1.5 text-blue-700 hover:underline font-semibold"
                  >
                    {showFullIC ? 'Topeng' : 'Papar'}
                  </button>
                </span>
                <span>Etnik: <strong className="text-slate-800">{student.etnik}</strong></span>
                <span>Kampung: <strong className="text-slate-800">{student.kampung}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Contact Penjaga */}
          {primaryGuardian.noTel && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <a
                href={`tel:${primaryGuardian.noTel}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hubungi Penjaga</span>
              </a>
              <a
                href={`https://wa.me/60${primaryGuardian.noTel.replace(/[^0-9]/g, '').slice(1)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-200 overflow-x-auto text-xs">
          {[
            { id: 'peribadi', label: 'Maklumat Peribadi', icon: User },
            { id: 'kehadiran', label: 'Kehadiran & Cicir', icon: CalendarCheck },
            { id: 'disiplin', label: `Disiplin (${disciplineCases.length})`, icon: ShieldAlert },
            { id: 'kaunseling', label: `Kaunseling (${counselingSessions.length})`, icon: HeartHandshake, lock: !canViewCounseling },
            { id: 'bantuan', label: `Bantuan (${assistanceRecords.length})`, icon: Award },
            { id: 'asrama', label: 'Asrama', icon: Home },
            { id: 'timeline', label: 'Garis Masa', icon: Clock }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.lock) {
                    showToast('Modul kaunseling adalah sulit mengikut etika kaunselor GBK.', 'error');
                    return;
                  }
                  setActiveTab(t.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-700 text-blue-700 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.lock && <Lock className="w-3 h-3 text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: MAKLUMAT PERIBADI ================= */}
      {activeTab === 'peribadi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kad 1: Maklumat Demografi & Lokasi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Demografi & Tempat Tinggal
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 font-medium">Jantina</span>
                <p className="font-bold text-slate-900 capitalize">{student.jantina}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tarikh Lahir</span>
                <p className="font-bold text-slate-900">{student.tarikhLahir}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Etnik / Bangsa</span>
                <p className="font-bold text-slate-900">{student.etnik}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Agama</span>
                <p className="font-bold text-slate-900">{student.agama}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Kampung Asal</span>
                <p className="font-bold text-slate-900">{student.kampung}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Jarak ke SMK Salaping</span>
                <p className="font-bold text-slate-900">{student.jarakKm} Kilometer</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Cara ke Sekolah</span>
                <p className="font-bold text-slate-900 capitalize">{student.caraKeSekolah.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Kategori Pendapatan</span>
                <p className="font-bold text-blue-800">{student.kategoriPendapatan}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Alamat Penuh Surat-menyurat:</span>
              <p className="font-medium text-slate-800 mt-0.5">{student.alamat}</p>
            </div>

            {student.catatanKesihatan && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Catatan Kesihatan & Alahan:</span>
                <p className="font-semibold text-rose-700 mt-0.5">{student.catatanKesihatan}</p>
              </div>
            )}
          </div>

          {/* Kad 2: Maklumat Penjaga & Waris */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Maklumat Ibu Bapa / Penjaga
            </h3>

            {student.penjaga.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{p.nama}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold uppercase text-[10px]">
                    {p.hubungan}
                  </span>
                </div>
                <p className="text-slate-600">
                  No. Telefon: <strong className="text-slate-900">{p.noTel}</strong>
                </p>
                <p className="text-slate-500">Pekerjaan: {p.pekerjaan || 'Bekerja sendiri / Petani'}</p>
              </div>
            ))}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
              <span className="font-bold">Status Kebajikan & Keperluan Khas:</span>
              <p>• Penghuni Asrama Desa: <strong>{student.penghuniAsrama ? 'Ya' : 'Tidak'}</strong></p>
              <p>• Status Murid OKU: <strong>{student.oku.status ? `Ya (${student.oku.jenis})` : 'Tidak'}</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: KEHADIRAN & CICIR ================= */}
      {activeTab === 'kehadiran' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Peratus Kehadiran 30 Hari</span>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {riskAssessment.attendancePercentage}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sasaran Sekolah: {rules.sasaranKehadiranSekolah}%
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Hari Tidak Hadir Berturut-turut</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {riskAssessment.consecutiveAbsences} Hari
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Status: {riskAssessment.riskLabel}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-semibold">Tindakan HEM Dicadangkan</span>
              <div className="text-xs font-bold text-amber-900 mt-2">
                {riskAssessment.cadanganTindakan}
              </div>
            </div>
          </div>

          {/* Jadual Rekod Kehadiran Terperinci */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Sejarah Kehadiran Murid (30 Hari Lepas)
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {studentDailyAttendance.map((rec) => (
                <div key={rec.tarikh} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">{rec.tarikh}</span>
                    {rec.sebab && (
                      <span className="text-slate-500 italic">[{rec.sebab}]</span>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                        rec.status === 'hadir'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'tidak_hadir'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DISIPLIN ================= */}
      {activeTab === 'disiplin' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Rekod Salah Laku & Kes Disiplin ({disciplineCases.length})
            </h3>
            {canManageDiscipline && (
              <button
                onClick={() => setShowAddDiscipline(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Rekod Kes Baharu</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {disciplineCases.map((d) => (
              <div key={d.id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-rose-900">{d.kategori}</span>
                  <span className="px-2 py-0.5 rounded font-extrabold bg-rose-100 text-rose-800 uppercase text-[10px]">
                    Tahap: {d.tahap}
                  </span>
                </div>
                <p className="text-slate-700">{d.perincianKes}</p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between">
                  <span>Tindakan Diambil: <strong>{d.tindakanDiambil}</strong></span>
                  <span>Tarikh: <strong>{d.tarikhKejadian}</strong> • Ruj: {d.noRujukan}</span>
                </div>
              </div>
            ))}

            {disciplineCases.length === 0 && (
              <EmptyState
                title="Tiada Rekod Salah Laku Disiplin"
                description="Murid ini mempunyai rekod sahsiah yang baik dan bersih daripada salah laku disiplin."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: KAUNSELING (SULIT) ================= */}
      {activeTab === 'kaunseling' && canViewCounseling && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>KERAHSIAAN ETIKA KAUNSELING:</strong> Catatan dalam modul ini dilindungi di bawah Akta Kaunselor dan hanya boleh diakses oleh Guru Bimbingan & Kaunseling (GBK), Pengetua, dan GPK Hal Ehwal Murid SMK Salaping.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">
              Sesi Bimbingan & Kaunseling Berfokus ({counselingSessions.length})
            </h3>
            <button
              onClick={() => setShowAddCounseling(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buka Sesi Kaunseling</span>
            </button>
          </div>

          <div className="space-y-3">
            {counselingSessions.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-950 text-sm">
                    Sesi {c.jenisSesi.toUpperCase()}: {c.isuUtama}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {c.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{c.catatanSesi}</p>
                <div className="p-2.5 bg-purple-50/50 rounded-lg text-purple-900">
                  <span className="font-bold">Tindakan Susulan / Intervensi: </span>
                  {c.tindakanSusulan}
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
                  <span>Kaunselor: <strong>{c.namaGbk}</strong></span>
                  <span>Tarikh Sesi: <strong>{c.tarikh}</strong></span>
                </div>
              </div>
            ))}

            {counselingSessions.length === 0 && (
              <EmptyState
                title="Tiada Sesi Kaunseling"
                description="Belum ada sesi kaunseling dibuka untuk murid ini."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 5: BANTUAN & BIASISWA ================= */}
      {activeTab === 'bantuan' && (
        <div className="space-y-3 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900">
            Rekod Bantuan Kewangan & Biasiswa ({assistanceRecords.length})
          </h3>

          <div className="space-y-2.5">
            {assistanceRecords.map(a => (
              <div key={a.id} className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-teal-900">{a.jenisBantuan}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                      Tahun {a.tahun}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">{a.catatan}</p>
                  {a.tarikhTerima && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Tarikh Terima: {a.tarikhTerima}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-teal-800">RM {a.jumlahBantuan}</span>
                  <span className="block text-[10px] text-emerald-700 font-bold uppercase">
                    {a.statusAgihan.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}

            {assistanceRecords.length === 0 && (
              <EmptyState
                title="Tiada Rekod Bantuan"
                description="Tiada maklumat agihan biasiswa atau bantuan khas bagi murid ini."
              />
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: ASRAMA DESA ================= */}
      {activeTab === 'asrama' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900">Status Asrama Desa SMK Salaping</h3>
          {student.penghuniAsrama ? (
            <div className="space-y-3">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                <span className="font-bold text-indigo-900 text-sm">Penghuni Aktif Asrama Desa</span>
                <p className="text-indigo-800">Kamar / Dorm: <strong>{student.kamarAsrama || 'Kamar Kinabalu 2'}</strong></p>
                <p className="text-indigo-800">Warden Bertugas: <strong>Cikgu Jerry Mojuntin</strong></p>
              </div>
              <p className="text-slate-600">
                Murid tinggal di asrama kerana jarak perjalanan dari {student.kampung} adalah sejauh {student.jarakKm} km.
              </p>
            </div>
          ) : (
            <EmptyState
              title="Bukan Penghuni Asrama"
              description="Murid ini merupakan murid harian (ulang-alik dari rumah setiap hari)."
            />
          )}
        </div>
      )}

      {/* ================= TAB 7: TIMELINE ================= */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900">Garis Masa Perjalanan Murid (Timeline)</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((ev, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.tajuk}</span>
                    <span className="font-mono text-[11px] text-slate-500 font-bold">{ev.tarikh}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{ev.deskripsi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Rekod Disiplin */}
      {showAddDiscipline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Rekod Kes Salah Laku Disiplin</h3>
            <p className="text-slate-500 mb-3">Murid: {student.nama} ({student.kelas})</p>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Kategori Kesalahan</label>
                <select
                  value={dispKat}
                  onChange={e => setDispKat(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {rules.kategoriKesalahan.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Tahap Kesalahan</label>
                <select
                  value={dispTahap}
                  onChange={e => setDispTahap(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="ringan">Ringan (Nasihat / Amaran)</option>
                  <option value="sederhana">Sederhana (Hubungi Penjaga)</option>
                  <option value="berat">Berat (Jawatankuasa Disiplin / Gantung)</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Perincian Kesalahan</label>
                <textarea
                  rows={3}
                  value={dispPerincian}
                  onChange={e => setDispPerincian(e.target.value)}
                  placeholder="Keterangan kejadian dan saksi..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Tindakan Diambil</label>
                <select
                  value={dispTindakan}
                  onChange={e => setDispTindakan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  {rules.jenisTindakanDisiplin.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddDiscipline(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDiscipline}
                className="px-5 py-2 font-bold bg-rose-700 text-white rounded-lg shadow-xs hover:bg-rose-800"
              >
                Simpan Kes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buka Sesi Kaunseling */}
      {showAddCounseling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Buka Sesi Bimbingan & Kaunseling</h3>
            <p className="text-slate-500 mb-3">Murid: {student.nama} ({student.kelas})</p>

            <div className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Jenis Sesi</label>
                <select
                  value={counJenis}
                  onChange={e => setCounJenis(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="individu">Sesi Individu</option>
                  <option value="kelompok">Sesi Kelompok</option>
                  <option value="kerjaya">Bimbingan Kerjaya</option>
                  <option value="psikososial">Bimbingan Psikososial & Emosi</option>
                  <option value="disiplin">Intervensi Rujukan Disiplin</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Isu Utama</label>
                <input
                  type="text"
                  value={counIsu}
                  onChange={e => setCounIsu(e.target.value)}
                  placeholder="Contoh: Masalah ponteng tegar / Masalah keluarga"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Catatan Sesi Kaunselor (Sulit)</label>
                <textarea
                  rows={4}
                  value={counCatatan}
                  onChange={e => setCounCatatan(e.target.value)}
                  placeholder="Catatan profesional sesi..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Pelan Tindakan Susulan</label>
                <input
                  type="text"
                  value={counSusulan}
                  onChange={e => setCounSusulan(e.target.value)}
                  placeholder="Contoh: Perjumpaan susulan minggu depan"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddCounseling(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCounseling}
                className="px-5 py-2 font-bold bg-purple-700 text-white rounded-lg shadow-xs hover:bg-purple-800"
              >
                Simpan Sesi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
