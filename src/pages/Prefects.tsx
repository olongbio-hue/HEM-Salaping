import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { Prefect, PrefectDutyRoster, Student } from '../types';
import {
  getPrefects,
  savePrefect,
  getPrefectDutyRosters,
  savePrefectDutyRoster,
  getStudents
} from '../services/dataService';
import {
  ShieldCheck,
  Award,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const Prefects: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem } = useAuth();
  const { showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [prefects, setPrefects] = useState<Prefect[]>([]);
  const [rosters, setRosters] = useState<PrefectDutyRoster[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [activeTab, setActiveTab] = useState<'senarai' | 'jadual'>('senarai');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddPrefectModal, setShowAddPrefectModal] = useState(false);
  const [showAddRosterModal, setShowAddRosterModal] = useState(false);

  // Prefect Form
  const [newStudentId, setNewStudentId] = useState('');
  const [newJawatan, setNewJawatan] = useState<Prefect['jawatan']>('Pengawas');
  const [newSkor, setNewSkor] = useState(90);
  const [newCatatan, setNewCatatan] = useState('Berdisiplin tinggi dan aktif menjalankan tugas pengawasan.');

  // Roster Form
  const [newHari, setNewHari] = useState<PrefectDutyRoster['hari']>('Isnin');
  const [newLokasi, setNewLokasi] = useState<PrefectDutyRoster['lokasi']>('Pintu Pagar Utama');
  const [newMasa, setNewMasa] = useState('06:40 AM - 07:15 AM');
  const [selectedPrefectIds, setSelectedPrefectIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pList, rList, stList] = await Promise.all([
        getPrefects(),
        getPrefectDutyRosters(),
        getStudents()
      ]);
      setPrefects(pList);
      setRosters(rList);
      setStudents(stList);
      if (stList.length > 0) setNewStudentId(stList[0].id);
    } catch (err) {
      console.error('Ralat memuatkan data pengawas:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Add Prefect
  const handleSavePrefect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) return;
    try {
      const operator = currentUser || { uid: 'penyelaras', nama: 'Penyelaras Pengawas' };
      const newPref: Prefect = {
        id: `pref_${Date.now()}`,
        studentId: newStudentId,
        jawatan: newJawatan,
        sesi: '2026/2027',
        status: 'aktif',
        skorPrestasi: Number(newSkor),
        catatanPrestasi: newCatatan
      };
      await savePrefect(newPref, operator, true);
      setPrefects(prev => [newPref, ...prev]);
      setShowAddPrefectModal(false);
      showToast('Pelantikan pengawas sekolah berjaya direkodkan.', 'success');
    } catch (err) {
      showToast('Gagal melantik pengawas.', 'error');
    }
  };

  // Handle Add Roster
  const handleSaveRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operator = currentUser || { uid: 'penyelaras', nama: 'Penyelaras Pengawas' };
      const newRost: PrefectDutyRoster = {
        id: `roster_${Date.now()}`,
        hari: newHari,
        lokasi: newLokasi,
        pengawasIds: selectedPrefectIds.length > 0 ? selectedPrefectIds : prefects.slice(0, 3).map(p => p.id),
        masaTugas: newMasa
      };
      await savePrefectDutyRoster(newRost, operator);
      setRosters(prev => [...prev, newRost]);
      setShowAddRosterModal(false);
      showToast('Jadual tugas pengawas berjaya dikemaskini.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan jadual tugas.', 'error');
    }
  };

  const filteredPrefects = prefects.filter(p => {
    if (searchTerm) {
      const stu = students.find(s => s.id === p.studentId);
      const q = searchTerm.toLowerCase();
      return stu?.nama.toLowerCase().includes(q) || p.jawatan.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-900">
              Badan Pengawas & Kepimpinan Murid (HEM Fasa 3)
            </span>
            <span className="text-xs text-slate-500">Penyelaras: Ustaz Mohd Azlan • SMK Salaping</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengurusan Lembaga Pengawas Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Senarai pelantikan exco pengawas, pemantauan prestasi tugas sahsiah, dan jadual rondaan harian
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowAddPrefectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-800 hover:bg-cyan-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Lantik Pengawas</span>
          </button>

          <button
            onClick={() => setShowAddRosterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Jadual Bertugas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Anggota Pengawas</span>
          <div className="text-2xl font-black text-cyan-950 mt-1">{prefects.length} Murid</div>
          <p className="text-[10px] text-slate-500 mt-1">Sesi 2026/2027</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Purata Skor Prestasi</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {prefects.length > 0 ? (prefects.reduce((a, b) => a + b.skorPrestasi, 0) / prefects.length).toFixed(0) : 92}%
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Prestasi Cemerlang</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Pos Kawalan Bertugas</span>
          <div className="text-2xl font-black text-slate-900 mt-1">5 Lokasi</div>
          <p className="text-[10px] text-slate-500 mt-1">Pintu pagar, kantin, perhimpunan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Jadual Giliran Aktif</span>
          <div className="text-2xl font-black text-blue-900 mt-1">{rosters.length} Sifir</div>
          <p className="text-[10px] text-slate-500 mt-1">Setiap hari persekolahan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('senarai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'senarai' ? 'bg-cyan-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Senarai Anggota & Prestasi ({prefects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jadual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'jadual' ? 'bg-cyan-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadual Bertugas Harian ({rosters.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: SENARAI PENGAWAS ================= */}
      {activeTab === 'senarai' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Cari nama pengawas atau jawatan..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nama Pengawas</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Jawatan</th>
                    <th className="p-3">Sesi</th>
                    <th className="p-3">Skor Prestasi</th>
                    <th className="p-3">Catatan Sahsiah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPrefects.map(p => {
                    const stu = students.find(s => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{stu?.nama || 'Pengawas'}</td>
                        <td className="p-3 text-slate-600 font-semibold">{stu?.kelas}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-cyan-100 text-cyan-900 border border-cyan-200">
                            {p.jawatan}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-mono">{p.sesi}</td>
                        <td className="p-3">
                          <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                            {p.skorPrestasi}%
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs">{p.catatanPrestasi}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: JADUAL BERTUGAS ================= */}
      {activeTab === 'jadual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rosters.map(ros => (
              <div key={ros.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded">
                      {ros.hari}
                    </span>
                    <span className="font-bold text-slate-900">{ros.lokasi}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ros.masaTugas}</span>
                  </span>
                </div>

                <div>
                  <strong className="text-slate-700 block text-[11px] mb-1">Pengawas Bertugas:</strong>
                  <div className="flex flex-wrap gap-1.5">
                    {ros.pengawasIds.map(pId => {
                      const pref = prefects.find(p => p.id === pId);
                      const stu = students.find(s => s.id === pref?.studentId);
                      return (
                        <span
                          key={pId}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-semibold text-slate-800 text-[11px]"
                        >
                          {stu?.nama || 'Pengawas'} ({pref?.jawatan})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL LANTIK PENGAWAS ================= */}
      {showAddPrefectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Pelantikan Anggota Pengawas Baharu</h3>
              <button onClick={() => setShowAddPrefectModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrefect} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Murid:</label>
                <select
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Jawatan Pengawas:</label>
                <select
                  value={newJawatan}
                  onChange={e => setNewJawatan(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="Ketua Pengawas">Ketua Pengawas</option>
                  <option value="Penolong Ketua Pengawas 1">Penolong Ketua Pengawas 1</option>
                  <option value="Penolong Ketua Pengawas 2">Penolong Ketua Pengawas 2</option>
                  <option value="Setiausaha">Setiausaha</option>
                  <option value="Bendahari">Bendahari</option>
                  <option value="Exco Disiplin">Exco Disiplin</option>
                  <option value="Exco Perhimpunan">Exco Perhimpunan</option>
                  <option value="Exco Kebersihan">Exco Kebersihan</option>
                  <option value="Pengawas">Pengawas Biasa</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Skor Penilaian Prestasi Awal (%):</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newSkor}
                  onChange={e => setNewSkor(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-cyan-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Catatan Sahsiah:</label>
                <textarea
                  rows={2}
                  value={newCatatan}
                  onChange={e => setNewCatatan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddPrefectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-800 hover:bg-cyan-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Sahkan Lantikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL JADUAL BERTUGAS ================= */}
      {showAddRosterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Tetapkan Pos Jadual Bertugas</h3>
              <button onClick={() => setShowAddRosterModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoster} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Hari Bertugas:</label>
                  <select
                    value={newHari}
                    onChange={e => setNewHari(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Isnin">Isnin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Khamis">Khamis</option>
                    <option value="Jumaat">Jumaat</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Lokasi Kawasan:</label>
                  <select
                    value={newLokasi}
                    onChange={e => setNewLokasi(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Pintu Pagar Utama">Pintu Pagar Utama</option>
                    <option value="Kantin Sekolah">Kantin Sekolah</option>
                    <option value="Tapak Perhimpunan">Tapak Perhimpunan</option>
                    <option value="Rondaan Blok Akademik">Rondaan Blok Akademik</option>
                    <option value="Pusat Sumber">Pusat Sumber</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Masa Tugas:</label>
                <input
                  type="text"
                  value={newMasa}
                  onChange={e => setNewMasa(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddRosterModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Jadual
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
