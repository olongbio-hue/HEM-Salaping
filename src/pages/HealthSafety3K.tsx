import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import {
  SickBayRecord,
  Inspection3KRecord,
  EmergencyContact,
  FireDrillRecord,
  Student
} from '../types';
import {
  getSickBayRecords,
  saveSickBayRecord,
  get3KInspections,
  save3KInspection,
  getEmergencyContacts,
  saveEmergencyContact,
  getFireDrillRecords,
  saveFireDrillRecord,
  getStudents
} from '../services/dataService';
import { DEFAULT_3K_AREAS } from '../constants';
import {
  HeartPulse,
  ShieldCheck,
  PhoneCall,
  Flame,
  AlertCircle,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Hospital,
  Phone,
  Printer,
  X,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const HealthSafety3K: React.FC = () => {
  const { currentUser, isPengetuaOrGpkHem } = useAuth();
  const { school, showToast } = useSchool();

  const [loading, setLoading] = useState(true);
  const [sickBay, setSickBay] = useState<SickBayRecord[]>([]);
  const [inspections3K, setInspections3K] = useState<Inspection3KRecord[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [fireDrills, setFireDrills] = useState<FireDrillRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [activeTab, setActiveTab] = useState<'bilik_sakit' | 'audit_3k' | 'kecemasan' | 'kebakaran' | 'keperluan_khas'>('bilik_sakit');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddSickModal, setShowAddSickModal] = useState(false);
  const [showAdd3KModal, setShowAdd3KModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddDrillModal, setShowAddDrillModal] = useState(false);

  // Form states
  const [sbStudentId, setSbStudentId] = useState('');
  const [sbSimptom, setSbSimptom] = useState('');
  const [sbTindakan, setSbTindakan] = useState('');
  const [sbHospital, setSbHospital] = useState(false);
  const [sbHospitalName, setSbHospitalName] = useState('Hospital Kota Marudu');

  const [auditKawasan, setAuditKawasan] = useState(DEFAULT_3K_AREAS[0]);
  const [auditAspek, setAuditAspek] = useState<Inspection3KRecord['aspek']>('kebersihan');
  const [auditSkor, setAuditSkor] = useState(90);
  const [auditCatatan, setAuditCatatan] = useState('');

  const [contactAgensi, setContactAgensi] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [contactAlamat, setContactAlamat] = useState('');
  const [contactKat, setContactKat] = useState<EmergencyContact['kategori']>('hospital');

  const [drillTarikh, setDrillTarikh] = useState(new Date().toISOString().split('T')[0]);
  const [drillMinit, setDrillMinit] = useState(4);
  const [drillPeserta, setDrillPeserta] = useState(240);
  const [drillAgensi, setDrillAgensi] = useState('Balai Bomba & Penyelamat Kota Marudu');
  const [drillUlasan, setDrillUlasan] = useState('Pengosongan bangunan pantas dan mematuhi pelan laluan kecemasan.');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [sbList, inspList, ctList, fdList, stList] = await Promise.all([
        getSickBayRecords(),
        get3KInspections(),
        getEmergencyContacts(),
        getFireDrillRecords(),
        getStudents()
      ]);
      setSickBay(sbList);
      setInspections3K(inspList);
      setContacts(ctList);
      setFireDrills(fdList);
      setStudents(stList);
      if (stList.length > 0) setSbStudentId(stList[0].id);
    } catch (err) {
      console.error('Ralat memuatkan 3K:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Add Sick Bay
  const handleSaveSickBay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbStudentId || !sbSimptom) return;
    try {
      const operator = currentUser || { uid: 'guru', nama: 'Guru Bertugas' };
      const newRec: SickBayRecord = {
        id: `sb_${Date.now()}`,
        studentId: sbStudentId,
        tarikh: new Date().toISOString().split('T')[0],
        masaMasuk: '09:30 AM',
        simptom: sbSimptom,
        tindakan: sbTindakan || 'Berehat di katil bilik sakit dan diberikan rawatan kecemasan.',
        dihantarHospital: sbHospital,
        namaKlinikHospital: sbHospital ? sbHospitalName : undefined,
        penjagaDimaklumkan: true,
        namaGuruBertugas: operator.nama
      };
      await saveSickBayRecord(newRec, operator, true);
      setSickBay(prev => [newRec, ...prev]);
      setShowAddSickModal(false);
      setSbSimptom('');
      setSbTindakan('');
      showToast('Rekod bilik kesihatan berjaya disimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan rekod bilik sakit.', 'error');
    }
  };

  // Handle Add 3K
  const handleSave3K = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operator = currentUser || { uid: '3k', nama: 'Penyelaras 3K' };
      const status: Inspection3KRecord['status'] =
        auditSkor >= 85 ? 'cemerlang' : auditSkor >= 70 ? 'memuaskan' : 'perlu_tindakan';

      const newRec: Inspection3KRecord = {
        id: `3k_${Date.now()}`,
        tarikh: new Date().toISOString().split('T')[0],
        kawasan: auditKawasan,
        aspek: auditAspek,
        skor: Number(auditSkor),
        status,
        catatan: auditCatatan || 'Pemeriksaan fizikal berkala mematuhi instrumen kebersihan & keselamatan KPM.',
        pemeriksa: operator.nama
      };
      await save3KInspection(newRec, operator);
      setInspections3K(prev => [newRec, ...prev]);
      setShowAdd3KModal(false);
      setAuditCatatan('');
      showToast('Rekod audit 3K kawasan berjaya disimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan rekod 3K.', 'error');
    }
  };

  // Handle Add Contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactAgensi || !contactTel) return;
    try {
      const operator = currentUser || { uid: 'admin', nama: 'Admin' };
      const newCt: EmergencyContact = {
        id: `emg_${Date.now()}`,
        agensi: contactAgensi,
        noTel: contactTel,
        alamat: contactAlamat || 'Kota Marudu, Sabah',
        kategori: contactKat
      };
      await saveEmergencyContact(newCt, operator);
      setContacts(prev => [...prev, newCt]);
      setShowAddContactModal(false);
      setContactAgensi('');
      setContactTel('');
      showToast('Talian kecemasan baharu berjaya disimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan talian kecemasan.', 'error');
    }
  };

  // Handle Add Fire Drill
  const handleSaveDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const operator = currentUser || { uid: '3k', nama: 'Penyelaras Keselamatan' };
      const newDrill: FireDrillRecord = {
        id: `drill_${Date.now()}`,
        tarikh: drillTarikh,
        masaMula: '08:30 AM',
        tempohEvakuasiMinit: Number(drillMinit),
        jumlahPeserta: Number(drillPeserta),
        agensiTerlibat: drillAgensi,
        penilaian: Number(drillMinit) <= 4 ? 'Cemerlang (Kurang 4 Minit)' : 'Memuaskan',
        catatanPenambahbaikan: drillUlasan
      };
      await saveFireDrillRecord(newDrill, operator);
      setFireDrills(prev => [newDrill, ...prev]);
      setShowAddDrillModal(false);
      showToast('Rekod latihan pengosongan bangunan berjaya disimpan.', 'success');
    } catch (err) {
      showToast('Gagal menyimpan rekod latihan kebakaran.', 'error');
    }
  };

  // Filtered Students with special medical needs (Asthma, allergy, OKU)
  const specialNeedsStudents = students.filter(
    s => s.catatanKesihatan || s.oku?.status
  );

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              Unit Kesihatan, Keselamatan & Kebersihan (3K)
            </span>
            <span className="text-xs text-slate-500">HEM Fasa 3 • SMK Salaping</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Kesihatan, Keselamatan & 3K
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log bilik sakit, penarafan audit 3K kawasan, talian kecemasan komuniti, dan latihan kebakaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowAddSickModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Kemasukan Bilik Sakit</span>
          </button>

          <button
            onClick={() => setShowAdd3KModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Audit 3K Kawasan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Kemasukan Bilik Sakit</span>
          <div className="text-2xl font-black text-rose-800 mt-1">{sickBay.length} Kes</div>
          <p className="text-[10px] text-slate-500 mt-1">
            {sickBay.filter(s => s.dihantarHospital).length} kes dirujuk klinik/hospital
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Purata Skor 3K Sekolah</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {inspections3K.length > 0
              ? (inspections3K.reduce((a, b) => a + b.skor, 0) / inspections3K.length).toFixed(0)
              : 88}
            %
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Tahap Kebersihan Cemerlang</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Murid Keperluan Khas/Kesihatan</span>
          <div className="text-2xl font-black text-purple-900 mt-1">{specialNeedsStudents.length} Murid</div>
          <p className="text-[10px] text-slate-500 mt-1">Asma, alahan makanan & OKU</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Rekod Latihan Kebakaran</span>
          <div className="text-2xl font-black text-amber-800 mt-1">{fireDrills.length} Sesi</div>
          <p className="text-[10px] text-slate-500 mt-1">BBP Kota Marudu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('bilik_sakit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'bilik_sakit' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Bilik Sakit & Rawatan ({sickBay.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_3k')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'audit_3k' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit 3K Kawasan Sekolah ({inspections3K.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kecemasan')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'kecemasan' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Pelan Kecemasan & Talian Penting ({contacts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kebakaran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'kebakaran' ? 'bg-amber-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Simulasi Kebakaran ({fireDrills.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('keperluan_khas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'keperluan_khas' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Murid Keperluan Khas ({specialNeedsStudents.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: BILIK SAKIT ================= */}
      {activeTab === 'bilik_sakit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Buku Rekod Bilik Kesihatan / Sakit</h3>
              <p className="text-xs text-slate-500">Merekod simptom, rawatan awal, dan status makluman ibu bapa</p>
            </div>
            <button
              onClick={() => setShowAddSickModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Daftar Kes Sakit</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Murid</th>
                  <th className="p-3">Tarikh / Masa</th>
                  <th className="p-3">Simptom / Aduan</th>
                  <th className="p-3">Tindakan / Rawatan</th>
                  <th className="p-3">Rujukan Luar</th>
                  <th className="p-3">Penjaga Dimaklumkan</th>
                  <th className="p-3">Guru Bertugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sickBay.map(sb => {
                  const stu = students.find(s => s.id === sb.studentId);
                  return (
                    <tr key={sb.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        <div>{stu?.nama || 'Murid'}</div>
                        <div className="text-[11px] text-slate-500 font-normal">Tingkatan {stu?.kelas}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {sb.tarikh} ({sb.masaMasuk})
                      </td>
                      <td className="p-3 text-slate-700 max-w-xs">{sb.simptom}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{sb.tindakan}</td>
                      <td className="p-3">
                        {sb.dihantarHospital ? (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-rose-100 text-rose-800">
                            {sb.namaKlinikHospital || 'Hospital Kota Marudu'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rehat Bilik Sakit</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dimaklumkan</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{sb.namaGuruBertugas}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: AUDIT 3K KAWASAN ================= */}
      {activeTab === 'audit_3k' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inspections3K.map(insp => (
              <div key={insp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2 border-b pb-2">
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{insp.kawasan}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${
                      insp.status === 'cemerlang'
                        ? 'bg-emerald-100 text-emerald-800'
                        : insp.status === 'memuaskan'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {insp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 capitalize">Aspek: {insp.aspek}</span>
                  <span className="text-base font-black text-emerald-800">{insp.skor}%</span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{insp.catatan}</p>

                <div className="text-[10px] text-slate-400 pt-2 border-t flex justify-between">
                  <span>Pemeriksa: {insp.pemeriksa}</span>
                  <span>{insp.tarikh}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PELAN KECEMASAN & TALIAN PENTING ================= */}
      {activeTab === 'kecemasan' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <strong className="block text-sm font-bold">Direktori Talian Kecemasan SMK Salaping</strong>
                <p className="text-slate-600 mt-0.5">Senarai nombor talian kecemasan boleh dicetak untuk dilekatkan di setiap fail kelas dan papan kenyataan blok.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-xl font-bold shadow-xs hover:bg-blue-50"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembaran</span>
              </button>
              <button
                onClick={() => setShowAddContactModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 text-white rounded-xl font-bold shadow-xs hover:bg-blue-800"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Talian</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map(ct => (
              <div key={ct.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                  <Hospital className="w-4 h-4 text-rose-600" />
                  <span>{ct.agensi}</span>
                </div>

                <div className="flex items-center gap-2 text-base font-black text-slate-900 font-mono py-1">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{ct.noTel}</span>
                </div>

                <div className="text-slate-500 text-[11px]">
                  <span className="font-semibold text-slate-700">Alamat:</span> {ct.alamat}
                </div>
                {ct.pegawaiHubungan && (
                  <div className="text-[10px] text-blue-700 bg-blue-50 p-1.5 rounded">
                    Unit: {ct.pegawaiHubungan}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: LATIHAN KEBAKARAN ================= */}
      {activeTab === 'kebakaran' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Rekod Latihan Pengosongan Bangunan & Simulasi Kebakaran</h3>
                <p className="text-xs text-slate-500">Pematuhan Piawaian Keselamatan Kebakaran Sekolah KPM & Jabatan Bomba</p>
              </div>
              <button
                onClick={() => setShowAddDrillModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Rekod Latihan Baharu</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {fireDrills.map(fd => (
                <div key={fd.id} className="p-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Latihan Pengosongan Bangunan ({fd.tarikh})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800">
                      {fd.penilaian}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-slate-600 text-[11px] pt-1">
                    <div>
                      <strong>Masa Evakuasi:</strong> {fd.tempohEvakuasiMinit} Minit
                    </div>
                    <div>
                      <strong>Jumlah Murid/Guru:</strong> {fd.jumlahPeserta} Orang
                    </div>
                    <div>
                      <strong>Agensi Terlibat:</strong> {fd.agensiTerlibat}
                    </div>
                  </div>

                  <p className="text-slate-700 text-[11px] leading-relaxed pt-1">
                    <strong>Ulasan Pegawai Bomba:</strong> {fd.catatanPenambahbaikan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: KEPERLUAN KHAS ================= */}
      {activeTab === 'keperluan_khas' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3 text-xs text-purple-900">
            <AlertCircle className="w-5 h-5 text-purple-700 shrink-0" />
            <div>
              <strong className="block text-sm font-bold">Maklumat Sulit Kesihatan Khas Murid</strong>
              <p className="text-slate-600 mt-0.5">
                Senarai ini bertujuan untuk tindakan pantas guru kelas, guru bertugas dan warden sekiranya berlaku kecemasan (alahan teruk, asma kronik, atau murid OKU).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Nama Murid</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Status OKU</th>
                  <th className="p-3">Catatan Kesihatan / Alahan</th>
                  <th className="p-3">Tindakan Kecemasan Disyorkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {specialNeedsStudents.map(stu => (
                  <tr key={stu.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{stu.nama}</td>
                    <td className="p-3 font-semibold text-slate-600">{stu.kelas}</td>
                    <td className="p-3">
                      {stu.oku?.status ? (
                        <span className="px-2 py-0.5 rounded font-black text-[10px] bg-purple-100 text-purple-800">
                          OKU: {stu.oku.jenis || 'Fizikal'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Bukan OKU</span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-rose-800">{stu.catatanKesihatan || 'Tiada alahan direkod'}</td>
                    <td className="p-3 text-slate-600">
                      Sedia ubat inhaler / elakkan makanan berunsur kekacang & hubungi penjaga serta-merta.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL BILIK SAKIT ================= */}
      {showAddSickModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Daftar Kemasukan Bilik Kesihatan</h3>
              <button onClick={() => setShowAddSickModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSickBay} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Murid:</label>
                <select
                  value={sbStudentId}
                  onChange={e => setSbStudentId(e.target.value)}
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
                <label className="font-bold text-slate-800 block mb-1">Simptom / Gejala Sakit:</label>
                <textarea
                  rows={2}
                  required
                  value={sbSimptom}
                  onChange={e => setSbSimptom(e.target.value)}
                  placeholder="Contoh: Demam panas, cirit-birit, pening kepala, gastrik..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Tindakan Rawatan Diberikan:</label>
                <textarea
                  rows={2}
                  value={sbTindakan}
                  onChange={e => setSbTindakan(e.target.value)}
                  placeholder="Contoh: Berehat di katil bilik sakit, tuaman ais, ubat paracetamol..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sbHospital}
                    onChange={e => setSbHospital(e.target.checked)}
                  />
                  <span>Perlu Dihantar ke Klinik / Hospital?</span>
                </label>

                {sbHospital && (
                  <input
                    type="text"
                    value={sbHospitalName}
                    onChange={e => setSbHospitalName(e.target.value)}
                    className="w-full border border-rose-300 rounded-lg p-2 text-rose-900 font-bold"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddSickModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Rekod
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL AUDIT 3K ================= */}
      {showAdd3KModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Rekod Audit Kebersihan & 3K Kawasan</h3>
              <button onClick={() => setShowAdd3KModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave3K} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih Kawasan Sekolah:</label>
                <select
                  value={auditKawasan}
                  onChange={e => setAuditKawasan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {DEFAULT_3K_AREAS.map(a => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Aspek Dinilai:</label>
                  <select
                    value={auditAspek}
                    onChange={e => setAuditAspek(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="kebersihan">Kebersihan</option>
                    <option value="kesihatan">Kesihatan</option>
                    <option value="keselamatan">Keselamatan</option>
                    <option value="keseluruhan">Keseluruhan 3K</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Skor (0 - 100%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={auditSkor}
                    onChange={e => setAuditSkor(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Catatan & Penemuan Audit:</label>
                <textarea
                  rows={2}
                  value={auditCatatan}
                  onChange={e => setAuditCatatan(e.target.value)}
                  placeholder="Contoh: Tandas bersih, bekalan sabun lengkap, pili air berfungsi..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdd3KModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Audit 3K
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH TALIAN KECEMASAN ================= */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Tambah Talian Kecemasan Baharu</h3>
              <button onClick={() => setShowAddContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Nama Agensi / Pusat Rawatan:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Balai Polis Tandek..."
                  value={contactAgensi}
                  onChange={e => setContactAgensi(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Nombor Telefon (Kecemasan):</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 088-661xxx..."
                  value={contactTel}
                  onChange={e => setContactTel(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Alamat / Lokasi:</label>
                <input
                  type="text"
                  value={contactAlamat}
                  onChange={e => setContactAlamat(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Talian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL LATIHAN KEBAKARAN ================= */}
      {showAddDrillModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Rekod Simulasi Pengosongan Bangunan</h3>
              <button onClick={() => setShowAddDrillModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrill} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tarikh Latihan:</label>
                  <input
                    type="date"
                    value={drillTarikh}
                    onChange={e => setDrillTarikh(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Masa Pengosongan (Minit):</label>
                  <input
                    type="number"
                    value={drillMinit}
                    onChange={e => setDrillMinit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Agensi Kolaborasi:</label>
                <input
                  type="text"
                  value={drillAgensi}
                  onChange={e => setDrillAgensi(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Ulasan & Refleksi Pegawai Bomba:</label>
                <textarea
                  rows={2}
                  value={drillUlasan}
                  onChange={e => setDrillUlasan(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDrillModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Simpan Latihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
