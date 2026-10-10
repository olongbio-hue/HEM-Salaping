import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import { BullyingReport, BullyingCategory, BullyingUrgency } from '../types';
import { saveBullyingReport } from '../services/dataService';
import {
  ShieldAlert,
  Send,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Info,
  HelpCircle
} from 'lucide-react';

export const PublicBullyingReport: React.FC = () => {
  const { school, showToast } = useSchool();
  const navigate = useNavigate();

  const [aduanAnonim, setAduanAnonim] = useState(true);
  const [namaPelapor, setNamaPelapor] = useState('');
  const [hubunganPelapor, setHubunganPelapor] = useState<BullyingReport['hubunganPelapor']>('murid');
  const [noTelPelapor, setNoTelPelapor] = useState('');

  const [mangsaNama, setMangsaNama] = useState('');
  const [mangsaKelas, setMangsaKelas] = useState('');
  const [kategoriBuli, setKategoriBuli] = useState<BullyingCategory>('fizikal');
  const [tahapSegera, setTahapSegera] = useState<BullyingUrgency>('sederhana');
  const [pihakTerlibat, setPihakTerlibat] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mangsaNama || !keterangan) {
      showToast('Sila isikan nama mangsa dan keterangan kejadian.', 'error');
      return;
    }

    setLoading(true);
    try {
      const generatedRef = `BULI/SMKS/2026/${String(Math.floor(Math.random() * 900) + 100)}`;
      const today = new Date().toISOString().split('T')[0];

      // Tarikh semakan wajib (7 hari dari sekarang)
      const reviewDateObj = new Date();
      reviewDateObj.setDate(reviewDateObj.getDate() + 7);
      const tarikhSemakSemulaWajib = reviewDateObj.toISOString().split('T')[0];

      const newReport: BullyingReport = {
        id: `buli_${Date.now()}`,
        noAduan: generatedRef,
        tarikhAduan: today,
        kategoriBuli,
        tahapSegera,
        aduanAnonim,
        namaPelapor: aduanAnonim ? undefined : (namaPelapor || undefined),
        hubunganPelapor,
        noTelPelapor: aduanAnonim ? undefined : (noTelPelapor || undefined),
        mangsaNama: mangsaNama.trim(),
        mangsaKelas: mangsaKelas.trim() || 'Tidak Pasti',
        pihakTerlibat: pihakTerlibat.trim() || 'Sedang Dikenalpasti',
        lokasi: lokasi.trim() || 'Kawasan Sekolah',
        keterangan: keterangan.trim(),
        status: 'baru',
        tarikhSemakSemulaWajib,
        tarikhKemaskini: today
      };

      await saveBullyingReport(newReport, undefined, true);
      setSubmittedRef(generatedRef);
      showToast('Aduan buli telah berjaya dihantar ke pihak pengurusan HEM.', 'success');
    } catch (err) {
      showToast('Gagal menghantar aduan. Sila cuba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal</span>
          </button>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
            Saluran Rahsia & Selamat
          </span>
        </div>

        {/* Title Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-rose-700 text-white flex items-center justify-center font-bold shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Saluran Aduan Buli & Perlindungan Kanak-Kanak
              </h1>
              <p className="text-xs text-slate-500">
                {school.nama} ({school.kodSekolah}) • Kota Marudu, Sabah
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            Pihak sekolah komited terhadap <strong>Dasar Perlindungan Kanak-Kanak (CPP) KPM</strong> dan sifar toleransi terhadap sebarang salah laku buli, gangguan, atau penderaan. Setiap aduan disiasat secara rahsia oleh Jawatankuasa HEM & Kaunselor.
          </p>
        </div>

        {submittedRef ? (
          <div className="bg-white p-8 rounded-2xl border border-emerald-300 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Aduan Berjaya Diterima</h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block">
              <span className="text-xs text-slate-500 block">Nombor Rujukan Aduan Anda:</span>
              <strong className="text-lg font-mono text-blue-900">{submittedRef}</strong>
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Terima kasih atas keprihatinan anda. Pasukan Petugas Disiplin dan Kaunselor SMK Salaping telah menerima aduan ini dan tindakan siasatan segera akan dimulakan mengikut Prosedur Operasi Standard KPM.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSubmittedRef(null);
                  setKeterangan('');
                  setMangsaNama('');
                }}
                className="px-5 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-800"
              >
                Hantar Aduan Lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-5 text-xs">
            {/* Bahagian 1: Identiti Pelapor */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">1. Maklumat Pelapor</span>
                <div className="flex items-center gap-2">
                  <label htmlFor="chkAnon" className="font-semibold text-rose-700 cursor-pointer">
                    Hantar Tanpa Nama (Anonim)
                  </label>
                  <input
                    type="checkbox"
                    id="chkAnon"
                    checked={aduanAnonim}
                    onChange={e => setAduanAnonim(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                </div>
              </div>

              {aduanAnonim ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2 text-[11px]">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Identiti anda <strong>TIDAK AKAN DIREKODKAN</strong>. Maklumat anda kekal 100% terlindung dan selamat.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Anda</label>
                    <input
                      type="text"
                      value={namaPelapor}
                      onChange={e => setNamaPelapor(e.target.value)}
                      placeholder="Nama penuh anda"
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hubungan</label>
                    <select
                      value={hubunganPelapor}
                      onChange={e => setHubunganPelapor(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      <option value="murid">Murid SMK Salaping</option>
                      <option value="ibu_bapa">Ibu Bapa / Penjaga</option>
                      <option value="guru">Guru / Staf Sekolah</option>
                      <option value="orang_awam">Orang Awam / Komuniti</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">No. Telefon (Untuk Tindakan)</label>
                    <input
                      type="text"
                      value={noTelPelapor}
                      onChange={e => setNoTelPelapor(e.target.value)}
                      placeholder="Contoh: 019-8765432"
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bahagian 2: Mangsa & Kejadian */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <span className="font-extrabold text-sm text-slate-900 block">2. Butiran Mangsa & Pelaku</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Mangsa *</label>
                  <input
                    type="text"
                    required
                    value={mangsaNama}
                    onChange={e => setMangsaNama(e.target.value)}
                    placeholder="Nama murid yang dibuli / dianiaya"
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tingkatan / Kelas Mangsa (Jika tahu)</label>
                  <input
                    type="text"
                    value={mangsaKelas}
                    onChange={e => setMangsaKelas(e.target.value)}
                    placeholder="Contoh: 2 Arif / Tingkatan 3"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pihak / Individu Terlibat (Pelaku)</label>
                <input
                  type="text"
                  value={pihakTerlibat}
                  onChange={e => setPihakTerlibat(e.target.value)}
                  placeholder="Nama murid yang membuli, panggilan, atau ciri-ciri mereka"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Bahagian 3: Jenis Buli & Keterangan */}
            <div className="space-y-3">
              <span className="font-extrabold text-sm text-slate-900 block">3. Perincian Kejadian Buli</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Buli *</label>
                  <select
                    value={kategoriBuli}
                    onChange={e => setKategoriBuli(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="fizikal">Buli Fizikal (Pukul, Tolak, Peras Ugut)</option>
                    <option value="lisan">Buli Lisan (Ejek, Hina, Mengugut)</option>
                    <option value="sosial">Buli Sosial (Pulau, Sebar Khabar Angin)</option>
                    <option value="siber">Buli Siber (Aib di WhatsApp/TikTok/IG)</option>
                    <option value="seksual">Gangguan Seksual / Sentuhan Tidak Rela</option>
                    <option value="lain">Lain-lain Bentuk Buli</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tahap Kesegeraan *</label>
                  <select
                    value={tahapSegera}
                    onChange={e => setTahapSegera(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="rendah">Rendah (Peringatan & Nasihat)</option>
                    <option value="sederhana">Sederhana (Perlu Siasatan)</option>
                    <option value="tinggi">Tinggi (Kesan Emosi Ketara)</option>
                    <option value="kritikal_segera">Kritikal / Segera (Kecederaan / Ugutan Bahaya)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Kejadian</label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={e => setLokasi(e.target.value)}
                    placeholder="Contoh: Tandas Blok B / Asrama Desa"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Keterangan Kejadian * (Apakah yang berlaku?)
                </label>
                <textarea
                  rows={4}
                  required
                  value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  placeholder="Sila nyatakan kronologi kejadian, masa, apa yang berlaku, dan kesan kepada mangsa..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Menghantar Aduan...' : 'Hantar Aduan Buli Sekarang'}</span>
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Aduan anda dilindungi di bawah kerahsiaan Jawatankuasa Pengurusan Murid SMK Salaping.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
