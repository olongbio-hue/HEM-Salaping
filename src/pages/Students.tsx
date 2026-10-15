import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { Student, StudentStatus, IncomeCategory } from '../types';
import {
  getStudents,
  saveStudent,
  bulkImportStudents,
  bulkPromoteStudents,
  getClassesList,
  addAuditLog,
  anonymizeGraduatedStudents
} from '../services/dataService';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  Upload,
  Sparkles,
  Home,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  X
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { SABAH_ETHNICS } from '../constants';
import { ClassStudentBatchModal } from '../components/ClassStudentBatchModal';

export const Students: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem } = useAuth();
  const { showToast } = useSchool();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<{ id: string; nama: string; tingkatan: number }[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTingkatan, setFilterTingkatan] = useState('semua');
  const [filterKelas, setFilterKelas] = useState('semua');
  const [filterStatus, setFilterStatus] = useState<string>('aktif');
  const [filterAsrama, setFilterAsrama] = useState<string>('semua');
  const [filterIncome, setFilterIncome] = useState<string>('semua');
  const [filterEtnik, setFilterEtnik] = useState<string>('semua');

  // Sorting
  const [sortBy, setSortBy] = useState<'nama' | 'tingkatan' | 'kelas'>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Reveal IC numbers toggle (for authorized viewing)
  const [showFullIC, setShowFullIC] = useState(false);

  // Two-Stage Data Anonymization Modal (PDPA Compliance)
  const [showAnonymizeModal, setShowAnonymizeModal] = useState(false);
  const [anonymizeStep, setAnonymizeStep] = useState<1 | 2>(1);
  const [anonymizeTargetStatus, setAnonymizeTargetStatus] = useState<'tamat' | 'pindah'>('tamat');
  const [anonymizeOfficerNotes, setAnonymizeOfficerNotes] = useState('');
  const [anonymizeApproverPassword, setAnonymizeApproverPassword] = useState('');
  const [anonymizing, setAnonymizing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClassBatchModal, setShowClassBatchModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);

  const handleToggleShowFullIC = async () => {
    if (!showFullIC) {
      if (currentUser) {
        await addAuditLog(
          { uid: currentUser.uid, nama: currentUser.nama },
          'akses_sulit',
          'students',
          'all',
          'Membuka paparan No. KP penuh murid (Nyah-topeng IC)'
        );
      }
      setShowFullIC(true);
      showToast('No. KP dipaparkan sepenuhnya. Tindakan telah direkodkan dalam Log Audit Keselamatan.', 'info');
    } else {
      setShowFullIC(false);
    }
  };

  const handleExecuteAnonymize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPengetuaOrGpkHem) {
      showToast('Hanya Pengetua atau GPK HEM boleh memberi kelulusan peringkat kedua.', 'error');
      return;
    }
    if (anonymizeApproverPassword !== 'salaping123') {
      showToast('Kata laluan pengesahan pentadbir tidak sah!', 'error');
      return;
    }

    const candidateStudents = students.filter(s => s.status === anonymizeTargetStatus);
    if (candidateStudents.length === 0) {
      showToast(`Tiada rekod murid berstatus "${anonymizeTargetStatus}" untuk dianonimkan.`, 'info');
      return;
    }

    setAnonymizing(true);
    try {
      const operator = currentUser || { uid: 'admin', nama: 'Pentadbir' };
      const count = await anonymizeGraduatedStudents(
        candidateStudents.map(s => s.id),
        operator,
        `${operator.nama} (${anonymizeOfficerNotes || 'Pengesahan Pematuhan APDP'})`
      );
      showToast(`${count} rekod murid telah berjaya dianonimkan mengikut Seksyen APDP 2010.`, 'success');
      setShowAnonymizeModal(false);
      setAnonymizeStep(1);
      setAnonymizeApproverPassword('');
      setAnonymizeOfficerNotes('');
      loadStudentsList();
    } catch {
      showToast('Gagal melaksanakan proses anonimasi murid.', 'error');
    } finally {
      setAnonymizing(false);
    }
  };

  useEffect(() => {
    loadStudentsList();
  }, []);

  async function loadStudentsList() {
    try {
      setLoading(true);
      const [stList, clsList] = await Promise.all([getStudents(), getClassesList()]);
      setStudents(stList);
      setClassesList(clsList);
    } catch (err) {
      console.error('Ralat memuatkan senarai murid:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter students
  const filteredStudents = students.filter(s => {
    if (filterStatus !== 'semua' && s.status !== filterStatus) return false;
    if (filterTingkatan !== 'semua' && s.tingkatan !== Number(filterTingkatan)) return false;
    if (filterKelas !== 'semua' && s.kelas !== filterKelas) return false;
    if (filterAsrama === 'ya' && !s.penghuniAsrama) return false;
    if (filterAsrama === 'tidak' && s.penghuniAsrama) return false;
    if (filterIncome !== 'semua' && s.kategoriPendapatan !== filterIncome) return false;
    if (filterEtnik !== 'semua' && s.etnik !== filterEtnik) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.nama.toLowerCase().includes(q);
      const matchId = s.noMurid.toLowerCase().includes(q);
      const matchKp = s.noKP.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''));
      const matchKampung = s.kampung.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchKp && !matchKampung) return false;
    }

    return true;
  });

  // Sort
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'nama') comp = a.nama.localeCompare(b.nama);
    if (sortBy === 'tingkatan') comp = a.tingkatan - b.tingkatan;
    if (sortBy === 'kelas') comp = a.kelas.localeCompare(b.kelas);
    return sortOrder === 'asc' ? comp : -comp;
  });

  // Paginate
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage) || 1;
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Masked IC Helper
  const formatIC = (ic: string) => {
    if (showFullIC) return ic;
    // Format: 080512-12-****
    const parts = ic.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-****`;
    }
    return ic.slice(0, 8) + '****';
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No Murid',
      'Nama Penuh',
      'No KP',
      'Jantina',
      'Tingkatan',
      'Kelas',
      'Etnik',
      'Agama',
      'Kampung',
      'Cara Ke Sekolah',
      'Jarak KM',
      'Status',
      'Asrama',
      'Pendapatan',
      'Nama Penjaga',
      'No Tel Penjaga'
    ];

    const rows = sortedStudents.map(s => [
      `"${s.noMurid}"`,
      `"${s.nama}"`,
      `"${s.noKP}"`,
      `"${s.jantina}"`,
      s.tingkatan,
      `"${s.kelas}"`,
      `"${s.etnik}"`,
      `"${s.agama}"`,
      `"${s.kampung}"`,
      `"${s.caraKeSekolah}"`,
      s.jarakKm,
      `"${s.status}"`,
      s.penghuniAsrama ? 'Ya' : 'Tidak',
      `"${s.kategoriPendapatan}"`,
      `"${s.penjaga[0]?.nama || ''}"`,
      `"${s.penjaga[0]?.noTel || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Senarai_Murid_SMK_Salaping_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Senarai murid berjaya dieksport ke CSV.', 'success');
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              Pangkalan Data Murid
            </span>
            <span className="text-xs text-slate-500">
              Jumlah: <strong>{students.length}</strong> murid berdaftar
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Pengurusan Profil & Enrolmen Murid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Carian pantas, profil komprehensif, import CSV, dan proses naik tingkatan
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowClassBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors"
            title="Daftar senarai nama keseluruhan murid bagi sesebuah kelas melalui muat naik fail Excel (idMe KPM), CSV atau teks"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Upload Senarai Sekelas</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Individu</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            title="Eksport data murid ke fail CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Eksport CSV</span>
          </button>

          {isPengetuaOrGpkHem && (
            <>
              <button
                onClick={() => setShowPromotionModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-amber-700" />
                <span>Naik Tingkatan</span>
              </button>

              <button
                onClick={() => setShowAnonymizeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition-colors"
                title="Pematuhan APDP: Padam/Anonimkan data murid tamat atau berpindah dengan kelulusan dua peringkat"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Anonimkan Murid Tamat</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Search Input & Quick Reveal IC */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari murid ikut nama, No. Murid, No. KP, atau kampung..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-600 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Reveal Masked IC Toggle with Audit */}
            <button
              onClick={handleToggleShowFullIC}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                showFullIC
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Paparan No. KP penuh atau bertopeng (Pematuhan APDP 2010)"
            >
              {showFullIC ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showFullIC ? 'Topengkan No. KP' : 'Papar No. KP Penuh'}</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tingkatan</label>
            <select
              value={filterTingkatan}
              onChange={(e) => {
                setFilterTingkatan(e.target.value);
                setFilterKelas('semua');
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua</option>
              <option value="1">Tingkatan 1</option>
              <option value="2">Tingkatan 2</option>
              <option value="3">Tingkatan 3</option>
              <option value="4">Tingkatan 4</option>
              <option value="5">Tingkatan 5</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Kelas</label>
            <select
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua Kelas</option>
              {classesList.map(c => (
                <option key={c.id} value={c.nama}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Status Murid</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="pindah">Pindah Sekolah</option>
              <option value="berhenti">Berhenti / Cicir</option>
              <option value="tamat">Tamat Persekolahan</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Asrama</label>
            <select
              value={filterAsrama}
              onChange={(e) => {
                setFilterAsrama(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua</option>
              <option value="ya">Penghuni Asrama</option>
              <option value="tidak">Harian (Ulang-alik)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Pendapatan</label>
            <select
              value={filterIncome}
              onChange={(e) => {
                setFilterIncome(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua</option>
              <option value="B40">B40 (Bantuan)</option>
              <option value="M40">M40</option>
              <option value="T20">T20</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Etnik Sabah</label>
            <select
              value={filterEtnik}
              onChange={(e) => {
                setFilterEtnik(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-slate-800"
            >
              <option value="semua">Semua Etnik</option>
              {SABAH_ETHNICS.map(et => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Menunjukkan {paginatedStudents.length} daripada {sortedStudents.length} murid yang sepadan</span>
          <div className="flex items-center gap-2">
            <span>Susun:</span>
            <button
              onClick={() => {
                setSortBy('nama');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center gap-1 font-bold text-slate-800"
            >
              <span>Nama</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">No. Murid</th>
                <th className="p-3">Nama Murid</th>
                <th className="p-3">No. KP (MyKad)</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Etnik / Jantina</th>
                <th className="p-3">Kampung & Jarak</th>
                <th className="p-3">Asrama / Kategori</th>
                <th className="p-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/murid/${s.id}`)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono font-semibold text-slate-600">
                    {s.noMurid}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{s.nama}</div>
                    <div className="text-[11px] text-slate-400">
                      Penjaga: {s.penjaga[0]?.nama || '-'} ({s.penjaga[0]?.noTel || '-'})
                    </div>
                  </td>
                  <td className="p-3 font-mono text-slate-700">
                    {formatIC(s.noKP)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {s.kelas}
                    </span>
                  </td>
                  <td className="p-3">
                    <div>{s.etnik}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{s.jantina}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{s.kampung}</div>
                    <div className="text-[11px] text-slate-400">
                      {s.jarakKm} km • {s.caraKeSekolah.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {s.penghuniAsrama && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Asrama
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {s.kategoriPendapatan}
                      </span>
                      {s.oku.status && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          OKU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/murid/${s.id}`);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline px-2 py-1"
                    >
                      Profil Penuh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
              <UserPlus className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-extrabold text-slate-900">
                Pangkalan Data Murid Masih Kosong
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Data demo telah dikosongkan untuk persediaan data sebenar. Anda boleh mendaftarkan murid secara pukal mengikut kelas, secara individu, atau mengimport fail CSV dari Sistem Pengurusan Murid (idMe KPM / MOEIS).
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowClassBatchModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Upload Senarai Sekelas</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar Individu</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import CSV / idMe</span>
              </button>
            </div>
          </div>
        ) : paginatedStudents.length === 0 ? (
          <EmptyState
            title="Tiada Murid Dijumpai"
            description="Tiada rekod murid yang sepadan dengan kriteria carian atau tapisan semasa."
            actionText="Set Semula Tapisan"
            onAction={() => {
              setSearchTerm('');
              setFilterTingkatan('semua');
              setFilterKelas('semua');
              setFilterStatus('semua');
              setFilterAsrama('semua');
              setFilterIncome('semua');
              setFilterEtnik('semua');
            }}
          />
        ) : null}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Halaman {currentPage} daripada {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-bold ${
                      currentPage === pageNum
                        ? 'bg-blue-700 text-white'
                        : 'border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Daftar Senarai Murid Mengikut Kelas (Pukal Sekelas) */}
      <ClassStudentBatchModal
        isOpen={showClassBatchModal}
        classesList={classesList}
        existingStudents={students}
        initialClass={filterKelas !== 'semua' ? filterKelas : undefined}
        onClose={() => setShowClassBatchModal(false)}
        onSuccess={() => {
          setShowClassBatchModal(false);
          loadStudentsList();
        }}
      />

      {/* Modal Tambah Murid */}
      {showAddModal && (
        <StudentAddModal
          classesList={classesList}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStudentsList();
          }}
        />
      )}

      {/* Modal Import CSV */}
      {showImportModal && (
        <StudentImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadStudentsList();
          }}
        />
      )}

      {/* Modal Naik Tingkatan (Year End Wizard) */}
      {showPromotionModal && (
        <StudentPromotionWizardModal
          students={students}
          classesList={classesList}
          onClose={() => setShowPromotionModal(false)}
          onSuccess={() => {
            setShowPromotionModal(false);
            loadStudentsList();
          }}
        />
      )}

      {/* Modal Anonimasi Murid Tamat (Dua Peringkat - PDPA) */}
      {showAnonymizeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Proses Anonimasi Data Murid (Pematuhan APDP 2010)
                  </h3>
                  <p className="text-[11px] text-slate-500">Kelulusan Dua Peringkat (Peringkat {anonymizeStep} daripada 2)</p>
                </div>
              </div>
              <button onClick={() => setShowAnonymizeModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {anonymizeStep === 1 ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <strong>Peringkat 1: Pengenalpastian & Cadangan Rekod</strong>
                  <p className="text-[11px] leading-relaxed">
                    Sistem akan memadamkan maklumat peribadi yang boleh dikenal pasti (PII: No. KP, No Tel Penjaga, Alamat Kampung) bagi murid yang telah tamat atau berpindah sekolah, bagi mematuhi prinsip penyimpanan data minimum Akta Perlindungan Data Peribadi 2010.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Status Rekod Sasaran:</label>
                  <select
                    value={anonymizeTargetStatus}
                    onChange={e => setAnonymizeTargetStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                  >
                    <option value="tamat">Murid Berstatus "Tamat" (Alumni Tingkatan 5)</option>
                    <option value="pindah">Murid Berstatus "Pindah" (Telah Bertukar Sekolah)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-slate-600">Jumlah Rekod Murid Terlibat:</span>
                  <span className="text-base font-black text-rose-700">
                    {students.filter(s => s.status === anonymizeTargetStatus).length} Murid
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan Pegawai Pemohon (Guru Data / SU HEM):</label>
                  <textarea
                    rows={2}
                    placeholder="cth: Pembersihan data kohort SPM 2025 selepas tamat tempoh simpanan fail..."
                    value={anonymizeOfficerNotes}
                    onChange={e => setAnonymizeOfficerNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAnonymizeModal(false)}
                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (students.filter(s => s.status === anonymizeTargetStatus).length === 0) {
                        showToast(`Tiada murid berstatus "${anonymizeTargetStatus}" ditemui.`, 'info');
                        return;
                      }
                      setAnonymizeStep(2);
                    }}
                    className="px-4 py-2 bg-blue-700 text-white rounded-xl font-bold"
                  >
                    Seterusnya: Pengesahan Pentadbir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteAnonymize} className="space-y-4 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Lock className="w-4 h-4 text-rose-700" />
                    <span>Peringkat 2: Pengesahan Rasmi Pengetua / GPK HEM</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Tindakan ini adalah KEKAL dan tidak boleh diundur. Semua No. KP dan butiran peribadi bagi {students.filter(s => s.status === anonymizeTargetStatus).length} murid akan digantikan dengan pengecam anonim.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pegawai Pengesah:</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.nama || 'Pengetua / GPK HEM'}
                    className="w-full bg-slate-100 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Masukkan Kata Laluan Pentadbir (salaping123):
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Kata laluan keselamatan pentadbir"
                    value={anonymizeApproverPassword}
                    onChange={e => setAnonymizeApproverPassword(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAnonymizeStep(1)}
                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-xl font-bold"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={anonymizing}
                    className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    {anonymizing ? 'Memproses Anonimasi...' : 'Sahkan & Anonimkan Data KEKAL'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ================= MODAL TAMBAH MURID BAHARU =================
const StudentAddModal: React.FC<{
  classesList: { id: string; nama: string; tingkatan: number }[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ classesList, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showToast } = useSchool();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [nama, setNama] = useState('');
  const [noKP, setNoKP] = useState('');
  const [jantina, setJantina] = useState<'lelaki' | 'perempuan'>('lelaki');
  const [tingkatan, setTingkatan] = useState(1);
  const [kelas, setKelas] = useState(classesList[0]?.nama || '1 Arif');
  const [etnik, setEtnik] = useState('Rungus');
  const [agama, setAgama] = useState('Kristian');
  const [kampung, setKampung] = useState('Kg. Salaping');
  const [alamat, setAlamat] = useState('Kg. Salaping, 89108 Kota Marudu, Sabah');
  const [caraKeSekolah, setCaraKeSekolah] = useState<Student['caraKeSekolah']>('jalan_kaki');
  const [jarakKm, setJarakKm] = useState(3);
  const [kategoriPendapatan, setKategoriPendapatan] = useState<IncomeCategory>('B40');
  const [penghuniAsrama, setPenghuniAsrama] = useState(false);
  const [namaPenjaga, setNamaPenjaga] = useState('');
  const [telPenjaga, setTelPenjaga] = useState('01');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const cleanKp = noKP.trim();
      const birthYear2 = cleanKp.slice(0, 2);
      const birthYear = Number(birthYear2) > 40 ? 1900 + Number(birthYear2) : 2000 + Number(birthYear2);
      const birthMonth = cleanKp.slice(2, 4) || '01';
      const birthDay = cleanKp.slice(4, 6) || '01';

      const newStudent: Student = {
        id: `stu_${Date.now()}`,
        noMurid: `SMKS2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        nama: nama.trim(),
        noKP: cleanKp,
        jantina,
        tarikhLahir: `${birthYear}-${birthMonth}-${birthDay}`,
        tingkatan: Number(tingkatan),
        kelas,
        tahunMasuk: 2026,
        etnik,
        agama,
        kampung,
        alamat,
        caraKeSekolah,
        jarakKm: Number(jarakKm),
        status: 'aktif',
        penjaga: [
          {
            nama: namaPenjaga || 'Penjaga Murid',
            hubungan: 'penjaga',
            noTel: telPenjaga,
            pekerjaan: kategoriPendapatan === 'B40' ? 'Petani' : 'Pekerja Swasta'
          }
        ],
        oku: { status: false },
        kategoriPendapatan,
        penghuniAsrama,
        dicipta: new Date().toISOString(),
        dikemaskini: new Date().toISOString()
      };

      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      await saveStudent(newStudent, { uid: operator.uid, nama: operator.nama }, true);
      showToast(`Murid baharu ${newStudent.nama} berjaya didaftarkan!`, 'success');
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ralat menambah murid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <UserPlus className="w-5 h-5 text-blue-700" />
            <span>Pendaftaran Murid Baharu</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Penuh Murid *</label>
              <input
                type="text"
                required
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Contoh: Averlyn Anak Moduying"
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">No. KP / MyKad (12 Digit) *</label>
              <input
                type="text"
                required
                value={noKP}
                onChange={e => setNoKP(e.target.value)}
                placeholder="Contoh: 110412-12-5432"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tingkatan</label>
              <select
                value={tingkatan}
                onChange={e => setTingkatan(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                {[1, 2, 3, 4, 5].map(t => (
                  <option key={t} value={t}>Tingkatan {t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kelas</label>
              <select
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.nama}>{c.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jantina</label>
              <select
                value={jantina}
                onChange={e => setJantina(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                <option value="lelaki">Lelaki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Etnik Sabah</label>
              <select
                value={etnik}
                onChange={e => setEtnik(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                {SABAH_ETHNICS.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Kampung (Kota Marudu)</label>
              <input
                type="text"
                value={kampung}
                onChange={e => setKampung(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Jarak ke Sekolah (KM)</label>
              <input
                type="number"
                value={jarakKm}
                onChange={e => setJarakKm(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Penjaga Utama</label>
              <input
                type="text"
                required
                value={namaPenjaga}
                onChange={e => setNamaPenjaga(e.target.value)}
                placeholder="Nama Bapa / Ibu / Penjaga"
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">No. Telefon Penjaga (WhatsApp)</label>
              <input
                type="text"
                required
                value={telPenjaga}
                onChange={e => setTelPenjaga(e.target.value)}
                placeholder="Contoh: 019-8765432"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="asramaChk"
              checked={penghuniAsrama}
              onChange={e => setPenghuniAsrama(e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="asramaChk" className="text-slate-800 font-medium">
              Murid ini mendaftar sebagai penghuni Asrama Desa SMK Salaping
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-700 text-white font-bold rounded-lg shadow-xs hover:bg-blue-800"
            >
              {loading ? 'Mendaftar...' : 'Daftar Murid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ================= MODAL IMPORT CSV MURID =================
const StudentImportModal: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showToast } = useSchool();
  const [csvText, setCsvText] = useState('');
  const [previewStudents, setPreviewStudents] = useState<Partial<Student>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const sampleCsv = `NoKP,Nama,Jantina,Tingkatan,Kelas,Kampung,Etnik,TelPenjaga
120512-12-1111,Calvin Anak Majanil,lelaki,1,1 Arif,Kg. Salaping,Rungus,019-8123456
120719-12-2222,Felicia Binti Rusli,perempuan,1,1 Bestari,Kg. Tandek,Bajau,019-8234567
110304-12-3333,Evander Gindol,lelaki,2,2 Arif,Kg. Goshen,Dusun,019-8345678`;

  const handleParse = () => {
    setErrors([]);
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      setErrors(['Sila masukkan data CSV yang mengandungi sekurang-kurangnya 1 baris rekod murid.']);
      return;
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsed: Partial<Student>[] = [];
    const validationErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));

      if (cols.length < 5) {
        validationErrors.push(`Baris ${i + 1}: Data tidak mencukupi (minimum NoKP, Nama, Jantina, Tingkatan, Kelas diperlukan).`);
        continue;
      }

      const noKP = cols[0];
      const nama = cols[1];
      const jantina = (cols[2].toLowerCase() === 'perempuan' ? 'perempuan' : 'lelaki') as 'lelaki' | 'perempuan';
      const tingkatan = Number(cols[3]) || 1;
      const kelas = cols[4] || '1 Arif';
      const kampung = cols[5] || 'Kg. Salaping';
      const etnik = cols[6] || 'Rungus';
      const telPenjaga = cols[7] || '019-0000000';

      parsed.push({
        id: `stu_import_${Date.now()}_${i}`,
        noMurid: `SMKS2026-IMP${String(i).padStart(3, '0')}`,
        noKP,
        nama,
        jantina,
        tingkatan,
        kelas,
        tahunMasuk: 2026,
        etnik,
        agama: 'Kristian',
        kampung,
        alamat: `${kampung}, 89108 Kota Marudu, Sabah`,
        caraKeSekolah: 'jalan_kaki',
        jarakKm: 4,
        status: 'aktif',
        penjaga: [{ nama: `Penjaga ${nama}`, hubungan: 'penjaga', noTel: telPenjaga, pekerjaan: 'B40' }],
        oku: { status: false },
        kategoriPendapatan: 'B40',
        penghuniAsrama: false,
        dicipta: new Date().toISOString(),
        dikemaskini: new Date().toISOString()
      });
    }

    setPreviewStudents(parsed);
    setErrors(validationErrors);
  };

  const handleImportConfirm = async () => {
    if (previewStudents.length === 0) return;
    setLoading(true);
    try {
      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      const importedCount = await bulkImportStudents(previewStudents as Student[], {
        uid: operator.uid,
        nama: operator.nama
      });
      showToast(`${importedCount} murid berjaya diimport ke dalam sistem!`, 'success');
      onSuccess();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Ralat import data.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Upload className="w-5 h-5 text-blue-700" />
            <span>Import Data Murid Melalui CSV</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 py-3 text-xs">
          <p className="text-slate-600">
            Tampal data format CSV di bawah atau salin contoh format yang disediakan:
          </p>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Teks CSV:</span>
            <button
              onClick={() => setCsvText(sampleCsv)}
              className="text-blue-700 font-semibold hover:underline"
            >
              Gunakan Contoh Data
            </button>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="NoKP,Nama,Jantina,Tingkatan,Kelas,Kampung,Etnik,TelPenjaga..."
            className="w-full border border-slate-300 rounded-lg p-2.5 font-mono text-[11px]"
          />

          <button
            onClick={handleParse}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900"
          >
            Semak & Pratonton Data
          </button>

          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-700">
              <span className="font-bold block">Ralat Dikesan:</span>
              {errors.map((e, idx) => (
                <p key={idx}>• {e}</p>
              ))}
            </div>
          )}

          {previewStudents.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Pratonton Murid Sah ({previewStudents.length} murid):</span>
                <span className="text-emerald-700">Sedia Diimport</span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {previewStudents.map((s, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{s.nama}</span>
                      <span className="text-slate-500 ml-2">({s.noKP})</span>
                    </div>
                    <span className="font-semibold text-blue-700">{s.kelas}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleImportConfirm}
            disabled={previewStudents.length === 0 || loading}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-40"
          >
            {loading ? 'Mengimport...' : `Sahkan Import (${previewStudents.length} Murid)`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ================= MODAL WIZARD NAIK TINGKATAN / PINDAH KELAS =================
const StudentPromotionWizardModal: React.FC<{
  students: Student[];
  classesList: { id: string; nama: string; tingkatan: number }[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ students, classesList, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showToast } = useSchool();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedForm, setSelectedForm] = useState(1);
  const [targetClass, setTargetClass] = useState('2 Arif');
  const [loading, setLoading] = useState(false);

  const candidates = students.filter(s => s.tingkatan === selectedForm && s.status === 'aktif');

  const handlePromote = async () => {
    setLoading(true);
    try {
      const targetTingkatan = Math.min(selectedForm + 1, 5);
      const isGraduating = selectedForm === 5;

      const updates = candidates.map(s => ({
        id: s.id,
        tingkatan: isGraduating ? 5 : targetTingkatan,
        kelas: isGraduating ? 'Alumni / Tamat' : targetClass,
        status: (isGraduating ? 'tamat' : 'aktif') as StudentStatus
      }));

      const operator = currentUser || { uid: 'system', nama: 'GPK HEM' };
      await bulkPromoteStudents(updates, { uid: operator.uid, nama: operator.nama });

      showToast(`Proses naik tingkatan bagi ${updates.length} orang murid Tingkatan ${selectedForm} selesai!`, 'success');
      onSuccess();
    } catch (err) {
      showToast('Gagal memproses kenaikan tingkatan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>Wizard Naik Tingkatan Hujung Tahun</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs">
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
            <strong>Langkah Akhir Sesi:</strong> Modul ini menaikkan tingkatan murid secara pukal (Contoh: Tingkatan 1 ke Tingkatan 2, atau Tingkatan 5 ke status Tamat).
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pilih Tingkatan Asal</label>
              <select
                value={selectedForm}
                onChange={e => setSelectedForm(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold"
              >
                <option value={1}>Tingkatan 1</option>
                <option value={2}>Tingkatan 2</option>
                <option value={3}>Tingkatan 3</option>
                <option value={4}>Tingkatan 4</option>
                <option value={5}>Tingkatan 5 (Tamat Persekolahan)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {selectedForm === 5 ? 'Status Akhir' : 'Kelas Sasaran Baharu'}
              </label>
              {selectedForm === 5 ? (
                <div className="p-2 bg-slate-100 rounded-lg font-bold text-slate-700">
                  Tamat SPM (Alumni)
                </div>
              ) : (
                <select
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {classesList
                    .filter(c => c.tingkatan === selectedForm + 1)
                    .map(c => (
                      <option key={c.id} value={c.nama}>{c.nama}</option>
                    ))}
                </select>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-800">
              Jumlah Murid Terlibat: {candidates.length} orang
            </span>
            <p className="text-slate-500 mt-0.5">
              Semua murid aktif dalam Tingkatan {selectedForm} akan dipindahkan ke{' '}
              {selectedForm === 5 ? 'Status Tamat' : `Tingkatan ${selectedForm + 1} (${targetClass})`}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handlePromote}
            disabled={candidates.length === 0 || loading}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
          >
            {loading ? 'Memproses...' : `Sahkan Naikkan ${candidates.length} Murid`}
          </button>
        </div>
      </div>
    </div>
  );
};
