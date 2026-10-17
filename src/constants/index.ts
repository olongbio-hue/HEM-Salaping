import { SchoolSettings, RulesSettings, UserRole, DashboardSettings } from '../types';

export const ROLE_LABELS: Record<UserRole, { title: string; short: string; color: string; desc: string }> = {
  pengetua: {
    title: 'Pengetua',
    short: 'PGR',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    desc: 'Pemantauan menyeluruh dan kelulusan eksekutif sekolah'
  },
  gpk_hem: {
    title: 'GPK Hal Ehwal Murid',
    short: 'GPK HEM',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
    desc: 'Pengurusan penuh dan pemantauan kebajikan & disiplin murid'
  },
  ketua_guru_disiplin: {
    title: 'Ketua Guru Disiplin',
    short: 'KGD',
    color: 'bg-red-100 text-red-900 border-red-300',
    desc: 'Pengurusan kes disiplin sekolah dan jawatankuasa disiplin'
  },
  guru_disiplin: {
    title: 'Guru Disiplin',
    short: 'GD',
    color: 'bg-rose-100 text-rose-900 border-rose-300',
    desc: 'Perekodan dan tindakan kes salah laku disiplin'
  },
  gbk: {
    title: 'Guru Bimbingan & Kaunseling',
    short: 'GBK',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    desc: 'Sesi kaunseling beretika, bimbingan psikososial dan intervensi'
  },
  guru_kelas: {
    title: 'Guru Kelas',
    short: 'GK',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    desc: 'Perekodan kehadiran harian murid kelas dan profil murid kelas'
  },
  warden: {
    title: 'Warden Asrama',
    short: 'Warden',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: 'Pengurusan penghuni asrama desa, permit balik dan kebajikan asrama'
  },
  penyelaras_biasiswa: {
    title: 'Penyelaras Biasiswa & Bantuan',
    short: 'P. Bantuan',
    color: 'bg-teal-100 text-teal-900 border-teal-300',
    desc: 'Pengurusan BAP, BKP, KWAPM, EMK dan bantuan kewangan'
  },
  penyelaras_pengawas: {
    title: 'Penyelaras Badan Pengawas',
    short: 'P. Pengawas',
    color: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    desc: 'Pengawasan disiplin murid dan tugas pengawas sekolah'
  },
  setiausaha_hem: {
    title: 'Setiausaha HEM',
    short: 'SU HEM',
    color: 'bg-sky-100 text-sky-900 border-sky-300',
    desc: 'Penyelarasan dokumentasi minit mesyuarat dan laporan HEM'
  },
  guru_biasa: {
    title: 'Guru Akademik / Biasa',
    short: 'Guru',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Melihat profil asas dan membuat rujukan kes kepada HEM'
  },
  admin_sistem: {
    title: 'Admin Sistem',
    short: 'Admin',
    color: 'bg-violet-100 text-violet-900 border-violet-300',
    desc: 'Pengurusan pengguna, tetapan sekolah, audit log dan sistem'
  }
};

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  nama: 'SMK Salaping',
  kodSekolah: 'XEA5002',
  alamat: 'Peti Surat 188, W.D.T. 25, Jalan Tandek - Salaping',
  poskod: '89108',
  bandar: 'Kota Marudu',
  negeri: 'Sabah',
  noTelefon: '088-661234',
  emel: 'smksalaping.hem@moe.gov.my',
  logo: '/logo.png',
  namaPengetua: '',
  namaGpkHem: '',
  namaGpk1: '',
  namaGpkKoko: '',
  namaKetuaDisiplin: '',
  namaGbk: '',
  namaKetuaWarden: '',
  namaPenyelarasBiasiswa: '',
  namaPenyelarasPengawas: '',
  namaGuruData: '',
  tahunSemasa: 2026,
  sesi: 'Pagi',
  warnaUtama: '#1e3a8a', // Biru Tua Rasmi KPM
  warnaAksen: '#d97706', // Emas/Kuning Warisan Sabah
  motoSekolah: 'Ilmuan Gemilang',
  modulAsramaAktif: true // Fasa 3: Kawalan aktif/mati modul asrama
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  ucapanAwalan: 'Selamat Bertugas',
  subteksBanner: 'Portal Pengurusan Hal Ehwal Murid (HEM) Bersepadu',
  tunjukLogo: true,
  tunjukIlustrasiBanner: true,
  gambarBannerUrl: '/banner.jpg',
  lencanaBannerText: 'Kemenjadian Murid Salaping',
  tajukAspirasi: 'Aspirasi Murid Salaping • Modal Insan',
  subtajukAspirasi: 'Kepimpinan • Kejayaan Akademik • Keunggulan Sahsiah',
  tunjukMetrikModalInsan: true,
  tunjukPautanPantas: true,

  pengumumanAktif: true,
  pengumumanTajuk: 'Hebahan Pentadbiran HEM & Pengurusan Sekolah',
  pengumumanMesej: 'Sila pastikan data profil murid dan rekod kehadiran harian dikemaskini tepat pada masanya mengikut garis panduan PPD Kota Marudu.',
  pengumumanJenis: 'info',
  pengumumanTarikh: '2026-10-11',

  kpiCards: {
    enrolmen: true,
    kehadiran: true,
    ketidakhadiran: true,
    risikoCicir: true,
    disiplin: true,
    kaunseling: true,
    bantuan: true,
    asrama: true
  },

  hadSenaraiTindakanSegera: 4,
  julatHariGrafTrend: 30,
  paparPanelTindakanSegera: true,
  paparPanelMesyuarat: true,
  paparBarisPintasPantas: true,
  paparCartaTrend: true,
  paparCartaTingkatan: true,
  paparTaburanJantina: true,
  paparKelasTerendah: true,
  teksPautanPengumuman: '',
  urlPautanPengumuman: ''
};

// ================= KONSTAN FASA 3 =================
export const DEFAULT_ASSISTANCE_TYPES = [
  'Bantuan Awal Persekolahan (BAP)',
  'Kumpulan Wang Amanah Pelajar Miskin (KWAPM)',
  'Biasiswa Kecil Persekutuan (BKP)',
  'Rancangan Makanan Tambahan (RMT)',
  'Skim Pinjaman Buku Teks (SPBT)',
  'Bantuan Pakaian & Peralatan Sekolah PIBG',
  'Bantuan Zakat & Kebajikan Komuniti',
  'Biasiswa Kerajaan Negeri Sabah (BKNS)'
];

export const DEFAULT_ASSISTANCE_BUDGETS: Record<string, { kuotaMurid: number; perMurid: number; peruntukanSekolah: number; sumber?: string }> = {
  'Bantuan Awal Persekolahan (BAP)': { kuotaMurid: 240, perMurid: 150, peruntukanSekolah: 36000, sumber: 'KPM (Semua Murid Warganegara)' },
  'Kumpulan Wang Amanah Pelajar Miskin (KWAPM)': { kuotaMurid: 95, perMurid: 300, peruntukanSekolah: 28500, sumber: 'KPM (eKasih / Miskin B40)' },
  'Biasiswa Kecil Persekutuan (BKP)': { kuotaMurid: 25, perMurid: 700, peruntukanSekolah: 17500, sumber: 'Bahagian Biasiswa KPM' },
  'Rancangan Makanan Tambahan (RMT)': { kuotaMurid: 50, perMurid: 450, peruntukanSekolah: 22500, sumber: 'KPM' },
  'Skim Pinjaman Buku Teks (SPBT)': { kuotaMurid: 240, perMurid: 0, peruntukanSekolah: 0, sumber: 'Bahagian Buku Teks KPM' },
  'Bantuan Pakaian & Peralatan Sekolah PIBG': { kuotaMurid: 40, perMurid: 200, peruntukanSekolah: 8000, sumber: 'Tabung Kebajikan PIBG' },
  'Bantuan Zakat & Kebajikan Komuniti': { kuotaMurid: 20, perMurid: 250, peruntukanSekolah: 5000, sumber: 'Pusat Zakat Sabah (MUIS)' },
  'Biasiswa Kerajaan Negeri Sabah (BKNS)': { kuotaMurid: 15, perMurid: 1000, peruntukanSekolah: 15000, sumber: 'Kerajaan Negeri Sabah' }
};

export const DEFAULT_EMERGENCY_CONTACTS = [
  {
    id: 'emg_1',
    agensi: 'Hospital Kota Marudu',
    noTel: '088-661022',
    alamat: 'KM 2, Jalan Kota Marudu - Kudat, 89107 Kota Marudu, Sabah',
    pegawaiHubungan: 'Unit Kecemasan & Trauma (24 Jam)',
    kategori: 'hospital' as const
  },
  {
    id: 'emg_2',
    agensi: 'Ibu Pejabat Polis Daerah (IPD) Kota Marudu',
    noTel: '088-661222',
    alamat: 'Pekan Kota Marudu, 89108 Kota Marudu, Sabah',
    pegawaiHubungan: 'Bilik Gerakan / Pegawai Perhubungan Sekolah (PPS)',
    kategori: 'polis' as const
  },
  {
    id: 'emg_3',
    agensi: 'Balai Bomba & Penyelamat Kota Marudu',
    noTel: '088-661444',
    alamat: 'Jalan Tandek, 89108 Kota Marudu, Sabah',
    pegawaiHubungan: 'Pusat Kawalan Operasi Bomba',
    kategori: 'bomba' as const
  },
  {
    id: 'emg_4',
    agensi: 'Pejabat Pendidikan Daerah (PPD) Kota Marudu',
    noTel: '088-661350',
    alamat: 'W.D.T. 12, 89109 Kota Marudu, Sabah',
    pegawaiHubungan: 'Unit Hal Ehwal Murid (Sektor Pembangunan Murid)',
    kategori: 'ppd' as const
  },
  {
    id: 'emg_5',
    agensi: 'Klinik Kesihatan Tandek',
    noTel: '088-661155',
    alamat: 'Pekan Tandek, 89108 Kota Marudu, Sabah',
    pegawaiHubungan: 'Ketua Jururawat Kesihatan Sekolah',
    kategori: 'klinik' as const
  },
  {
    id: 'emg_6',
    agensi: 'Pejabat Kebajikan Masyarakat Daerah (JKM) Kota Marudu',
    noTel: '088-661501',
    alamat: 'Kompleks Pejabat Kerajaan Daerah Kota Marudu',
    pegawaiHubungan: 'Pegawai Pelindung Kanak-Kanak',
    kategori: 'jkm' as const
  }
];

export const DEFAULT_3K_AREAS = [
  'Blok Akademik Tingkatan 1 & 2',
  'Blok Akademik Tingkatan 3 - 5',
  'Kantin & Dapur Sekolah',
  'Tandas Murid Lelaki (Blok A)',
  'Tandas Murid Perempuan (Blok B)',
  'Tapak Perhimpunan & Dataran Kejat',
  'Padang & Gelanggang Sukan',
  'Makmal Sains & Bengkel RBT',
  'Pusat Sumber & Surau Sekolah',
  'Asrama Desa & Dewan Makan'
];

export const DEFAULT_HOSTEL_ROOMS = [
  { id: 'kamar_p1', blok: 'A (Putera)' as const, namaKamar: 'Kamar Kinabalu 1', kapasiti: 10, penghuniIds: [] as string[] },
  { id: 'kamar_p2', blok: 'A (Putera)' as const, namaKamar: 'Kamar Kinabalu 2', kapasiti: 10, penghuniIds: [] as string[] },
  { id: 'kamar_p3', blok: 'A (Putera)' as const, namaKamar: 'Kamar Trusmadi 1', kapasiti: 10, penghuniIds: [] as string[] },
  { id: 'kamar_w1', blok: 'B (Puteri)' as const, namaKamar: 'Kamar Tambuyukon 1', kapasiti: 10, penghuniIds: [] as string[] },
  { id: 'kamar_w2', blok: 'B (Puteri)' as const, namaKamar: 'Kamar Tambuyukon 2', kapasiti: 10, penghuniIds: [] as string[] },
  { id: 'kamar_w3', blok: 'B (Puteri)' as const, namaKamar: 'Kamar Meliau 1', kapasiti: 10, penghuniIds: [] as string[] }
];

export const INITIAL_RULES_SETTINGS: RulesSettings = {
  sasaranKehadiranSekolah: 90.0,
  ambangRisikoCicir: {
    amaran1HariBerturut: 3,
    amaran2HariBerturut: 10,
    amaran3HariBerturut: 20,
    amaran1PeratusTerkumpul: 85.0,
    amaran2PeratusTerkumpul: 75.0,
    amaran3PeratusTerkumpul: 65.0
  },
  kategoriKesalahan: [
    'Lewat / Ponteng Kelas',
    'Pakaian / Rambut Tidak Mematuhi Peraturan',
    'Tidak Menyiapkan Tugasan Akademik',
    'Merokok / Menggunakan Vape',
    'Buli Fizikal / Lisan / Siber',
    'Tingkah Laku Kurang Sopan & Gangguan',
    'Membawa Telefon / Gajet Tanpa Kebenaran',
    'Vandalisme & Kerosakan Harta Sekolah',
    'Membawa Barang Larangan',
    'Lain-lain Salah Laku Disiplin'
  ],
  kategoriJenayah: [
    'Kecurian Wang / Barangan Berharga',
    'Pergaduhan Mencederakan / Senjata',
    'Pemerasan / Ugutan Jenayah',
    'Penyalahgunaan Bahan Terlarang / Dadah',
    'Gangguan / Serangan Seksual',
    'Pencerobohan Kawasan Larangan'
  ],
  jenisTindakanDisiplin: [
    'Nasihat & Peringatan Lisan',
    'Amaran Bertulis (Direkodkan)',
    'Panggilan Penjaga ke Sekolah',
    'Rujukan Sesi Kaunseling Berfokus UBK',
    'Khidmat Masyarakat Sekolah',
    'Rujuk Sidang Lembaga Disiplin Sekolah',
    'Gantung Persekolahan Sementara (PGB/GPK Sahaja)',
    'Buang Sekolah (Dengan Kelulusan PPD/JPN - PGB Sahaja)',
    'Rujuk Pihak Luar (PDRM / JKM / PPD)'
  ],
  panduanLaporPihakLuar: {
    syaratPolis: 'Laporkan kepada IPD Kota Marudu (088-661222) atau Balai Polis berhampiran serta-merta bagi insiden jenayah, pemilikan senjata berbahaya, dadah, pergaduhan parah, atau pemerasan fizikal.',
    syaratJKM: 'Laporkan kepada Pegawai Pelindung Kanak-Kanak JKM Daerah Kota Marudu sekiranya terdapat unsur penderaan fizikal/emosi/seksual, pengabaian, atau murid memerlukan perintah perlindungan di bawah Akta Kanak-Kanak 2001.',
    syaratPPD: 'Laporkan ke Unit HEM PPD Kota Marudu dalam tempoh 1:3:7 jam bagi sebarang insiden berprofil tinggi, kes tular media sosial, kecederaan parah, atau kematian.'
  },
  templatSuratAmaran: {
    amaran1: `Adalah dimaklumkan bahawa anak/jagaan tuan/puan telah tidak hadir ke sekolah selama {hariBerturut} hari berturut-turut tanpa sebarang kenyataan atau surat akuan doktor dari tarikh {tarikhMula} hingga {tarikhAkhir}.

Pihak sekolah amat menitikberatkan kehadiran murid ke sekolah demi kecemerlangan masa hadapan mereka selaras dengan dasar Kementerian Pendidikan Malaysia.

Sehubungan itu, pihak sekolah memohon kerjasama tuan/puan untuk menghubungi pihak sekolah atau Guru Kelas bagi memaklumkan sebab ketidakhadiran anak/jagaan tuan/puan dalam tempoh 7 hari dari tarikh surat ini.`,
    amaran2: `Merujuk kepada surat Amaran Pertama bertarikh {tarikhAmaran1}, pihak sekolah mendapati bahawa anak/jagaan tuan/puan masih terus tidak hadir ke sekolah selama {hariBerturut} hari berturut-turut.

Ketidakhadiran berterusan ini menjejaskan pembelajaran murid dan meletakkan murid dalam kategori murid berisiko cicir.

Tuan/Puan diwajibkan hadir ke sekolah untuk berjumpa dengan Pengetua / GPK Hal Ehwal Murid bagi membincangkan perkara ini pada kadar segera. Sila hubungi pihak sekolah untuk menetapkan tarikh temu janji.`,
    amaran3: `Pihak sekolah merujuk kepada Surat Peringatan & Amaran terdahulu berkenaan ketidakhadiran berterusan anak/jagaan tuan/puan yang kini telah mencecah {hariBerturut} hari berturut-turut.

Dukacita dimaklumkan bahawa sekiranya tiada maklum balas atau kehadiran penjaga dalam tempoh 14 hari dari tarikh surat ini dikeluarkan, tindakan seterusnya mengikut prosedur tatatertib KPM termasuk rujukan buang sekolah akan diambil.

Kerjasama dan keprihatinan tuan/puan dalam perkara ini amat dihargai.`,
    panggilanPenjagaDisiplin: `Dengan hormatnya perkara di atas dirujuk.\n\n2. Dimaklumkan bahawa anak/jagaan tuan/puan didapati terlibat dalam salah laku disiplin ({kategoriKesalahan}) pada {tarikhKejadian}.\n\n3. Sehubungan dengan itu, tuan/puan diminta hadir ke SMK Salaping untuk mengadakan perbincangan tatatertib bersama pihak Jawatankuasa Disiplin Sekolah bagi membantu sahsiah murid tersebut.\n\nKerjasama pihak tuan/puan amat kami hargai demi masa depan anak jagaan tuan/puan.`,
    tindakanTatatertib: `Adalah dimaklumkan bahawa Jawatankuasa Disiplin SMK Salaping telah selesai menjalankan siasatan tatatertib, sesi pertuduhan dan bela diri, serta sesi kaunseling intervensi terhadap anak/jagaan tuan/puan berhubung kes {kategoriKesalahan}.\n\n2. Berdasarkan peruntukan Peraturan-Peraturan Pelajaran (Disiplin Sekolah) 1959, pihak sekolah memutuskan tindakan berikut: {tindakanDiambil}.\n\n3. Keputusan ini berkuat kuasa dari {tarikhKuatkuasa}. Pihak sekolah berharap tindakan ini dapat memberi keinsafan demi kebaikan murid.`
  }
};

export const SABAH_ETHNICS = [
  'Rungus',
  'Dusun',
  'Bajau',
  'Murut',
  'Sungai',
  'Melayu',
  'Cina',
  'Kadazan',
  'Lain-lain'
];

export const KOTA_MARUDU_VILLAGES = [
  'Kg. Salaping',
  'Kg. Tandek',
  'Kg. Goshen',
  'Kg. Marudu Laut',
  'Kg. Tagaroh',
  'Kg. Melinsau',
  'Kg. Morion',
  'Kg. Ongkilan',
  'Kg. Taritiqu',
  'Kg. Tingkalanon',
  'Kg. Sonsogon Magandai',
  'Kg. Mengaris',
  'Kg. Pitas Laut',
  'Kg. Popok',
  'Kg. Talantang'
];

export const TRANSPORT_LABELS: Record<string, { label: string; icon: string }> = {
  jalan_kaki: { label: 'Jalan Kaki', icon: '🚶' },
  motosikal: { label: 'Motosikal', icon: '🏍️' },
  bas: { label: 'Bas Sekolah / Van', icon: '🚌' },
  kereta: { label: 'Kereta / Ibubapa', icon: '🚗' },
  bot: { label: 'Bot / Perahu', icon: '🚤' },
  lain: { label: 'Lain-lain', icon: '🚲' }
};

export const VALID_DELIMA_DOMAINS = ['moe-dl.edu.my', 'moe.gov.my'];

export const DEFAULT_PRODUCTION_ADMIN = {
  uid: 'admin_sekolah',
  nama: 'Pentadbir Sistem HEM (DELIMa)',
  emel: 'admin.salaping@moe-dl.edu.my',
  peranan: ['admin_sistem', 'pengetua', 'gpk_hem'] as UserRole[],
  jawatan: 'Pentadbir Utama Sekolah',
  kataLaluan: 'salaping123',
  kelasDiajar: [] as string[]
};

export const DEMO_USERS = [
  DEFAULT_PRODUCTION_ADMIN
];

export const CLASSES_LIST = [
  { id: '1-arif', tingkatan: 1, nama: '1 Arif', tahun: 2026, kapasiti: 32 },
  { id: '1-bestari', tingkatan: 1, nama: '1 Bestari', tahun: 2026, kapasiti: 30 },
  { id: '2-arif', tingkatan: 2, nama: '2 Arif', tahun: 2026, kapasiti: 30 },
  { id: '2-bestari', tingkatan: 2, nama: '2 Bestari', tahun: 2026, kapasiti: 28 },
  { id: '3-arif', tingkatan: 3, nama: '3 Arif', tahun: 2026, kapasiti: 30 },
  { id: '3-marikh', tingkatan: 3, nama: '3 Marikh', tahun: 2026, kapasiti: 30 },
  { id: '4-sains', tingkatan: 4, nama: '4 Sains', tahun: 2026, kapasiti: 28 },
  { id: '5-sains', tingkatan: 5, nama: '5 Sains', tahun: 2026, kapasiti: 28 }
];
