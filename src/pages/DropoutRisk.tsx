import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { Student, DailyClassAttendance, FollowUpAction } from '../types';
import {
  getStudents,
  getAttendanceList,
  getFollowUps,
  addFollowUpAction
} from '../services/dataService';
import {
  evaluateAllStudentsRisk,
  StudentRiskAssessment,
  generateWhatsAppMessage,
  formatWhatsAppUrl
} from '../services/dropoutEngine';
import { generateSuratAmaranPDF } from '../services/pdfService';
import {
  AlertTriangle,
  FileDown,
  MessageCircle,
  PhoneCall,
  Home,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  Search,
  ExternalLink,
  Info,
  Edit3,
  UserCheck
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const DropoutRisk: React.FC = () => {
  const { currentUser } = useAuth();
  const { school, rules, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<DailyClassAttendance[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpAction[]>([]);
  const [riskList, setRiskList] = useState<StudentRiskAssessment[]>([]);

  // Filters
  const [filterTier, setFilterTier] = useState<string>('semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected student for Follow-up modal
  const [followUpStudent, setFollowUpStudent] = useState<StudentRiskAssessment | null>(null);
  const [actionType, setActionType] = useState<FollowUpAction['jenis']>('panggilan_telefon');
  const [actionOutcome, setActionOutcome] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Template editor modal for Surat Amaran
  const [editingAssessment, setEditingAssessment] = useState<StudentRiskAssessment | null>(null);
  const [customBodyText, setCustomBodyText] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [stList, atList, fuList] = await Promise.all([
          getStudents(),
          getAttendanceList(),
          getFollowUps()
        ]);
        setStudents(stList);
        setAttendance(atList);
        setFollowUps(fuList);

        const evaluated = evaluateAllStudentsRisk(stList, atList, rules);
        setRiskList(evaluated);
      } catch (err) {
        console.error('Ralat memuatkan enjin risiko cicir:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [rules]);

  // Filter list
  const filteredList = riskList.filter(item => {
    if (filterTier === 'berisiko' && item.riskTier === 'selamat') return false;
    if (filterTier === 'amaran3' && item.riskTier !== 'amaran3') return false;
    if (filterTier === 'amaran2' && item.riskTier !== 'amaran2') return false;
    if (filterTier === 'amaran1' && item.riskTier !== 'amaran1') return false;

    if (searchTerm) {
      const matchName = item.student.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = item.student.kelas.toLowerCase().includes(searchTerm.toLowerCase());
      const matchVillage = item.student.kampung.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchClass && !matchVillage) return false;
    }
    return true;
  });

  const countAmaran3 = riskList.filter(r => r.riskTier === 'amaran3').length;
  const countAmaran2 = riskList.filter(r => r.riskTier === 'amaran2').length;
  const countAmaran1 = riskList.filter(r => r.riskTier === 'amaran1').length;

  // Handle PDF generation & download
  const handleGeneratePDF = (assessment: StudentRiskAssessment, customText?: string) => {
    try {
      const doc = generateSuratAmaranPDF(assessment, school, customText);
      const filename = `Surat_Amaran_${assessment.riskTier.toUpperCase()}_${assessment.student.nama.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      showToast(`Surat amaran PDF bagi ${assessment.student.nama} berjaya dimuat turun!`, 'success');
      if (editingAssessment) setEditingAssessment(null);
    } catch (err) {
      showToast('Gagal menjana surat PDF.', 'error');
    }
  };

  // Handle WhatsApp messaging
  const handleOpenWhatsApp = (assessment: StudentRiskAssessment) => {
    const primaryGuardian = assessment.student.penjaga[0];
    if (!primaryGuardian || !primaryGuardian.noTel) {
      showToast('Nombor telefon penjaga tidak dijumpai.', 'error');
      return;
    }
    const message = generateWhatsAppMessage(assessment, school);
    const url = formatWhatsAppUrl(primaryGuardian.noTel, message);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast(`Mesej WhatsApp disediakan untuk dihantar ke ${primaryGuardian.noTel}.`, 'info');
  };

  // Submit follow-up action
  const handleSaveFollowUp = async () => {
    if (!followUpStudent || !actionOutcome) {
      showToast('Sila isikan hasil tindakan susulan.', 'error');
      return;
    }

    try {
      const newAction: FollowUpAction = {
        id: `fu_${Date.now()}`,
        studentId: followUpStudent.student.id,
        tarikh: new Date().toISOString().split('T')[0],
        jenis: actionType,
        pegawaiUid: currentUser?.uid || 'guru',
        namaPegawai: currentUser?.nama || 'Guru HEM',
        hasil: actionOutcome,
        status: 'selesai',
        catatan: actionNotes
      };

      const operator = currentUser || { uid: 'system', nama: 'Guru' };
      await addFollowUpAction(newAction, { uid: operator.uid, nama: operator.nama });

      setFollowUps(prev => [newAction, ...prev]);
      showToast('Tindakan susulan berjaya direkodkan dalam fail HEM!', 'success');
      setFollowUpStudent(null);
      setActionOutcome('');
      setActionNotes('');
    } catch (err) {
      showToast('Gagal menyimpan tindakan susulan.', 'error');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-rose-900 to-amber-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-800 text-amber-200 border border-amber-700">
              Enjin Intervensi & Pengesanan Awal
            </span>
            <span className="text-xs text-amber-300">
              Rujukan SOP KPM 1:3:7 (Ambang Boleh Konfigurasi)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Murid Berisiko Cicir (SOP 1:3:7)
          </h1>
          <p className="text-xs sm:text-sm text-amber-200 mt-1 max-w-2xl">
            Sistem mengesan automatik murid yang melepasi ambang hari ketidakhadiran berturut-turut untuk tindakan segera Surat Amaran dan WhatsApp ke penjaga.
          </p>
        </div>

        {/* Warning Disclaimers Note */}
        <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-700/60 text-xs text-amber-200 max-w-xs shrink-0 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Peringatan HEM:</strong> Nilai ambang lalai adalah panduan cadangan. Sila sahkan dengan pekeliling terkini KPM & prosedur PPD Kota Marudu sebelum tindakan undang-undang buang sekolah.
          </p>
        </div>
      </div>

      {/* KPI Tiers Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterTier('amaran3')}
          className="bg-white p-4 rounded-xl border border-red-300 shadow-xs cursor-pointer hover:border-red-500 transition-all bg-red-50/30"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-red-900">Amaran 3 (Kritikal)</span>
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-extrabold">
              3
            </span>
          </div>
          <div className="text-2xl font-black text-red-700">{countAmaran3}</div>
          <p className="text-[11px] text-red-800 mt-1">
            ≥ {rules.ambangRisikoCicir.amaran3HariBerturut} hari berturut-turut
          </p>
        </div>

        <div
          onClick={() => setFilterTier('amaran2')}
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-xs cursor-pointer hover:border-amber-500 transition-all bg-amber-50/30"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-900">Amaran 2 (Tinggi)</span>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-extrabold">
              2
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700">{countAmaran2}</div>
          <p className="text-[11px] text-amber-800 mt-1">
            ≥ {rules.ambangRisikoCicir.amaran2HariBerturut} hari berturut-turut
          </p>
        </div>

        <div
          onClick={() => setFilterTier('amaran1')}
          className="bg-white p-4 rounded-xl border border-blue-300 shadow-xs cursor-pointer hover:border-blue-500 transition-all bg-blue-50/30"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-900">Amaran 1 (Awal)</span>
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-extrabold">
              1
            </span>
          </div>
          <div className="text-2xl font-black text-blue-700">{countAmaran1}</div>
          <p className="text-[11px] text-blue-800 mt-1">
            ≥ {rules.ambangRisikoCicir.amaran1HariBerturut} hari berturut-turut
          </p>
        </div>

        <div
          onClick={() => setFilterTier('berisiko')}
          className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs cursor-pointer hover:border-slate-500 transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">Jumlah Perlu Tindakan</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {countAmaran3 + countAmaran2 + countAmaran1}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Semua kategori amaran</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari murid, kelas, atau kampung..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 font-semibold">Tapis Tahap:</label>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold bg-slate-50 text-slate-800"
          >
            <option value="semua">Semua Murid Termasuk Normal</option>
            <option value="berisiko">Semua Yang Berisiko Sahaja</option>
            <option value="amaran3">Amaran 3 Sahaja</option>
            <option value="amaran2">Amaran 2 Sahaja</option>
            <option value="amaran1">Amaran 1 Sahaja</option>
          </select>
        </div>
      </div>

      {/* List of Assessed Students */}
      <div className="space-y-3">
        {filteredList.map((assessment) => {
          const { student, consecutiveAbsences, riskTier, attendancePercentage, tarikhMulaTidakHadir, tarikhAkhirTidakHadir } = assessment;
          const isAtRisk = riskTier !== 'selamat';
          const primaryGuardian = student.penjaga[0] || { nama: 'Penjaga', noTel: '' };

          // Student's existing follow ups
          const studentFollowUps = followUps.filter(f => f.studentId === student.id);

          return (
            <div
              key={student.id}
              className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
                riskTier === 'amaran3'
                  ? 'border-red-300 bg-red-50/20'
                  : riskTier === 'amaran2'
                  ? 'border-amber-300 bg-amber-50/20'
                  : riskTier === 'amaran1'
                  ? 'border-blue-300 bg-blue-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info Murid */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                      riskTier === 'amaran3'
                        ? 'bg-red-600 text-white'
                        : riskTier === 'amaran2'
                        ? 'bg-amber-500 text-slate-950'
                        : riskTier === 'amaran1'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-base leading-none">{consecutiveAbsences}</span>
                    <span className="text-[9px] uppercase font-bold">Hari</span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                        {student.nama}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {student.kelas}
                      </span>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          riskTier === 'amaran3'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : riskTier === 'amaran2'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : riskTier === 'amaran1'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {assessment.riskLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      No. Murid: <strong>{student.noMurid}</strong> • Kampung: <strong>{student.kampung}</strong> ({student.jarakKm} km) • Pengangkutan: {student.caraKeSekolah}
                    </p>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                      <span>
                        Kehadiran 30 hari:{' '}
                        <strong className={attendancePercentage < 80 ? 'text-rose-600' : 'text-slate-900'}>
                          {attendancePercentage}%
                        </strong>
                      </span>
                      {tarikhMulaTidakHadir && (
                        <span>
                          Tempoh Ponteng: <strong>{tarikhMulaTidakHadir}</strong> hingga <strong>{tarikhAkhirTidakHadir}</strong>
                        </span>
                      )}
                      <span>
                        Penjaga: <strong>{primaryGuardian.nama}</strong> ({primaryGuardian.noTel})
                      </span>
                    </div>

                    {student.catatanKesihatan && (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        Catatan Kesihatan/Latar: {student.catatanKesihatan}
                      </p>
                    )}
                  </div>
                </div>

                {/* Butang Tindakan HEM */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                  {/* WhatsApp Penjaga */}
                  <button
                    onClick={() => handleOpenWhatsApp(assessment)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    title="Buka pautan WhatsApp rasmi dengan teks pra-isi"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Penjaga</span>
                  </button>

                  {/* Jana PDF Surat Amaran */}
                  <button
                    onClick={() => handleGeneratePDF(assessment)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    title="Jana surat rasmi berkepala surat SMK Salaping"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Cetak Surat PDF</span>
                  </button>

                  {/* Ubah templat surat amaran sebelum cetak */}
                  <button
                    onClick={() => {
                      setEditingAssessment(assessment);
                      setCustomBodyText('');
                    }}
                    className="p-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl"
                    title="Ubah ayat templat surat ini"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Tambah Tindakan Susulan */}
                  <button
                    onClick={() => {
                      setFollowUpStudent(assessment);
                      setActionOutcome('');
                      setActionNotes('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Rekod Susulan</span>
                  </button>
                </div>
              </div>

              {/* Rekod Susulan Yang Telah Dibuat Bagi Murid Ini */}
              {studentFollowUps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 bg-white/60 p-2.5 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Log Tindakan Susulan Terdahulu ({studentFollowUps.length}):
                  </span>
                  {studentFollowUps.map(fu => (
                    <div key={fu.id} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="font-bold text-slate-900 shrink-0">[{fu.tarikh}]</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 font-semibold text-[10px] shrink-0 uppercase">
                        {fu.jenis.replace('_', ' ')}
                      </span>
                      <span>
                        {fu.hasil} <span className="text-slate-400">({fu.namaPegawai})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <EmptyState
            title="Tiada Murid Memenuhi Kriteria"
            description="Semua murid berada dalam paras kehadiran memuaskan atau carian tidak menemui sebarang padanan."
          />
        )}
      </div>

      {/* Modal Rekod Tindakan Susulan */}
      {followUpStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Rekod Tindakan Susulan HEM
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Murid: <strong>{followUpStudent.student.nama}</strong> ({followUpStudent.student.kelas})
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Tindakan
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as FollowUpAction['jenis'])}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="panggilan_telefon">Panggilan Telefon kepada Penjaga</option>
                  <option value="lawatan_rumah">Lawatan Ziarah Cakna ke Rumah (Kampung)</option>
                  <option value="surat_dihantar">Penyerahan Surat Amaran Berdaftar</option>
                  <option value="sesi_kaunseling">Rujukan Sesi Kaunseling Berfokus GBK</option>
                  <option value="perbincangan_penjaga">Perjumpaan Ibu Bapa di Sekolah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hasil / Maklum Balas
                </label>
                <textarea
                  rows={3}
                  value={actionOutcome}
                  onChange={(e) => setActionOutcome(e.target.value)}
                  placeholder="Contoh: Berjaya bercakap dengan ibu. Murid menghadapi masalah tambang van dari Kg. Sonsogon. Dicadangkan memohon bantuan asrama."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Pilihan)
                </label>
                <input
                  type="text"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Contoh: Temu janji susulan pada 15 Oktober 2026"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
              <button
                onClick={() => setFollowUpStudent(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs"
              >
                Simpan Rekod
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Templat Surat Amaran Sebelum Cetak */}
      {editingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Ubah Suai Templat Surat Amaran
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Surat untuk <strong>{editingAssessment.student.nama}</strong> (Tahap: {editingAssessment.riskTier.toUpperCase()})
            </p>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Anda boleh memperincikan perenggan surat sebelum mencetak ke PDF berkepala surat rasmi:
              </p>
              <textarea
                rows={6}
                value={customBodyText}
                onChange={(e) => setCustomBodyText(e.target.value)}
                placeholder="Tulis kandungan surat tersuai atau biarkan kosong untuk menggunakan templat standard KPM..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingAssessment(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleGeneratePDF(editingAssessment, customBodyText || undefined)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                <span>Cetak PDF Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
