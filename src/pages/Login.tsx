import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isDelimaEmail } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { getClassesList } from '../services/dataService';
import { UserRole, ClassInfo } from '../types';
import {
  Building2,
  KeyRound,
  Mail,
  LogIn,
  UserPlus,
  Shield,
  AlertCircle,
  CheckCircle2,
  Phone,
  UserCheck,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('guru_kelas');
  const [regClass, setRegClass] = useState<string>('1-arif');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // School Classes List for Registration
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);

  // Password Reset Simulation
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { loginWithEmail, registerWithDelima, loginAsDemoUser, allUsers } = useAuth();
  const { school, showToast } = useSchool();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const cls = await getClassesList();
        setClassesList(cls);
        if (cls.length > 0) setRegClass(cls[0].id);
      } catch (err) {
        console.error('Ralat memuatkan senarai kelas:', err);
      }
    }
    loadData();
  }, []);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!isDelimaEmail(cleanEmail) && cleanEmail !== 'admin@smksalaping.edu.my') {
      setLoginError('Akses Ditolak: Hanya e-mel rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my) sahaja dibenarkan.');
      return;
    }

    setLoginLoading(true);
    try {
      await loginWithEmail(cleanEmail, loginPassword);
      showToast('Selamat kembali ke HEM Digital SMK Salaping!', 'success');
      navigate('/');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'E-mel atau kata laluan tidak tepat.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!isDelimaEmail(cleanEmail)) {
      setRegError('Akses Disekat: Pendaftaran diwajibkan menggunakan akaun rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my). E-mel peribadi (@gmail, @yahoo) tidak dibenarkan.');
      return;
    }

    if (!regName.trim()) {
      setRegError('Sila masukkan nama penuh guru mengikut rekod perkhidmatan.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Kata laluan dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    setRegLoading(true);
    try {
      const selectedClassObj = classesList.find(c => c.id === regClass);
      const roles: UserRole[] = [regRole];
      if (regRole === 'guru_kelas' && !roles.includes('guru_biasa')) {
        roles.push('guru_biasa');
      }

      await registerWithDelima({
        nama: regName.trim(),
        emel: cleanEmail,
        kataLaluan: regPassword,
        jawatan: regRole === 'guru_kelas' 
          ? `Guru Kelas ${selectedClassObj?.nama || ''}` 
          : regRole === 'guru_disiplin' 
          ? 'Guru Disiplin Sekolah'
          : regRole === 'gbk'
          ? 'Guru Bimbingan & Kaunseling (GBK)'
          : regRole === 'warden'
          ? 'Warden Asrama Desa'
          : regRole === 'penyelaras_biasiswa'
          ? 'Penyelaras Kebajikan & Biasiswa'
          : 'Guru Akademik',
        peranan: roles,
        kelasDiajar: regRole === 'guru_kelas' && regClass ? [regClass] : [],
        telefon: regPhone.trim()
      });

      showToast(`Pendaftaran akaun DELIMa (${cleanEmail}) berjaya! Anda telah dilog masuk ke sistem.`, 'success');
      navigate('/');
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Gagal mendaftar akaun.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickDemoLogin = (uid: string) => {
    loginAsDemoUser(uid);
    showToast('Log masuk akaun DELIMa berjaya.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Institusi */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-2">
        <div className="flex justify-center mb-1">
          <div className="p-3 rounded-2xl bg-white shadow-xl border border-blue-100 ring-4 ring-blue-900/5">
            <SchoolLogo size="xl" className="drop-shadow-sm hover:scale-105 transition-transform" />
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Pengesahan DELIMa KPM</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            HEM Digital
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-bold">
            {school.nama} ({school.kodSekolah}) • Kota Marudu, Sabah
          </p>
          <p className="text-[11px] text-slate-500 italic">
            "{school.motoSekolah}"
          </p>
        </div>
      </div>

      {/* Kotak Utama Pengesahan DELIMa */}
      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-6 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200">
          
          {/* Notis Khas DELIMa KPM */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xs shrink-0">
                DL
              </div>
              <div>
                <span className="font-extrabold block text-amber-300 text-[11px] uppercase tracking-wide">
                  E-Mel Rasmi DELIMa Sahaja
                </span>
                <span className="text-[11px] text-slate-200">
                  Dihadkan kepada domain <strong>@moe-dl.edu.my</strong> & <strong>@moe.gov.my</strong>
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 font-bold uppercase shrink-0">
              KPM SSO
            </span>
          </div>

          {/* Tab Pilihan: Log Masuk vs Daftar Akaun Guru */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 text-blue-700" />
              <span>Log Masuk DELIMa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Daftar Guru Baharu</span>
            </button>
          </div>

          {/* ================= TAB 1: LOG MASUK DELIMA ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat E-mel DELIMa KPM Guru
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="g-12345678@moe-dl.edu.my"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Contoh: <code>g-12345678@moe-dl.edu.my</code> atau <code>nama@moe.gov.my</code>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Kata Laluan
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800"
                  >
                    Lupa kata laluan?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loginLoading ? (
                  <span>Mengesahkan Identiti DELIMa...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log Masuk Menggunakan DELIMa</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= TAB 2: DAFTAR AKAUN GURU DELIMA ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              {regError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{regError}</span>
                </div>
              )}

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Pendaftaran terbuka untuk semua warga pendidik SMK Salaping yang memiliki e-mel DELIMa.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Penuh Guru
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Cikgu Suzana Binti Majanil"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat E-mel DELIMa KPM Guru
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="g-12345678@moe-dl.edu.my"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Wajib menggunakan domain <strong>@moe-dl.edu.my</strong> atau <strong>@moe.gov.my</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jawatan / Peranan Utama
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="guru_kelas">Guru Kelas</option>
                    <option value="guru_disiplin">Guru Disiplin</option>
                    <option value="gbk">Guru Kaunseling (GBK)</option>
                    <option value="warden">Warden Asrama</option>
                    <option value="penyelaras_biasiswa">Penyelaras Biasiswa</option>
                    <option value="guru_biasa">Guru Mata Pelajaran</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Telefon (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="019-8765432"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Jika peranan Guru Kelas, pilih kelas yang dipertanggungjawabkan */}
              {regRole === 'guru_kelas' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <label className="block font-bold text-blue-950 mb-1">
                    Pilih Kelas Dipertanggungjawabkan:
                  </label>
                  <select
                    value={regClass}
                    onChange={(e) => setRegClass(e.target.value)}
                    className="w-full p-2 text-xs border border-blue-300 rounded-lg bg-white font-bold text-slate-900"
                  >
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nama} (Tingkatan {c.tingkatan})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-blue-800 mt-1 block">
                    Guru kelas ini akan mempunyai hak penuh merekod e-kehadiran harian bagi kelas berkenaan.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Laluan
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 6 aksara"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sahkan Kata Laluan
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulang kata laluan"
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {regLoading ? (
                  <span>Mendaftarkan Guru...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Akaun DELIMa Baharu</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= BAHAGIAN AKAUN RASMI PENTADBIR DELIMA ================= */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Akaun Pentadbir DELIMa Salaping:</span>
              </div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                {allUsers.length} Pendidik Berdaftar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Akaun Pentadbir Utama (DELIMa) boleh digunakan untuk konfigurasi sekolah dan pengurusan peranan:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  admin.salaping@moe-dl.edu.my
                </p>
                <p className="text-[10px] text-slate-500">
                  Pentadbir Utama Sistem HEM • Kata Laluan: <code className="font-bold text-blue-700">salaping123</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin.salaping@moe-dl.edu.my');
                  setLoginPassword('salaping123');
                  setActiveTab('login');
                }}
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-xl font-bold text-[11px] transition-colors shrink-0"
              >
                Pilih Akaun
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lupa Kata Laluan */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Set Semula Kata Laluan DELIMa</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sistem HEM diselaraskan mengikut garis panduan keselamatan KPM. Sila masukkan e-mel rasmi DELIMa berdaftar anda.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] rounded-xl border border-emerald-200">
                Pautan pengesahan telah disimulasikan untuk e-mel DELIMa anda. Kata laluan lalai sistem ialah <code className="font-bold">salaping123</code>.
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="g-xxxxxxxx@moe-dl.edu.my"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-hidden"
                />
                <button
                  onClick={() => setForgotSuccess(true)}
                  className="w-full py-2 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950 transition-colors"
                >
                  Hantar Pautan
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
