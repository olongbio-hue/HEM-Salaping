import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { DEMO_USERS } from '../constants';
import { Building2, KeyRound, Mail, LogIn, Sparkles, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { loginWithEmail, loginAsDemoUser } = useAuth();
  const { school, showToast } = useSchool();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      showToast('Selamat kembali ke HEM Digital SMK Salaping!', 'success');
      navigate('/');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'E-mel atau kata laluan tidak tepat.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (uid: string) => {
    loginAsDemoUser(uid);
    showToast('Log masuk pengguna demo berjaya.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-amber-400 shadow-xl border-2 border-blue-950 mb-3">
          <Building2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          HEM Digital
        </h1>
        <p className="mt-1 text-sm text-slate-600 font-medium">
          {school.nama} ({school.kodSekolah}) • Kota Marudu, Sabah
        </p>
        <p className="text-xs text-slate-500 italic mt-0.5">
          "{school.motoSekolah}"
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xl rounded-2xl border border-slate-200">
          <div className="mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Log Masuk Warga Sekolah</h2>
              <p className="text-xs text-slate-500">Sistem Pengurusan Hal Ehwal Murid</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
              DATA DEMO AKTIF
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat E-mel Rasmi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: gpkhem@smksalaping.edu.my"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Laluan
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  Lupa kata laluan?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Mengesahkan...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log Masuk</span>
                </>
              )}
            </button>
          </form>

          {/* Bahagian Log Masuk Pantas Pengguna Demo */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Log Masuk Pantas Persona Demo:</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Kata laluan demo untuk semua akaun ialah <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono font-bold text-slate-800">salaping123</code>. Ketik mana-mana persona di bawah untuk terus masuk:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.uid}
                  type="button"
                  onClick={() => handleQuickDemoLogin(user.uid)}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <p className="text-[11px] font-bold text-slate-900 group-hover:text-blue-900 truncate">
                    {user.jawatan}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{user.nama}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lupa Kata Laluan */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Set Semula Kata Laluan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan e-mel rasmi berdaftar untuk menerima arahan pautan penetapan semula.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 mb-3">
                Pautan penetapan semula telah dihantar ke e-mel anda (Simulasi: kata laluan demo ialah <code className="font-bold">salaping123</code>).
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="e-mel anda@smksalaping.edu.my"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-hidden"
                />
                <button
                  onClick={() => setForgotSuccess(true)}
                  className="w-full py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800"
                >
                  Hantar Pautan
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
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
