import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  Student,
  HostelRoom,
  HostelMovementLog,
  HostelInspection,
  HostelDailyReport,
  DisciplineCase
} from '../types';
import {
  getStudents,
  getHostelRooms,
  saveHostelRoom,
  getHostelMovements,
  saveHostelMovement,
  getHostelInspections,
  saveHostelInspection,
  getHostelDailyReports,
  saveHostelDailyReport,
  getDisciplineCases,
  saveDisciplineCase
} from '../services/dataService';
import {
  Home,
  Users,
  CheckCircle2,
  Search,
  MapPin,
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  DoorOpen,
  ClipboardList,
  ShieldAlert,
  Moon,
  Sparkles,
  ArrowRightLeft,
  X,
  FileText
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const Hostel: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem, canManageHostel } = useAuth();
  const { school, showToast } = useSchool();

  const isModuleActive = school.modulAsramaAktif !== false;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [movements, setMovements] = useState<HostelMovementLog[]>([]);
  const [inspections, setInspections] = useState<HostelInspection[]>([]);
  const [dailyReports, setDailyReports] = useState<HostelDailyReport[]>([]);
  const [disciplineCases, setDisciplineCases] = useState<DisciplineCase[]>([]);

  const [activeTab, setActiveTab] = useState<'penghuni' | 'pergerakan' | 'pemeriksaan' | 'rollcall' | 'disiplin'>('penghuni');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlok, setFilterBlok] = useState('semua');

  // Modals
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showRollCallModal, setShowRollCallModal] = useState(false);

  // Transfer room state
  const [selectedStudentForMove, setSelectedStudentForMove] = useState<Student | null>(null);
  const [targetRoomId, setTargetRoomId] = useState('');

  // Permit Form state
  const [permitStudentId, setPermitStudentId] = useState('');
  const [permitJenis, setPermitJenis] = useState<HostelMovementLog['jenis']>('pulang_bermalam');
  const [permitTujuan, setPermitTujuan] = useState('');
  const [permitTarikhJangka, setPermitTarikhJangka] = useState(new Date().toISOString().split('T')[0]);

  // Inspection state
  const [inspBlok, setInspBlok] = useState('Blok A (Putera)');
  const [inspKamar, setInspKamar] = useState('Kamar Kinabalu 1');
  const [inspSkor, setInspSkor] = useState(8);
  const [inspBarang, setInspBarang] = useState(false);
  const [inspBarangNote, setInspBarangNote] = useState('');
  const [inspTindakan, setInspTindakan] = useState('Kamar disahkan bersih dan kemas.');

  // Roll call state
  const [rcHadir, setRcHadir] = useState(38);
  const [rcBermalam, setRcBermalam] = useState(4);
  const [rcSakit, setRcSakit] = useState(0);
  const [rcKebajikan, setRcKebajikan] = useState('Semua penghuni dalam keadaan sihat dan teratur.');
  const [rcCatatan, setRcCatatan] = useState('Roll call selesai jam 10.15 malam.');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [stList, rList, mvList, insList, hdrList, dpList] = await Promise.all([
        getStudents(),
        getHostelRooms(),
        getHostelMovements(),
        getHostelInspections(),
        getHostelDailyReports(),
        getDisciplineCases()
      ]);
      setStudents(stList.filter(s => s.penghuniAsrama));
      setRooms(rList);
      setMovements(mvList);
      setInspections(insList);
      setDailyReports(hdrList);
      setDisciplineCases(dpList.filter(d => d.lokasi.toLowerCase().includes('asrama') || d.kategori.toLowerCase().includes('asrama')));
      if (rList.length > 0) setTargetRoomId(rList[0].id);
      const hostSt = stList.filter(s => s.penghuniAsrama);
      if (hostSt.length > 0) setPermitStudentId(hostSt[0].id);
    } catch (err) {
      console.error('Ralat memuatkan asrama:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Transfer Room
  const handleTransferRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMove || !targetRoomId) return;

    try {
      const operator = currentUser || { uid: 'warden', nama: 'Warden' };
      const targetRoom = rooms.find(r => r.id === targetRoomId);
      if (!targetRoom) return;

      // Update old room and new room
      const updatedRooms = rooms.map(r => {
        if (r.id === targetRoomId) {
          return {
            ...r,
            penghuniIds: Array.from(new Set([...r.penghuniIds, selectedStudentForMove.id]))
          };
        }
        return {
          ...r,
          penghuniIds: r.penghuniIds.filter(id => id !== selectedStudentForMove.id)
        };
      });

      for (const r of updatedRooms) {
        await saveHostelRoom(r, operator);
      }

      setRooms(updatedRooms);
      setShowMoveModal(false);
      showToast(`Murid ${selectedStudentForMove.nama} berjaya dipindahkan ke ${targetRoom.namaKamar}.`, 'success');
    } catch (err) {
      showToast('Gagal memindahkan bilik.', 'error');
    }
  };

  // Handle New Movement Permit
  const handleCreatePermit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permitStudentId) return;

    try {
      const operator = currentUser || { uid: 'warden', nama: school.namaKetuaWarden || 'Warden Asrama' };
      const newPermit: HostelMovementLog = {
        id: `mv_${Date.now()}`,
        studentId: permitStudentId,
        jenis: permitJenis,
        tarikhKeluar: new Date().toISOString().split('T')[0],
        masaKeluar: '03:00 PM',
        tarikhJangkaPulang: permitTarikhJangka,
        tujuan: permitTujuan || 'Pulang bercuti hujung minggu bersama keluarga.',
        statusKelulusan: 'diluluskan',
        wardenUid: operator.uid,
        namaWarden: operator.nama
      };

      await saveHostelMovement(newPermit, operator, true);
      setMovements(prev => [newPermit, ...prev]);
      setShowPermitModal(false);
      setPermitTujuan('');
      showToast('Permit pergerakan murid berjaya diluluskan dan direkod.', 'success');
    } catch (err) {
      showToast('Gagal mencipta permit.', 'error');
    }
  };

  // Toggle Permit Return
  const handleMarkReturned = async (mov: HostelMovementLog) => {
    const operator = currentUser || { uid: 'warden', nama: 'Warden' };
    const today = new Date().toISOString().split('T')[0];
    const updated: HostelMovementLog = {
      ...mov,
      statusKelulusan: 'telah_pulang',
      tarikhSebenarPulang: today
    };

    await saveHostelMovement(updated, operator, false);
    setMovements(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    showToast('Murid disahkan telah kembali ke asrama.', 'success');
  };

  // Add Inspection
  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operator = currentUser || { uid: 'warden', nama: 'Warden' };
      const newInsp: HostelInspection = {
        id: `insp_${Date.now()}`,
        tarikh: new Date().toISOString().split('T')[0],
        blok: inspBlok,
        kamar: inspKamar,
        skorKebersihan: Number(inspSkor),
        barangLaranganDitemui: inspBarang,
        perincianBarangLarangan: inspBarang ? inspBarangNote : undefined,
        wardenBertugas: currentUser?.nama || 'Warden Bertugas',
        tindakan: inspTindakan
      };

      await saveHostelInspection(newInsp, operator);
      setInspections(prev => [newInsp, ...prev]);
      setShowInspectionModal(false);
      showToast('Laporan pemeriksaan kamar berjaya direkodkan.', 'success');
    } catch (err) {
      showToast('Gagal merekod pemeriksaan.', 'error');
    }
  };

  // Add Roll Call
  const handleAddRollCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operator = currentUser || { uid: 'warden', nama: 'Warden' };
      const newHdr: HostelDailyReport = {
        id: `hdr_${Date.now()}`,
        tarikh: new Date().toISOString().split('T')[0],
        wardenBertugas: currentUser?.nama || school.namaKetuaWarden || 'Warden Bertugas',
        kiraanMuridMalam: {
          hadir: Number(rcHadir),
          pulangBermalam: Number(rcBermalam),
          sakit: Number(rcSakit),
          tiadaKebenaran: 0
        },
        isuKebajikan: rcKebajikan,
        catatan: rcCatatan
      };

      await saveHostelDailyReport(newHdr, operator);
      setDailyReports(prev => [newHdr, ...prev]);
      setShowRollCallModal(false);
      showToast('Kiraan murid (Roll Call) malam ini berjaya direkodkan.', 'success');
    } catch (err) {
      showToast('Gagal merekod roll call.', 'error');
    }
  };

  if (!isModuleActive) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4 pt-16">
        <Home className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-extrabold text-slate-800">Modul Asrama Desa Dimatikan</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Modul Asrama Desa telah dinyahaktifkan oleh Pentadbir Sekolah dalam menu Tetapan Sekolah.
        </p>
      </div>
    );
  }

  const filteredStudents = students.filter(s => {
    if (filterBlok === 'putera' && s.jantina !== 'lelaki') return false;
    if (filterBlok === 'puteri' && s.jantina !== 'perempuan') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.kampung.toLowerCase().includes(q);
    }
    return true;
  });

  const totalBoys = students.filter(s => s.jantina === 'lelaki').length;
  const totalGirls = students.filter(s => s.jantina === 'perempuan').length;
  const totalCapacity = rooms.reduce((acc, curr) => acc + curr.kapasiti, 0);

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900">
              Pengurusan Asrama Desa (HEM Fasa 3)
            </span>
            <span className="text-xs text-slate-500">Ketua Warden: {school.namaKetuaWarden || 'Warden Asrama'} • {school.nama}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Asrama Desa SMK Salaping
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengurusan penempatan murid pedalaman, permit pergerakan, roll call malam, dan spot-check disiplin
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowPermitModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Permit Keluar / Balik</span>
          </button>

          <button
            onClick={() => setShowRollCallModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Moon className="w-4 h-4" />
            <span>Kiraan Roll Call</span>
          </button>

          <button
            onClick={() => setShowInspectionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Spot-Check Bilik</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Penghuni Berdaftar</span>
          <div className="text-2xl font-black text-indigo-900 mt-1">{students.length} Murid</div>
          <p className="text-[10px] text-slate-600 mt-1 font-medium">
            Kuota Asrama: <span className="font-bold text-slate-800">{students.length} / {totalCapacity || 60} Katil</span> (Baki Kuota: <span className="font-bold text-indigo-700">{(totalCapacity || 60) - students.length}</span>)
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Penghuni Putera & Puteri</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {totalBoys}L / {totalGirls}P
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Blok A (Putera) & Blok B (Puteri)</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Keluar / Bermalam Minggu Ini</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {movements.filter(m => m.statusKelulusan === 'diluluskan').length} Murid
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Semua permit disahkan warden</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Pemeriksaan Kamar & Disiplin</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {inspections.length} Sesi
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {inspections.filter(i => i.barangLaranganDitemui).length} rampasan barang larangan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('penghuni')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'penghuni' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Penghuni & Kamar ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pergerakan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pergerakan' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Permit Keluar / Balik ({movements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rollcall')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'rollcall' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>Laporan Harian & Roll Call ({dailyReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pemeriksaan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'pemeriksaan' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Pemeriksaan Bilik & Spot-Check ({inspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disiplin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'disiplin' ? 'bg-indigo-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Disiplin Asrama ({disciplineCases.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PENGHUNI & KAMAR ================= */}
      {activeTab === 'penghuni' && (
        <div className="space-y-4">
          {/* Kamar Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {rooms.map(room => (
              <div key={room.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1.5 text-xs">
                <span className="text-[10px] font-black uppercase text-indigo-700">{room.blok}</span>
                <div className="font-extrabold text-slate-900 leading-tight">{room.namaKamar}</div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Penghuni:</span>
                  <span className="font-bold text-slate-900">
                    {room.penghuniIds.length} / {room.kapasiti}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari penghuni atau kampung..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterBlok}
                onChange={e => setFilterBlok(e.target.value)}
                className="border border-slate-300 rounded-lg p-2 font-medium bg-slate-50"
              >
                <option value="semua">Semua Blok</option>
                <option value="putera">Blok Putera Sahaja</option>
                <option value="puteri">Blok Puteri Sahaja</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Penghuni</th>
                    <th className="p-3">Kelas & Jantina</th>
                    <th className="p-3">Kampung Asal</th>
                    <th className="p-3">Kamar / Bilik</th>
                    <th className="p-3">Waris / No. Tel</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(s => {
                    const assignedRoom = rooms.find(r => r.penghuniIds.includes(s.id));
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{s.nama}</td>
                        <td className="p-3 text-slate-600 font-medium">
                          {s.kelas} • <span className="capitalize">{s.jantina}</span>
                        </td>
                        <td className="p-3 text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{s.kampung}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {assignedRoom?.namaKamar || s.kamarAsrama || 'Kamar Kinabalu 1'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {s.penjaga[0]?.nama} ({s.penjaga[0]?.noTel})
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentForMove(s);
                              setShowMoveModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[11px] flex items-center gap-1 ml-auto"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Tukar Bilik</span>
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

      {/* ================= TAB 2: PERGERAKAN / PERMIT ================= */}
      {activeTab === 'pergerakan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekod Pergerakan & Permit Keluar Masuk Asrama</h3>
                <p className="text-xs text-slate-500">Kebenaran rasmi pulang bermalam, urusan kecemasan, atau keluar ke pekan</p>
              </div>
              <button
                onClick={() => setShowPermitModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Keluarkan Permit</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Penghuni</th>
                    <th className="p-3">Jenis Permit</th>
                    <th className="p-3">Tarikh / Masa Keluar</th>
                    <th className="p-3">Jangka Pulang</th>
                    <th className="p-3">Tujuan</th>
                    <th className="p-3">Warden Meluluskan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map(m => {
                    const stu = students.find(s => s.id === m.studentId);
                    const isReturned = m.statusKelulusan === 'telah_pulang';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{stu?.nama || 'Murid'}</td>
                        <td className="p-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {m.jenis.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {m.tarikhKeluar} ({m.masaKeluar})
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{m.tarikhJangkaPulang}</td>
                        <td className="p-3 text-slate-600 max-w-xs">{m.tujuan}</td>
                        <td className="p-3 text-slate-600 font-semibold">{m.namaWarden}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              isReturned ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {isReturned ? 'Telah Pulang' : 'Sedang Keluar'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {!isReturned && (
                            <button
                              onClick={() => handleMarkReturned(m)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                            >
                              Sahkan Pulang
                            </button>
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

      {/* ================= TAB 3: ROLL CALL & LAPORAN HARIAN ================= */}
      {activeTab === 'rollcall' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
            <Moon className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">Peringatan Pengurusan Kiraan Murid (Roll Call) Malam</strong>
              <p className="mt-0.5 leading-relaxed">
                Roll call wajib dijalankan setiap malam tepat jam 10.00 malam oleh Warden bertugas untuk memastikan semua penghuni selamat berada di dalam kamar asrama.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailyReports.map(hdr => (
              <div key={hdr.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-extrabold text-sm text-slate-900">{hdr.tarikh}</span>
                  <span className="font-semibold text-slate-500">Warden: {hdr.wardenBertugas}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <span className="text-[10px] text-emerald-700 font-bold block">Hadir</span>
                    <span className="text-base font-black text-emerald-900">{hdr.kiraanMuridMalam.hadir}</span>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <span className="text-[10px] text-blue-700 font-bold block">Bermalam</span>
                    <span className="text-base font-black text-blue-900">{hdr.kiraanMuridMalam.pulangBermalam}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <span className="text-[10px] text-amber-700 font-bold block">Sakit</span>
                    <span className="text-base font-black text-amber-900">{hdr.kiraanMuridMalam.sakit}</span>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <span className="text-[10px] text-red-700 font-bold block">Tanpa Izin</span>
                    <span className="text-base font-black text-red-900">{hdr.kiraanMuridMalam.tiadaKebenaran}</span>
                  </div>
                </div>

                <div>
                  <strong className="text-slate-800 block text-[11px]">Kebajikan & Kesihatan:</strong>
                  <p className="text-slate-600 mt-0.5">{hdr.isuKebajikan}</p>
                </div>

                <div>
                  <strong className="text-slate-800 block text-[11px]">Catatan Warden:</strong>
                  <p className="text-slate-600 mt-0.5">{hdr.catatan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: PEMERIKSAAN BILIK & SPOT-CHECK ================= */}
      {activeTab === 'pemeriksaan' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekod Spot-Check & Pemeriksaan Kamar</h3>
                <p className="text-xs text-slate-500">Pemeriksaan kebersihan, keselamatan elektrik, dan penyitaan barang larangan</p>
              </div>
              <button
                onClick={() => setShowInspectionModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Rekod Pemeriksaan Baharu</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Tarikh</th>
                    <th className="p-3">Kamar / Blok</th>
                    <th className="p-3">Skor Kebersihan</th>
                    <th className="p-3">Barang Larangan Ditemui</th>
                    <th className="p-3">Tindakan Warden</th>
                    <th className="p-3">Pemeriksa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-700">{ins.tarikh}</td>
                      <td className="p-3 font-bold text-slate-900">{ins.kamar} ({ins.blok})</td>
                      <td className="p-3">
                        <span className="font-black text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {ins.skorKebersihan} / 10
                        </span>
                      </td>
                      <td className="p-3">
                        {ins.barangLaranganDitemui ? (
                          <div className="text-red-700 font-bold">
                            ⚠️ ADA: <span className="font-normal text-slate-800">{ins.perincianBarangLarangan}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Tiada (Bersih)</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{ins.tindakan || '-'}</td>
                      <td className="p-3 text-slate-700 font-medium">{ins.wardenBertugas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: DISIPLIN ASRAMA ================= */}
      {activeTab === 'disiplin' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Salah Laku Berkaitan Asrama (Penyelarasan SSDM)</h3>
              <p className="text-xs text-slate-500">Menggunakan aliran piawai modul Disiplin dengan tag lokasi 'Asrama'</p>
            </div>

            <div className="divide-y divide-slate-100">
              {disciplineCases.map(c => {
                const stu = students.find(s => s.id === c.studentId);
                return (
                  <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{stu?.nama || 'Murid Asrama'}</div>
                      <div className="text-slate-500 text-[11px]">
                        {c.noRujukan} • {c.tarikhKejadian} • Lokasi: <strong>{c.lokasi}</strong>
                      </div>
                      <p className="mt-1 text-slate-700">{c.perincianKes}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="px-2 py-0.5 rounded font-black text-[10px] uppercase bg-rose-100 text-rose-800">
                        {c.tahap}
                      </span>
                      <div className="text-[11px] font-semibold text-slate-800 mt-1">{c.tindakanDiambil}</div>
                    </div>
                  </div>
                );
              })}

              {disciplineCases.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Tiada kes disiplin asrama aktif direkodkan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TUKAR BILIK ================= */}
      {showMoveModal && selectedStudentForMove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Pertukaran Kamar Asrama</h3>
              <button onClick={() => setShowMoveModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferRoom} className="space-y-3.5">
              <div>
                <span className="font-bold text-slate-700 block mb-1">Nama Murid:</span>
                <p className="font-extrabold text-slate-900 text-sm">{selectedStudentForMove.nama}</p>
                <p className="text-[11px] text-slate-500">Tingkatan {selectedStudentForMove.kelas} • {selectedStudentForMove.jantina}</p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Kamar Sasaran:</label>
                <select
                  value={targetRoomId}
                  onChange={e => setTargetRoomId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {rooms
                    .filter(r =>
                      selectedStudentForMove.jantina === 'lelaki' ? r.blok.includes('Putera') : r.blok.includes('Puteri')
                    )
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaKamar} ({r.blok}) - {r.penghuniIds.length}/{r.kapasiti} Penghuni
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Sahkan Pindah Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KELUARKAN PERMIT ================= */}
      {showPermitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Keluarkan Permit Keluar / Balik Asrama</h3>
              <button onClick={() => setShowPermitModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePermit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Penghuni:</label>
                <select
                  value={permitStudentId}
                  onChange={e => setPermitStudentId(e.target.value)}
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
                <label className="font-bold text-slate-800 block mb-1">Jenis Pergerakan:</label>
                <select
                  value={permitJenis}
                  onChange={e => setPermitJenis(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="pulang_bermalam">Pulang Bermalam Hujung Minggu</option>
                  <option value="urusan_keluar">Urusan Keluar ke Pekan Kota Marudu</option>
                  <option value="kecemasan">Kecemasan Keluarga</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Tarikh Jangka Pulang ke Asrama:</label>
                <input
                  type="date"
                  required
                  value={permitTarikhJangka}
                  onChange={e => setPermitTarikhJangka(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Tujuan / Catatan:</label>
                <textarea
                  rows={2}
                  required
                  value={permitTujuan}
                  onChange={e => setPermitTujuan(e.target.value)}
                  placeholder="Contoh: Mengikuti aktiviti keluarga dan membeli kelengkapan belajar..."
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPermitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Luluskan Permit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ROLL CALL ================= */}
      {showRollCallModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Rekod Kiraan Roll Call Malam</h3>
              <button onClick={() => setShowRollCallModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRollCall} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Hadir:</label>
                  <input
                    type="number"
                    value={rcHadir}
                    onChange={e => setRcHadir(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Bermalam:</label>
                  <input
                    type="number"
                    value={rcBermalam}
                    onChange={e => setRcBermalam(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-blue-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Sakit:</label>
                  <input
                    type="number"
                    value={rcSakit}
                    onChange={e => setRcSakit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-amber-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Isu Kebajikan Penghuni:</label>
                <textarea
                  rows={2}
                  value={rcKebajikan}
                  onChange={e => setRcKebajikan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Catatan Keseluruhan:</label>
                <textarea
                  rows={2}
                  value={rcCatatan}
                  onChange={e => setRcCatatan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRollCallModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Laporan Roll Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SPOT-CHECK ================= */}
      {showInspectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Borang Pemeriksaan Kamar / Spot-Check</h3>
              <button onClick={() => setShowInspectionModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInspection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Blok:</label>
                  <select
                    value={inspBlok}
                    onChange={e => setInspBlok(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Blok A (Putera)">Blok A (Putera)</option>
                    <option value="Blok B (Puteri)">Blok B (Puteri)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kamar:</label>
                  <input
                    type="text"
                    value={inspKamar}
                    onChange={e => setInspKamar(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Skor Kebersihan & Kekemasan (1 - 10):</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={inspSkor}
                  onChange={e => setInspSkor(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-indigo-900"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inspBarang}
                    onChange={e => setInspBarang(e.target.checked)}
                  />
                  <span>Terdapat Rampasan Barang Larangan?</span>
                </label>

                {inspBarang && (
                  <input
                    type="text"
                    placeholder="Nyatakan barang (cth. pemanas air, rokok, gajet haram)..."
                    value={inspBarangNote}
                    onChange={e => setInspBarangNote(e.target.value)}
                    className="w-full border border-rose-300 rounded-lg p-2 text-rose-900 font-medium"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Tindakan / Ulasan Warden:</label>
                <textarea
                  rows={2}
                  value={inspTindakan}
                  onChange={e => setInspTindakan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Laporan Pemeriksaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
