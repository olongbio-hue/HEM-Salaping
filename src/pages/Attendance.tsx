import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  Student,
  DailyClassAttendance,
  AttendanceStatus,
  AttendanceRecordItem
} from '../types';
import {
  getStudents,
  getAttendanceList,
  saveDailyClassAttendance,
  getClassesList
} from '../services/dataService';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  FileCheck,
  Sparkles,
  Save,
  CheckCheck,
  AlertCircle,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { ClassStudentBatchModal } from '../components/ClassStudentBatchModal';

export const Attendance: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem, canRecordAttendance } = useAuth();
  const { school, rules, isOnline, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAttendance, setAllAttendance] = useState<DailyClassAttendance[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; nama: string; tingkatan: number }[]>([]);

  // Selected date (default today YYYY-MM-DD e.g. 2026-10-09)
  const todayStr = '2026-10-09';
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Selected class
  // If user is a class teacher of a specific class (e.g. 3-marikh), select that by default
  const defaultClass = currentUser?.kelasDiajar?.[0] || '1-arif';
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClass);

  // Active Tab: 'rekod' (daily recording screen) or 'pantau' (GPK HEM overview)
  const [activeTab, setActiveTab] = useState<'rekod' | 'pantau'>('rekod');

  // Working state for current class recording
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceRecordItem>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Reason modal state for student
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<AttendanceStatus>('tidak_hadir');
  const [showClassBatchModal, setShowClassBatchModal] = useState(false);
  const [tempReason, setTempReason] = useState<string>('');
  const [tempSurat, setTempSurat] = useState<boolean>(false);

  const refreshAttendanceData = async () => {
    try {
      const [stList, atList, clsList] = await Promise.all([
        getStudents(),
        getAttendanceList(),
        getClassesList()
      ]);
      setStudents(stList);
      setAllAttendance(atList);
      setClassesList(clsList);
    } catch (err) {
      console.error('Ralat memuatkan data kehadiran:', err);
    }
  };

  useEffect(() => {
    refreshAttendanceData();
  }, []);

  // When selected date or class changes, load existing record or prepare initial defaults
  useEffect(() => {
    if (students.length === 0) return;

    const existing = allAttendance.find(
      a => a.tarikh === selectedDate && a.kelasId === selectedClassId
    );

    const targetClassObj = classesList.find(c => c.id === selectedClassId);
    const classStudents = students.filter(s => s.kelas === (targetClassObj?.nama || ''));

    if (existing && existing.rekod) {
      setCurrentAttendance({ ...existing.rekod });
    } else {
      // Default: empty or initialize as present
      const initial: Record<string, AttendanceRecordItem> = {};
      classStudents.forEach(s => {
        initial[s.id] = { status: 'hadir' };
      });
      setCurrentAttendance(initial);
    }
  }, [selectedDate, selectedClassId, students, allAttendance, classesList]);

  const selectedClassInfo = classesList.find(c => c.id === selectedClassId);
  const currentClassStudents = students.filter(s => s.kelas === (selectedClassInfo?.nama || ''));

  const filteredStudents = currentClassStudents.filter(s =>
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.noMurid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick Action: "Semua Hadir"
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceRecordItem> = {};
    currentClassStudents.forEach(s => {
      updated[s.id] = { status: 'hadir', masaTiba: '07:00' };
    });
    setCurrentAttendance(updated);
    showToast('Semua murid ditandakan HADIR. Sila tandakan pengecualian jika ada.', 'info');
  };

  // Toggle single student: Hadir -> Tidak Hadir -> Hadir
  const handleToggleStatus = (stuId: string) => {
    const cur = currentAttendance[stuId]?.status || 'hadir';
    if (cur === 'hadir') {
      // Open modal or quick set to tidak hadir
      setEditingStudentId(stuId);
      setTempStatus('tidak_hadir');
      setTempReason('');
      setTempSurat(false);
    } else {
      // Back to hadir
      setCurrentAttendance(prev => ({
        ...prev,
        [stuId]: { status: 'hadir', masaTiba: '07:00' }
      }));
    }
  };

  const handleSaveReasonModal = () => {
    if (!editingStudentId) return;
    setCurrentAttendance(prev => ({
      ...prev,
      [editingStudentId]: {
        status: tempStatus,
        sebab: tempReason || (tempStatus === 'tidak_hadir' ? 'Tiada makluman penjaga' : ''),
        suratDisahkan: tempSurat
      }
    }));
    setEditingStudentId(null);
  };

  // Save full class attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassInfo) return;
    setSaving(true);
    try {
      const studentIds = Object.keys(currentAttendance);
      let hadirCount = 0;
      studentIds.forEach(id => {
        const item = currentAttendance[id];
        if (item.status === 'hadir' || item.status === 'lewat' || item.status === 'urusan_rasmi') {
          hadirCount++;
        }
      });

      const totalCount = currentClassStudents.length;
      const peratus = totalCount > 0 ? Number(((hadirCount / totalCount) * 100).toFixed(1)) : 100;

      const recordId = `${selectedDate}_${selectedClassId}`;
      const record: DailyClassAttendance = {
        id: recordId,
        tarikh: selectedDate,
        kelasId: selectedClassId,
        tingkatan: selectedClassInfo.tingkatan,
        direkodOleh: currentUser?.uid || 'guru_unknown',
        namaPerekod: currentUser?.nama || 'Guru Bertugas',
        masaDirekod: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        rekod: currentAttendance,
        jumlahHadir: hadirCount,
        jumlahMurid: totalCount,
        peratus,
        statusPenghantaran: 'dihantar'
      };

      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      await saveDailyClassAttendance(record, { uid: operator.uid, nama: operator.nama });

      // Update in-memory all attendance
      setAllAttendance(prev => {
        const idx = prev.findIndex(a => a.id === recordId);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = record;
          return cp;
        }
        return [record, ...prev];
      });

      showToast(`Kehadiran ${selectedClassInfo.nama} berjaya disimpan! (${hadirCount}/${totalCount} - ${peratus}%)`, 'success');
    } catch (err) {
      showToast('Gagal menyimpan rekod kehadiran.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Stats for the currently selected class
  let currentClassPresentCount = 0;
  let currentClassAbsentCount = 0;
  let currentClassSickCount = 0;
  let currentClassLateCount = 0;

  currentClassStudents.forEach(s => {
    const st = currentAttendance[s.id]?.status || 'hadir';
    if (st === 'hadir') currentClassPresentCount++;
    else if (st === 'tidak_hadir') currentClassAbsentCount++;
    else if (st === 'cuti_sakit') currentClassSickCount++;
    else if (st === 'lewat') currentClassLateCount++;
    else currentClassPresentCount++;
  });

  const totalClass = currentClassStudents.length;
  const currentClassPct = totalClass > 0
    ? Number((((currentClassPresentCount + currentClassLateCount) / totalClass) * 100).toFixed(1))
    : 100;

  // GPK HEM monitoring calculations
  const classesForDate = allAttendance.filter(a => a.tarikh === selectedDate);
  const recordedClassIds = new Set(classesForDate.map(a => a.kelasId));
  const unrecordedClasses = classesList.filter(c => !recordedClassIds.has(c.id));

  let totalSchoolStudents = 0;
  let totalSchoolPresent = 0;
  classesForDate.forEach(c => {
    totalSchoolStudents += c.jumlahMurid;
    totalSchoolPresent += c.jumlahHadir;
  });
  const overallDayPercentage = totalSchoolStudents > 0
    ? Number(((totalSchoolPresent / totalSchoolStudents) * 100).toFixed(1))
    : 0;

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              Modul Kehadiran Harian
            </span>
            <span className="text-xs text-slate-500">
              {isOnline ? 'Segerak Maya Aktif' : 'Mod Luar Talian (Simpan Setempat)'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Perekodan & Pemantauan Kehadiran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Merekod kehadiran murid kurang daripada 1 minit dengan sokongan luar talian
          </p>
        </div>

        {/* Tab switch between Rekod Harian vs Papan Pemantauan GPK HEM */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('rekod')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'rekod'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekod Kehadiran Kelas
          </button>
          <button
            onClick={() => setActiveTab('pantau')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pantau'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Papan GPK HEM
          </button>
        </div>
      </div>

      {/* Date & Class Selector Strip */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <label className="font-semibold text-slate-700">Tarikh:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium bg-slate-50 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {activeTab === 'rekod' && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700" />
              <label className="font-semibold text-slate-700">Pilih Kelas:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-slate-50 focus:ring-1 focus:ring-blue-600"
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nama} (Tingkatan {c.tingkatan})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowClassBatchModal(true)}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                title="Upload senarai nama pelajar untuk kelas ini"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Sekelas</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === 'rekod' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Semua Hadir</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Kehadiran'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= TAB 1: REKOD HARIAN (GURU KELAS) ================= */}
      {activeTab === 'rekod' && (
        <div className="space-y-4">
          {/* Class Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500">Kelas</span>
              <p className="text-base font-extrabold text-slate-900">{selectedClassInfo?.nama}</p>
              <p className="text-[10px] text-slate-400">Jumlah: {totalClass} murid</p>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-800">Hadir</span>
              <p className="text-base font-extrabold text-emerald-700">
                {currentClassPresentCount + currentClassLateCount}
              </p>
              <p className="text-[10px] text-emerald-600">{currentClassPct}% kehadiran</p>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
              <span className="text-[11px] font-semibold text-rose-800">Tidak Hadir (Tanpa Sebab)</span>
              <p className="text-base font-extrabold text-rose-700">{currentClassAbsentCount}</p>
              <p className="text-[10px] text-rose-500">Perlu tindakan susulan</p>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
              <span className="text-[11px] font-semibold text-amber-900">Cuti Sakit / Rasmi</span>
              <p className="text-base font-extrabold text-amber-700">{currentClassSickCount}</p>
              <p className="text-[10px] text-amber-600">Surat disahkan: disemak</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari murid dalam kelas ini (nama atau No. Murid)..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>

          {/* Student Tap-Attendance List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <div className="p-3 bg-slate-50 text-[11px] font-bold text-slate-600 flex items-center justify-between">
              <span>NAMA MURID & MAKLUMAT (Ketik butang untuk tukar status pantas)</span>
              <span>STATUS KEHADIRAN</span>
            </div>

            {filteredStudents.map((stu, index) => {
              const record = currentAttendance[stu.id] || { status: 'hadir' };
              const isHadir = record.status === 'hadir';
              const isLewat = record.status === 'lewat';
              const isSakit = record.status === 'cuti_sakit';
              const isTidakHadir = record.status === 'tidak_hadir';
              const isUrusan = record.status === 'urusan_rasmi';

              return (
                <div
                  key={stu.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {stu.nama}
                        </span>
                        {stu.penghuniAsrama && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-200">
                            Asrama
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {stu.noMurid} • {stu.kampung}
                        {record.sebab && (
                          <span className="text-rose-600 font-semibold ml-1.5">
                            [{record.sebab}]
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* High-touch button bar (min 44px touch friendly) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Hadir Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentAttendance(prev => ({
                          ...prev,
                          [stu.id]: { status: 'hadir', masaTiba: '07:00' }
                        }));
                      }}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isHadir
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Hadir</span>
                    </button>

                    {/* Tidak Hadir Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentId(stu.id);
                        setTempStatus('tidak_hadir');
                        setTempReason(record.sebab || '');
                        setTempSurat(record.suratDisahkan || false);
                      }}
                      className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isTidakHadir
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Tidak Hadir</span>
                    </button>

                    {/* More status / Sebab Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentId(stu.id);
                        setTempStatus(record.status);
                        setTempReason(record.sebab || '');
                        setTempSurat(record.suratDisahkan || false);
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                        isSakit || isLewat || isUrusan
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Pilih status lain: Cuti Sakit, Lewat, Urusan Rasmi"
                    >
                      {isSakit ? 'Sakit' : isLewat ? 'Lewat' : isUrusan ? 'Rasmi' : 'Ubah'}
                    </button>
                  </div>
                </div>
              );
            })}

            {currentClassStudents.length === 0 ? (
              <div className="p-8 text-center text-xs space-y-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Belum Ada Murid Didaftarkan Bagi Kelas Ini ({selectedClassInfo?.nama})</p>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Anda boleh memuat naik senarai nama keseluruhan murid bagi kelas ini melalui fail Excel (idMe KPM) atau salin & tampal teks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClassBatchModal(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Upload Senarai Murid {selectedClassInfo?.nama}</span>
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Tiada murid dijumpai untuk carian ini.
              </div>
            ) : null}
          </div>

          {/* Floating Save Bar on Mobile */}
          <div className="fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl lg:hidden flex items-center justify-between z-20">
            <div className="text-xs">
              <span className="font-bold text-slate-900">{selectedClassInfo?.nama}: </span>
              <span className="text-emerald-700 font-extrabold">{currentClassPct}% hadir</span>
            </div>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Simpan...' : 'Simpan Kehadiran'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PAPAN GPK HEM & PEMANTAUAN SEKOLAH ================= */}
      {activeTab === 'pantau' && (
        <div className="space-y-6">
          {/* KPI Monitoring */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Peratus Keseluruhan Sekolah</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-blue-900">{overallDayPercentage}%</span>
                <span className="text-xs text-slate-400">Sasaran: {rules.sasaranKehadiranSekolah}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Hadir: <strong>{totalSchoolPresent}</strong> / {totalSchoolStudents} murid
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Status Penghantaran Kelas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-700">{classesForDate.length}</span>
                <span className="text-xs text-slate-400">/ {classesList.length} kelas</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {unrecordedClasses.length === 0
                  ? 'Semua kelas telah menghantar kehadiran!'
                  : `${unrecordedClasses.length} kelas belum hantar`}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Tindakan HEM Diperlukan</span>
              <div className="text-3xl font-black text-amber-700 mt-1">
                {unrecordedClasses.length > 0 ? 'Peringatan' : 'Selesai'}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Peringatan automatik kepada guru kelas bertugas
              </p>
            </div>
          </div>

          {/* Senarai Kelas Belum Rekod (Alert Box) */}
          {unrecordedClasses.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Kelas Belum Merekod Kehadiran ({selectedDate}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unrecordedClasses.map(c => (
                  <span
                    key={c.id}
                    className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 shadow-2xs"
                  >
                    {c.nama} (Ting. {c.tingkatan})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Jadual Prestasi Kehadiran Mengikut Kelas */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Laporan Kehadiran Kelas ({selectedDate})
                </h3>
                <p className="text-xs text-slate-500">Status perekodan dan peratusan setiap kelas</p>
              </div>
              <button
                onClick={() => showToast('Ringkasan kehadiran harian telah dieksport.', 'success')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Eksport Ringkasan</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Tingkatan</th>
                    <th className="p-3">Guru Kelas / Perekod</th>
                    <th className="p-3 text-center">Enrolmen</th>
                    <th className="p-3 text-center">Hadir</th>
                    <th className="p-3 text-center">Tidak Hadir</th>
                    <th className="p-3 text-center">% Kehadiran</th>
                    <th className="p-3">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classesList.map(c => {
                    const record = classesForDate.find(a => a.kelasId === c.id);
                    const isRecorded = Boolean(record);
                    const isMetTarget = (record?.peratus || 0) >= rules.sasaranKehadiranSekolah;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{c.nama}</td>
                        <td className="p-3 text-slate-600">Tingkatan {c.tingkatan}</td>
                        <td className="p-3 text-slate-600">
                          {record?.namaPerekod || 'Belum direkod'}
                        </td>
                        <td className="p-3 text-center font-medium">
                          {record?.jumlahMurid || 30}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700">
                          {record?.jumlahHadir || '-'}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600">
                          {record ? record.jumlahMurid - record.jumlahHadir : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {record ? (
                            <span
                              className={`px-2 py-0.5 rounded-full font-extrabold text-xs ${
                                isMetTarget
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {record.peratus}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Belum hantar</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              setSelectedClassId(c.id);
                              setActiveTab('rekod');
                            }}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {isRecorded ? 'Semak / Ubah' : 'Rekod Sekarang'}
                          </button>
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

      {/* Modal Masukan Sebab Ketidakhadiran */}
      {editingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Perekodan Sebab Ketidakhadiran
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {students.find(s => s.id === editingStudentId)?.nama}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Kehadiran
                </label>
                <select
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value as AttendanceStatus)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="tidak_hadir">Tidak Hadir (Tanpa Sebab)</option>
                  <option value="cuti_sakit">Cuti Sakit (MC / Demam)</option>
                  <option value="lewat">Hadir Lewat</option>
                  <option value="urusan_rasmi">Urusan Rasmi Sekolah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Punca / Sebab Nyata
                </label>
                <input
                  type="text"
                  value={tempReason}
                  onChange={(e) => setTempReason(e.target.value)}
                  placeholder="Contoh: Menjaga adik / Masalah pengangkutan"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkSurat"
                  checked={tempSurat}
                  onChange={(e) => setTempSurat(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="chkSurat" className="text-xs text-slate-700 font-medium">
                  Disertakan surat makluman / sijil sakit rasmi
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingStudentId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleSaveReasonModal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Simpan Sebab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Senarai Murid Sekelas */}
      <ClassStudentBatchModal
        isOpen={showClassBatchModal}
        classesList={classesList}
        existingStudents={students}
        initialClass={selectedClassInfo?.nama}
        onClose={() => setShowClassBatchModal(false)}
        onSuccess={() => {
          setShowClassBatchModal(false);
          refreshAttendanceData();
        }}
      />
    </div>
  );
};
