import React, { useState } from 'react';
import { resetAllToDemoData, clearAllDemoDataForProduction } from '../services/dataService';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Database, AlertCircle, CheckCircle2, X, Trash2, Check } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useSchool();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleClearDemoForRealData = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const operator = currentUser || { uid: 'admin_sistem', nama: 'Admin Sistem' };
        clearAllDemoDataForProduction({ uid: operator.uid, nama: operator.nama });
        showToast('Semua data demo telah dipadamkan! Pangkalan data kini bersih untuk data sekolah sebenar.', 'success');
        onSuccess();
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err) {
        showToast('Ralat mengosongkan data demo.', 'error');
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleResetToDemo = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        resetAllToDemoData();
        showToast('Data demo SMK Salaping dimuatkan semula untuk latihan.', 'info');
        onSuccess();
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err) {
        showToast('Ralat memuatkan semula data demo.', 'error');
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <Database className="w-5 h-5 text-blue-700" />
            <span>Pengurusan Data: Demo vs Data Sebenar</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pilihan 1: Kosongkan Data Demo & Sedia Data Sebenar (Disyorkan) */}
        <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Sedia Data Sebenar (Padam Semua Demo)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-[10px]">
              DISYORKAN
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Memadamkan semua rekod murid fiktif, kehadiran demo, kes disiplin demo, dan bantuan demo. Mengekalkan profil rasmi sekolah, tetapan ambang SOP, dan peranan pengguna untuk kemasukan murid sebenar.
          </p>
          <div className="pt-2">
            <button
              onClick={handleClearDemoForRealData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kosongkan Data Demo & Aktifkan Mod Data Sebenar</span>
            </button>
          </div>
        </div>

        {/* Pilihan 2: Muat Semula Data Demo (Untuk Ujian) */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Muat Semula Data Demo Latihan (Pilihan Ujian)</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Gunakan pilihan ini hanya jika anda ingin menjalankan simulasi atau latihan guru menggunakan data fiktif 240 murid SMK Salaping.
          </p>
          <div className="pt-1 flex justify-end">
            <button
              onClick={handleResetToDemo}
              disabled={loading}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-200 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Semula Demo</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
