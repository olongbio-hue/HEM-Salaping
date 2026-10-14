export type UserRole =
  | 'pengetua'
  | 'gpk_hem'
  | 'ketua_guru_disiplin'
  | 'guru_disiplin'
  | 'gbk'
  | 'guru_kelas'
  | 'warden'
  | 'penyelaras_biasiswa'
  | 'penyelaras_pengawas'
  | 'setiausaha_hem'
  | 'guru_biasa'
  | 'admin_sistem';

export interface UserProfile {
  uid: string;
  nama: string;
  emel: string;
  peranan: UserRole[];
  jawatan?: string;
  kelasDiajar?: string[]; // e.g. ["1-arif", "3-marikh"]
  telefon?: string;
  aktif: boolean;
  dicipta: string;
}

export type StudentStatus = 'aktif' | 'pindah' | 'berhenti' | 'tamat' | 'cicir';
export type IncomeCategory = 'B40' | 'M40' | 'T20' | 'tidak_diketahui';
export type TransportMode = 'jalan_kaki' | 'motosikal' | 'bas' | 'kereta' | 'bot' | 'lain';

export interface GuardianInfo {
  nama: string;
  hubungan: 'bapa' | 'ibu' | 'penjaga' | 'datuk' | 'nenek' | 'lain';
  noTel: string;
  pekerjaan: string;
}

export interface Student {
  id: string;
  noMurid: string; // e.g. SMKS2026-0142
  nama: string;
  noKP: string; // 12-digit IC format e.g. 100514-12-5432
  jantina: 'lelaki' | 'perempuan';
  tarikhLahir: string; // YYYY-MM-DD
  tingkatan: number; // 1 to 5
  kelas: string; // e.g. "1 Arif", "3 Marikh"
  tahunMasuk: number;
  etnik: string; // e.g. "Rungus", "Dusun", "Bajau", "Murut", "Sungai", "Melayu", "Cina"
  agama: string; // "Islam", "Kristian", "Buddha", "Lain-lain"
  kampung: string; // e.g. "Kg. Salaping", "Kg. Tandek", "Kg. Goshen"
  alamat: string;
  caraKeSekolah: TransportMode;
  jarakKm: number;
  status: StudentStatus;
  penjaga: GuardianInfo[];
  oku: {
    status: boolean;
    jenis?: string;
  };
  kategoriPendapatan: IncomeCategory;
  penghuniAsrama: boolean;
  kamarAsrama?: string;
  catatanKesihatan?: string;
  dicipta: string;
  dikemaskini: string;
}

export interface ClassInfo {
  id: string; // e.g. "1-arif"
  tingkatan: number;
  nama: string; // e.g. "1 Arif"
  guruKelasUid?: string;
  namaGuruKelas?: string;
  tahun: number;
  kapasiti?: number;
}

export type AttendanceStatus =
  | 'hadir'
  | 'tidak_hadir'
  | 'lewat'
  | 'cuti_sakit'
  | 'urusan_rasmi';

export interface AttendanceRecordItem {
  status: AttendanceStatus;
  sebab?: string;
  suratDisahkan?: boolean;
  masaTiba?: string; // e.g. "07:35"
}

export interface DailyClassAttendance {
  id: string; // "${yyyy-mm-dd}_${kelasId}"
  tarikh: string; // "YYYY-MM-DD"
  kelasId: string;
  tingkatan: number;
  direkodOleh: string; // UID guru
  namaPerekod: string;
  masaDirekod: string;
  rekod: Record<string, AttendanceRecordItem>; // studentId -> item
  jumlahHadir: number;
  jumlahMurid: number;
  peratus: number;
  statusPenghantaran: 'draf' | 'dihantar';
}

export interface SchoolSettings {
  nama: string;
  kodSekolah: string;
  alamat: string;
  poskod: string;
  bandar: string;
  negeri: string;
  noTelefon: string;
  emel: string;
  logo: string;
  namaPengetua: string;
  namaGpkHem: string;
  namaGpk1?: string;
  namaGpkKoko?: string;
  namaKetuaDisiplin?: string;
  namaGbk?: string;
  namaKetuaWarden?: string;
  namaPenyelarasBiasiswa?: string;
  namaPenyelarasPengawas?: string;
  namaGuruData?: string;
  tahunSemasa: number;
  sesi: 'Pagi' | 'Petang';
  warnaUtama: string; // Hex color
  warnaAksen: string; // Hex color
  motoSekolah: string;
  modulAsramaAktif?: boolean; // Fasa 3: Tetapan aktifkan/matikan modul asrama
}

export interface DashboardSettings {
  // Banner Header
  ucapanAwalan: string;
  subteksBanner: string;
  tunjukLogo: boolean;
  tunjukIlustrasiBanner: boolean;
  gambarBannerUrl: string;
  lencanaBannerText: string;
  tajukAspirasi: string;
  subtajukAspirasi: string;
  tunjukMetrikModalInsan: boolean;
  tunjukPautanPantas: boolean;

  // Hebahan & Pengumuman Pentadbiran HEM
  pengumumanAktif: boolean;
  pengumumanTajuk: string;
  pengumumanMesej: string;
  pengumumanJenis: 'info' | 'amaran' | 'penting' | 'kejayaan';
  pengumumanTarikh: string;

  // Kawalan Keterlihatan Kad KPI
  kpiCards: {
    enrolmen: boolean;
    kehadiran: boolean;
    ketidakhadiran: boolean;
    risikoCicir: boolean;
    disiplin: boolean;
    kaunseling: boolean;
    bantuan: boolean;
    asrama: boolean;
  };

  // Tetapan Panel & Carta
  hadSenaraiTindakanSegera: number;
  julatHariGrafTrend: 7 | 14 | 30;
  paparPanelTindakanSegera?: boolean;
  paparPanelMesyuarat?: boolean;
  paparBarisPintasPantas?: boolean;
  paparCartaTrend?: boolean;
  paparCartaTingkatan?: boolean;
  paparTaburanJantina?: boolean;
  paparKelasTerendah?: boolean;
  teksPautanPengumuman?: string;
  urlPautanPengumuman?: string;
}

export interface RulesSettings {
  sasaranKehadiranSekolah: number; // e.g. 90%
  ambangRisikoCicir: {
    amaran1HariBerturut: number; // default: 3
    amaran2HariBerturut: number; // default: 10
    amaran3HariBerturut: number; // default: 20
    amaran1PeratusTerkumpul: number; // e.g. 85%
    amaran2PeratusTerkumpul: number; // e.g. 75%
    amaran3PeratusTerkumpul: number; // e.g. 65%
  };
  kategoriKesalahan: string[];
  kategoriJenayah: string[];
  jenisTindakanDisiplin: string[];
  panduanLaporPihakLuar: {
    syaratPolis: string;
    syaratJKM: string;
    syaratPPD: string;
  };
  templatSuratAmaran: {
    amaran1: string;
    amaran2: string;
    amaran3: string;
    panggilanPenjagaDisiplin?: string;
    tindakanTatatertib?: string;
  };
}

export interface FollowUpAction {
  id: string;
  studentId: string;
  tarikh: string;
  jenis: 'panggilan_telefon' | 'lawatan_rumah' | 'surat_dihantar' | 'sesi_kaunseling' | 'perbincangan_penjaga';
  pegawaiUid: string;
  namaPegawai: string;
  hasil: string;
  status: 'selesai' | 'dalam_tindakan';
  catatan?: string;
}

// ================= MODUL DISIPLIN FASA 2 =================
export type DisciplineSeverity = 'ringan' | 'sederhana' | 'berat' | 'jenayah';

export type DisciplineCaseFlow =
  | 'dilaporkan'
  | 'disiasat'
  | 'pertuduhan_bela_diri'
  | 'kaunseling'
  | 'keputusan'
  | 'selesai'
  | 'dipantau';

export interface DisciplineCase {
  id: string;
  noRujukan: string;
  studentId: string;
  tarikhKejadian: string;
  masaKejadian?: string;
  jenisSalahLaku: 'disiplin' | 'jenayah';
  kategori: string;
  perincianKes: string;
  lokasi: string;
  tahap: DisciplineSeverity;
  tindakanDiambil: string;
  statusAliran: DisciplineCaseFlow;
  statusKes: 'selesai' | 'dalam_siasatan' | 'dirujuk_kaunseling' | 'lembaga_disiplin';
  saksi?: string;
  dilaporOleh: string;
  guruDisiplinUid: string;
  gambarUrl?: string; // Lampiran foto bukti
  langkahWajib: {
    pertuduhanLengkap: boolean;
    belaDiriLengkap: boolean;
    kaunselingLengkap: boolean;
  };
  kenyataanBelaDiri?: string;
  catatanKaunselingIntervensi?: string;
  keputusanOleh?: string; // Pengetua atau GPK HEM untuk kes berat
  tarikhKemaskiniTerakhir: string;
  dicipta: string;
}

export interface DisciplinaryBoardMeeting {
  id: string;
  noRujukan: string;
  tarikh: string;
  masa: string;
  tempat: string;
  kesIds: string[];
  studentIds: string[];
  pengerusi: string;
  ahliHadir: string[];
  minitRingkas: string;
  keputusan: string;
  tarikhSusulan?: string;
  status: 'dijadualkan' | 'selesai';
  dicipta: string;
}

// ================= MODUL BULI & CPP (CHILD PROTECTION POLICY) =================
export type BullyingCategory = 'fizikal' | 'lisan' | 'sosial' | 'siber' | 'seksual' | 'lain';
export type BullyingUrgency = 'rendah' | 'sederhana' | 'tinggi' | 'kritikal_segera';

export interface BullyingReport {
  id: string;
  noAduan: string;
  tarikhAduan: string;
  kategoriBuli: BullyingCategory;
  tahapSegera: BullyingUrgency;
  aduanAnonim: boolean;
  namaPelapor?: string;
  hubunganPelapor: 'guru' | 'ibu_bapa' | 'murid' | 'orang_awam';
  noTelPelapor?: string;
  mangsaNama: string;
  mangsaKelas?: string;
  mangsaStudentId?: string;
  pihakTerlibat: string; // Pelaku / saksi
  lokasi: string;
  keterangan: string;
  buktiLampiran?: string;
  status: 'baru' | 'siasatan' | 'tindakan' | 'pantauan' | 'selesai';
  tarikhSemakSemulaWajib: string;
  semakan1Minggu?: {
    tarikh: string;
    catatan: string;
    keadaanMangsa: string;
    selesai: boolean;
    pegawaiNama: string;
  };
  semakan1Bulan?: {
    tarikh: string;
    catatan: string;
    keadaanMangsa: string;
    selesai: boolean;
    pegawaiNama: string;
  };
  dirujukPolisJkm?: {
    agensi: 'Polis Diraja Malaysia (PDRM)' | 'Jabatan Kebajikan Masyarakat (JKM)' | 'Pejabat Pendidikan Daerah (PPD)';
    tarikh: string;
    noLaporan: string;
    catatan: string;
  };
  catatanTindakan?: string;
  tarikhKemaskini: string;
  dikendalikanOleh?: string;
}

export interface AwarenessProgram {
  id: string;
  namaProgram: string;
  tarikh: string;
  sasaran: string; // e.g. "Semua Murid Tingkatan 1 - 5"
  penceramah: string;
  catatan: string;
}

// ================= MODUL KAUNSELING SENSITIF FASA 2 =================
export interface CounselingSession {
  id: string;
  studentId: string;
  tarikh: string;
  tempohMinit?: number;
  jenisSesi: 'individu' | 'kelompok' | 'kerjaya' | 'krisis' | 'disiplin';
  isuUtama: string;
  kategoriIsu?: 'akademik' | 'sahsiah' | 'emosi' | 'keluarga' | 'kerjaya' | 'disiplin' | 'ponteng';
  rujukanDari?: 'guru' | 'disiplin' | 'kehadiran' | 'ibu_bapa' | 'kendiri';
  tahapKeutamaan?: 'rendah' | 'sederhana' | 'tinggi';
  catatanSesi: string; // Dilindungi enkripsi / hanya GBK
  tindakanSusulan: string;
  gbkUid: string;
  namaGbk: string;
  status: 'aktif' | 'selesai';
  dicipta: string;
}

export interface MentalHealthScreening {
  id: string;
  studentId: string;
  tarikh: string;
  skorStres: number;
  skorKeresahan: number;
  skorKemurungan: number;
  tahapKeseluruhan: 'normal' | 'ringan' | 'sederhana' | 'teruk' | 'sangat_teruk';
  perluRujukanKKM: boolean;
  catatanGbk: string;
  statusRujukan: 'tiada' | 'dalam_pantauan' | 'dirujuk_kkm';
  namaKlinikHospital?: string;
  dicipta: string;
}

export interface MentorMenteePair {
  id: string;
  mentorUid: string;
  namaMentor: string;
  menteeStudentId: string;
  namaMentee: string;
  kelasMentee: string;
  tahun: number;
  fokusBimbingan: string;
  logPertemuan: {
    id: string;
    tarikh: string;
    topik: string;
    catatan: string;
  }[];
}

export interface CareerCounselingProfile {
  id: string;
  studentId: string;
  minatRIASEC?: string; // e.g. "Realistik, Investigatif, Sosial"
  pilihanPascaSPM: string[];
  rekodBimbingan: {
    tarikh: string;
    halaTuju: string;
    institusiSasaran: string; // e.g. "IKM, Politeknik, Tingkatan 6, Matrikulasi Labuan"
    catatan: string;
  }[];
}

// ================= BANTUAN & AUDIT =================
export interface AssistanceBudgetConfig {
  kuotaMurid: number;
  perMurid: number;
  peruntukanSekolah: number;
  sumber?: string;
  catatan?: string;
}

export interface AssistanceRecord {
  id: string;
  studentId: string;
  jenisBantuan: string; // e.g. 'KWAPM' | 'BKP' | 'BAP' | 'RMT' | 'SPBT' | 'Bantuan PIBG' | 'Zakat' | 'Lain-lain'
  tahun: number;
  jumlahBantuan: number;
  statusAgihan: 'layak' | 'telah_terima' | 'dalam_proses';
  tarikhTerima?: string;
  disahkanOlehPenjaga?: boolean;
  namaPenjagaPenerima?: string;
  catatan?: string;
}

export interface AssistanceApplication {
  id: string;
  studentId: string;
  jenisBantuan: string;
  sebab: string;
  kategoriPendapatan: IncomeCategory;
  dokumenSokongan?: string;
  status: 'baharu' | 'disemak' | 'disyorkan' | 'lulus' | 'ditolak' | 'diserah';
  tarikhMohon: string;
  tarikhStatus?: string;
  pegawaiPenyemak?: string;
  catatanKelulusan?: string;
}

// ================= ASRAMA FASA 3 =================
export interface HostelRoom {
  id: string;
  blok: 'A (Putera)' | 'B (Puteri)';
  namaKamar: string;
  kapasiti: number;
  ketuaKamar?: string;
  penghuniIds: string[];
}

export interface HostelMovementLog {
  id: string;
  studentId: string;
  jenis: 'pulang_bermalam' | 'urusan_keluar' | 'lewat_pulang' | 'kecemasan';
  tarikhKeluar: string;
  masaKeluar: string;
  tarikhJangkaPulang: string;
  tarikhSebenarPulang?: string;
  tujuan: string;
  statusKelulusan: 'menunggu' | 'diluluskan' | 'ditolak' | 'telah_pulang';
  wardenUid: string;
  namaWarden: string;
  catatan?: string;
}

export interface HostelInspection {
  id: string;
  tarikh: string;
  blok: string;
  kamar: string;
  skorKebersihan: number; // 1 - 10
  barangLaranganDitemui: boolean;
  perincianBarangLarangan?: string;
  wardenBertugas: string;
  tindakan?: string;
}

export interface HostelDailyReport {
  id: string;
  tarikh: string;
  wardenBertugas: string;
  kiraanMuridMalam: {
    hadir: number;
    pulangBermalam: number;
    sakit: number;
    tiadaKebenaran: number;
  };
  isuKebajikan: string;
  catatan: string;
}

// ================= KESIHATAN, KESELAMATAN & 3K =================
export interface SickBayRecord {
  id: string;
  studentId: string;
  tarikh: string;
  masaMasuk: string;
  masaKeluar?: string;
  simptom: string;
  tindakan: string;
  dihantarHospital: boolean;
  namaKlinikHospital?: string;
  penjagaDimaklumkan: boolean;
  namaGuruBertugas: string;
}

export interface Inspection3KRecord {
  id: string;
  tarikh: string;
  kawasan: string; // e.g. "Blok Tingkatan 1", "Kantin", "Tandas Murid Lelaki"
  aspek: 'kebersihan' | 'kesihatan' | 'keselamatan' | 'keseluruhan';
  skor: number; // 0 - 100
  status: 'cemerlang' | 'memuaskan' | 'perlu_tindakan';
  catatan: string;
  gambarUrl?: string;
  pemeriksa: string;
}

export interface EmergencyContact {
  id: string;
  agensi: string;
  noTel: string;
  alamat: string;
  pegawaiHubungan?: string;
  kategori: 'polis' | 'hospital' | 'bomba' | 'ppd' | 'jkm' | 'klinik';
}

export interface FireDrillRecord {
  id: string;
  tarikh: string;
  masaMula: string;
  tempohEvakuasiMinit: number;
  jumlahPeserta: number;
  agensiTerlibat: string;
  penilaian: string;
  catatanPenambahbaikan: string;
}

// ================= PENGAWAS & KEPIMPINAN =================
export interface Prefect {
  id: string;
  studentId: string;
  jawatan:
    | 'Ketua Pengawas'
    | 'Penolong Ketua Pengawas 1'
    | 'Penolong Ketua Pengawas 2'
    | 'Setiausaha'
    | 'Bendahari'
    | 'Exco Disiplin'
    | 'Exco Perhimpunan'
    | 'Exco Kebersihan'
    | 'Pengawas';
  sesi: string;
  status: 'aktif' | 'tamat' | 'digantung';
  skorPrestasi: number; // 0 - 100
  catatanPrestasi: string;
}

export interface PrefectDutyRoster {
  id: string;
  hari: 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat';
  lokasi: 'Pintu Pagar Utama' | 'Kantin Sekolah' | 'Tapak Perhimpunan' | 'Rondaan Blok Akademik' | 'Pusat Sumber';
  pengawasIds: string[];
  masaTugas: string;
}

// ================= PROGRAM HEM, PERHIMPUNAN & KALENDAR =================
export interface HemProgram {
  id: string;
  namaProgram: string;
  unit: 'Disiplin' | 'UBK' | 'Kebajikan & Biasiswa' | '3K & Kesihatan' | 'Asrama' | 'Pengawas' | 'SPBT';
  tarikh: string;
  masa?: string;
  tempat: string;
  bajetAnggaran: number;
  penyelaras: string;
  status: 'dirancang' | 'berjalan' | 'selesai' | 'ditangguhkan';
  kehadiranPeserta?: number;
  refleksi?: string;
  gambarUrl?: string;
}

export interface AssemblyDuty {
  id: string;
  minggu: number;
  tarikh: string;
  guruBertugas: string[];
  temaPerhimpunan: string;
  laporanRingkas?: string;
  peringatanTindakan?: string;
}

// ================= MESYUARAT HEM =================
export interface HemMeetingFollowUp {
  id: string;
  perkara: string;
  tindakanOlehUid: string;
  namaTindakanOleh: string;
  tarikhAkhir: string;
  status: 'belum_selesai' | 'dalam_tindakan' | 'selesai';
}

export interface HemMeeting {
  id: string;
  tajuk: string;
  bilangan: string; // e.g. "Bil. 1/2026"
  tarikh: string;
  masa: string;
  tempat: string;
  pengerusi: string;
  pencatatMinit: string;
  ahliHadir: string[];
  agenda: string[];
  minitRingkas: string;
  tindakanSusulan: HemMeetingFollowUp[];
}

export interface AuditLog {
  id: string;
  uid: string;
  namaPengguna: string;
  tindakan: 'cipta' | 'ubah' | 'padam' | 'eksport' | 'import' | 'cetak' | 'akses_sulit';
  koleksi: string;
  dokumenId: string;
  perincian: string;
  masa: string; // ISO string
}
