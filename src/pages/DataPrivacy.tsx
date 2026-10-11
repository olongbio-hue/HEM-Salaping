import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Printer,
  FileText,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  Scale
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';

export const DataPrivacy: React.FC = () => {
  const { school } = useSchool();
  const { currentUser } = useAuth();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Pematuhan Perundangan & Perlindungan Data Peribadi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dasar Privasi & Notis Penggunaan Data Murid
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Selaras dengan Akta Perlindungan Data Peribadi 2010 (APDP) & Garis Panduan Keselamatan ICT KPM.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0 no-print"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Notis Penjaga</span>
        </button>
      </div>

      {/* Rangka Kerja Keselamatan & Dasar APDP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Penyulitan & Had Akses</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data sensitif seperti rekod sesi kaunseling disulitkan secara kriptografi (Web Crypto AES-GCM). No. KP murid ditopengkan secara lalai.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Prinsip Akses Keperluan</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Guru kelas hanya mengakses murid kelas sendiri. Guru disiplin menguruskan salah laku, dan GBK menguruskan pemulihan tanpa pendedahan nota rahsia.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Tempoh Pengekalan Data</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Rekod murid disimpan sepanjang persekolahan dan dianonimkan secara kekal selepas tempoh matang tamat Tingkatan 5 melalui kelulusan dua peringkat.
          </p>
        </div>
      </div>

      {/* Kandungan Notis Lengkap */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
        {/* Kepala Surat Sekolah (Untuk Cetakan) */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 gap-4">
          <div className="shrink-0">
            <SchoolLogo size="lg" className="drop-shadow-xs" />
          </div>
          <div className="text-center flex-1 space-y-1">
            <h2 className="text-base font-black text-slate-900 uppercase">
              {school.nama}
            </h2>
            <p className="text-xs text-slate-600">
              {school.alamat}, {school.poskod} {school.bandar}, {school.negeri}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              KOD SEKOLAH: {school.kodSekolah} • TEL: {school.noTelefon} • EMEL: {school.emel}
            </p>
            <div className="pt-1.5">
              <h3 className="text-sm font-black text-slate-900 uppercase underline">
                NOTIS PERLINDUNGAN & PERSETUJUAN PEMPROSESAN DATA PERIBADI MURID (APDP 2010)
              </h3>
            </div>
          </div>
          <div className="shrink-0 w-14 hidden sm:block" />
        </div>

        {/* Bahagian 1 */}
        <section className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-sm">1. Pengenalan & Komitmen Sekolah</h3>
          <p className="text-slate-600">
            Pihak pengurusan {school.nama} menghormati privasi murid dan ibu bapa/penjaga. Notis ini dikeluarkan selaras dengan peruntukan <strong>Akta Perlindungan Data Peribadi 2010 (Akta 709)</strong> bagi memaklumkan tujuan pengumpulan, penggunaan, penyimpanan, dan perlindungan data peribadi yang diproses dalam sistem aplikasi <strong>HEM Digital</strong>.
          </p>
        </section>

        {/* Bahagian 2 */}
        <section className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-sm">2. Kategori Data Peribadi Yang Dikumpul</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Maklumat Pengenalan Diri:</strong> Nama penuh, Nombor Kad Pengenalan (MyKad/MyKid), jantina, tarikh lahir, etnik/kaum, dan agama.</li>
            <li><strong>Maklumat Perhubungan & Demografi:</strong> Alamat tempat tinggal, nama kampung di daerah Kota Marudu, mod perjalanan ke sekolah, dan jarak perjalanan.</li>
            <li><strong>Maklumat Ibu Bapa / Penjaga:</strong> Nama penjaga, nombor telefon bimbit, pekerjaan, dan kategori pendapatan keluarga (B40, M40, T20).</li>
            <li><strong>Maklumat Kesihatan & Kebajikan:</strong> Status Orang Kurang Upaya (OKU), alahan, sejarah penyakit, serta rekod rawatan kecederaan di bilik sakit.</li>
            <li><strong>Rekod Akademik & Sahsiah:</strong> Log kehadiran harian ke sekolah, rekod salah laku disiplin & tindakan tatatertib mengikut piawaian SSDM, permit pergerakan asrama, serta penilaian kepimpinan pengawas.</li>
          </ul>
        </section>

        {/* Bahagian 3 */}
        <section className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-sm">3. Tujuan Pemprosesan Data Peribadi</h3>
          <p className="text-slate-600">Data peribadi murid hanya digunakan bagi tujuan rasmi pengurusan Hal Ehwal Murid seperti berikut:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Merekod dan memantau kehadiran harian murid serta melaksanakan intervensi awal risiko cicir di bawah Standard Operasi SOP 1:3:7 KPM.</li>
            <li>Menyalurkan bantuan kewangan dan kebajikan kerajaan seperti BAP, KWAPM, BKP, Rancangan Makanan Tambahan (RMT), dan SPBT.</li>
            <li>Menguruskan keselamatan, penempatan bilik, dan kebajikan murid di Asrama Desa SMK Salaping.</li>
            <li>Melaksanakan bimbingan dan kaunseling sahsiah, kerjaya, dan sokongan kesihatan mental oleh GBK bertauliah.</li>
            <li>Tindakan kecemasan perubatan dan perhubungan segera dengan pihak hospital, polis, atau bomba sekiranya berlaku kecederaan.</li>
          </ul>
        </section>

        {/* Bahagian 4 */}
        <section className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-sm">4. Golongan Yang Diberi Hak Akses (Matriks Peranan)</h3>
          <p className="text-slate-600">
            Akses kepada maklumat dalam HEM Digital dikawal ketat berasaskan Peranan Pengguna (Role-Based Access Control - RBAC):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="block text-slate-900">Pengetua & GPK HEM:</strong>
              <span>Akses keseluruhan sekolah bagi tujuan pentadbiran, keselamatan, dan keputusan tatatertib berat.</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="block text-slate-900">Guru Kelas:</strong>
              <span>Terhad kepada senarai murid di kelas yang dipertanggungjawabkan untuk rekod kehadiran dan perhubungan penjaga.</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="block text-slate-900">Guru Disiplin:</strong>
              <span>Menguruskan aduan salah laku dan rujukan lembaga disiplin sekolah.</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <strong className="block text-slate-900">Guru Bimbingan & Kaunseling (GBK):</strong>
              <span>Akses eksklusif berenkripsi terhadap catatan bimbingan sesi UBK dan saringan DASS.</span>
            </div>
          </div>
        </section>

        {/* Bahagian 5 */}
        <section className="space-y-2">
          <h3 className="font-extrabold text-slate-900 text-sm">5. Tempoh Penyimpanan & Hak Pelupusan Data</h3>
          <p className="text-slate-600">
            Rekod peribadi murid disimpan secara aktif sepanjang tempoh persekolahan. Selepas murid menamatkan persekolahan Tingkatan 5 atau berpindah, pihak sekolah mengaktifkan proses <strong>Anonimasi Data Dua Peringkat</strong> bagi memadamkan nombor pengenalan diri dan butiran peribadi secara kekal, selaras dengan prinsip arkib KPM dan pematuhan APDP.
          </p>
        </section>

        {/* Bahagian 6: Perakuan Penjaga */}
        <div className="pt-6 border-t-2 border-slate-300 space-y-4">
          <h3 className="font-black text-slate-900 text-sm uppercase">Perakuan & Persetujuan Ibu Bapa / Penjaga:</h3>
          <p className="text-xs text-slate-600 italic">
            Saya mengesahkan bahawa saya telah membaca, memahami, dan bersetuju dengan pengumpulan dan pemprosesan maklumat peribadi anak/jagaan saya untuk tujuan pengurusan persekolahan di {school.nama} seperti yang dinyatakan dalam notis ini.
          </p>

          <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-slate-900">
            <div className="space-y-10">
              <div className="border-b border-slate-400 pb-1">Tandatangan Ibu Bapa / Penjaga:</div>
              <div>
                <p>Nama Penjaga: ________________________________</p>
                <p className="mt-2">No. Kad Pengenalan: ____________________________</p>
                <p className="mt-2">Tarikh: _________________________________________</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="border-b border-slate-400 pb-1">Pengesahan Pihak Sekolah:</div>
              <div>
                <strong className="block">{school.namaGpkHem || 'GPK Hal Ehwal Murid'}</strong>
                <span className="text-slate-500 text-[11px] block">{school.nama}</span>
                <span className="text-slate-500 text-[11px] block">Tarikh: {new Date().toLocaleDateString('ms-MY')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
