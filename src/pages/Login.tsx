import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isDelimaEmail } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { getClassesList } from '../services/dataService';
import { SPECIAL_ADMIN_ACCOUNTS } from '../constants';
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
  Lock,
  Crown,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';

export const Login: React.FC = () => {
  // Tabs: 'delima' | 'pentadbir' | 'register'
  const [activeTab, setActiveTab] = useState<'delima' | 'pentadbir' | 'register'>('delima');

  // Login Form States (DELIMa)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Login Form States (Pentadbir Khas - Admin, Pengetua, GPK HEM)
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Register Form States (DELIMa Teachers)
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

  const { loginWithEmail, registerWithDelima, loginAsDemoUser } = useAuth();
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

  // Handle DELIMa Login Submission
  const handleDelimaLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!isDelimaEmail(cleanEmail)) {
      setLoginError('Akses Ditolak: Hanya e-mel rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my) sahaja dibenarkan di tab ini. Untuk Pentadbir (Admin, Pengetua, GPK HEM), sila gunakan tab "Akses Pentadbiran Khas".');
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

  // Handle Special Admin / Pengetua / GPK HEM Login Submission
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    if (!adminId.trim()) {
      setAdminError('Sila masukkan ID Pengguna atau E-mel Pentadbir Khas.');
      return;
    }

    setAdminLoading(true);
    try {
      await loginWithEmail(adminId.trim(), adminPassword);
      showToast('Selamat bertugas kepada Pentadbiran Sekolah!', 'success');
      navigate('/');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'ID Pengguna atau kata laluan tidak sah.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle Registration Submission (DELIMa)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!isDelimaEmail(cleanEmail)) {
      setRegError('Akses Disekat: Pendaftaran guru diwajibkan menggunakan akaun rasmi DELIMa KPM (@moe-dl.edu.my atau @moe.gov.my).');
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

  // Helper to quickly select a special admin account
  const handleSelectSpecialAdmin = (acc: typeof SPECIAL_ADMIN_ACCOUNTS[0]) => {
    setAdminId(acc.idPengguna);
    setAdminPassword(acc.kataLaluan);
    setActiveTab('pentadbir');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Institusi */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-2">
        <div className="flex justify-center mb-1">
          <div className="p-3 rounded-2xl bg-white shadow-xl border border-blue-100 ring-4 ring-blue-900/5">
            <SchoolLogo size="xl" className="drop-shadow-sm hover:scale-105 transition-transform" />
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Gerbang Keselamatan & Log Masuk</span>
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

      {/* Kotak Utama Pengesahan */}
      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-6 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200">
          
          {/* Tab Utama: DELIMa vs Pentadbir Khas vs Daftar Guru */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mb-5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('delima');
                setLoginError('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeTab === 'delima'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>DELIMa Guru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('pentadbir');
                setAdminError('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeTab === 'pentadbir'
                  ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                  : 'text-amber-900 hover:text-amber-950 font-bold'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>Pentadbir Khas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError('');
              }}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 text-center ${
                activeTab === 'register'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Daftar Guru</span>
            </button>
          </div>

          {/* ================= TAB 1: LOG MASUK DELIMA GURU ================= */}
          {activeTab === 'delima' && (
            <div className="space-y-4 text-xs">
              {/* Notis DELIMa */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xs shrink-0">
                    DL
                  </div>
                  <div>
                    <span className="font-extrabold block text-amber-300 text-[11px] uppercase tracking-wide">
                      Akaun Rasmi DELIMa KPM
                    </span>
                    <span className="text-[11px] text-slate-200">
                      Warga guru menggunakan e-mel <strong>@moe-dl.edu.my</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 font-bold uppercase shrink-0">
                  Guru Salaping
                </span>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{loginError}</span>
                </div>
              )}

              <form onSubmit={handleDelimaLoginSubmit} className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat E-mel DELIMa Guru (@moe-dl.edu.my)
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
                    Format: <code>g-xxxxxxxx@moe-dl.edu.my</code>
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
            </div>
          )}

          {/* ================= TAB 2: LOG MASUK PENTADBIRAN KHAS (TANPA DELIMA) ================= */}
          {activeTab === 'pentadbir' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white space-y-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-200" />
                  <span className="font-extrabold text-xs tracking-wide uppercase">
                    Akses Khas Kepimpinan Sekolah (Bypass DELIMa)
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 leading-relaxed">
                  Laluan khas terus tanpa melalui akaun DELIMa untuk <strong>Admin Sistem</strong>, <strong>Pengetua</strong>, dan <strong>GPK HEM</strong>.
                </p>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    ID Pengguna Pentadbir Khas
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="cth: admin_salaping / pengetua_salaping / gpkhem_salaping"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Kata Laluan Khas Pentadbir
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3 px-4 bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {adminLoading ? (
                    <span>Mengesahkan Akses Pentadbiran...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Log Masuk Pentadbiran Khas</span>
                    </>
                  )}
                </button>
              </form>

              {/* Kad Pilihan Pantas 3 Pentadbir Khas */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  Ketik untuk Isi ID & Log Masuk Pantas:
                </span>
                <div className="space-y-2">
                  {SPECIAL_ADMIN_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.uid}
                      onClick={() => handleSelectSpecialAdmin(acc)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50/70 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-amber-950">
                          {acc.peranan.includes('pengetua') && !acc.peranan.includes('admin_sistem') ? (
                            <Crown className="w-3.5 h-3.5 text-amber-600" />
                          ) : acc.peranan.includes('gpk_hem') && !acc.peranan.includes('admin_sistem') ? (
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{acc.nama}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: <strong className="text-slate-800">{acc.idPengguna}</strong> • Kata Laluan: <code className="text-amber-700">{acc.kataLaluan}</code>
                        </p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-white border border-slate-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        Pilih
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: DAFTAR AKAUN GURU DELIMA ================= */}
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
                <span>Pendaftaran guru terbuka untuk semua warga pendidik SMK Salaping yang memiliki e-mel DELIMa.</span>
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

        </div>
      </div>

      {/* Modal Lupa Kata Laluan */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Set Semula Kata Laluan</h3>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Sila masukkan e-mel rasmi berdaftar anda untuk menerima pautan pengesahan.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] rounded-xl border border-emerald-200">
                Pautan pengesahan telah disimulasikan. Kata laluan lalai sistem ialah <code className="font-bold">salaping123</code>.
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e-mel anda"
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
