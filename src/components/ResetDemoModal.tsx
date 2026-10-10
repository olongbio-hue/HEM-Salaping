import React, { useState } from 'react';
import { resetAllToDemoData } from '../services/dataService';
import { useSchool } from '../context/SchoolContext';
import { RefreshCw, Database, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useSchool();

  if (!isOpen) return null;

  const handleReset = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        resetAllToDemoData();
        showToast('Data demo SMK Salaping berjaya dimuatkan semula!', 'success');
        onSuccess();
        onClose();
      } catch (err) {
        showToast('Ralat memuatkan semula data demo.', 'error');
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
            <Database className="w-5 h-5" />
            <span>Set Semula Data Demo Fiktif</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>PERHATIAN: DATA DEMO FIKTIF KOTA MARUDU</span>
            </div>
            <p>
              Tindakan ini akan memuatkan semula data fiktif lengkap untuk <strong>SMK Salaping</strong>:
            </p>
            <ul className="list-disc pl-5 pt-1 space-y-0.5">
              <li>8 kelas (Tingkatan 1 hingga 5, 2 aliran)</li>
              <li>~240 murid fiktif (nama etnik Rungus, Dusun, Bajau dll.)</li>
              <li>Rekod kehadiran 30 hari lepas (purata ~91%)</li>
              <li>Murid berisiko cicir (SOP 1:3:7 amaran)</li>
              <li>Kes disiplin, sesi kaunselor GBK, dan bantuan KPM</li>
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            Sebarang rekod yang telah anda tambah atau ubah secara setempat akan digantikan dengan set data demo piawai.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memuatkan Data...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Ya, Set Semula Data Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
