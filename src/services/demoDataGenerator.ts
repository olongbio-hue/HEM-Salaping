import {
  Student,
  DailyClassAttendance,
  DisciplineCase,
  CounselingSession,
  AssistanceRecord,
  FollowUpAction,
  IncomeCategory,
  TransportMode,
  DisciplinaryBoardMeeting,
  BullyingReport,
  AwarenessProgram,
  MentalHealthScreening,
  MentorMenteePair,
  CareerCounselingProfile,
  AssistanceApplication,
  HostelMovementLog,
  HostelInspection,
  HostelDailyReport,
  SickBayRecord,
  Inspection3KRecord,
  Prefect,
  PrefectDutyRoster,
  HemProgram,
  AssemblyDuty,
  HemMeeting
} from '../types';
import {
  CLASSES_LIST,
  KOTA_MARUDU_VILLAGES,
  SABAH_ETHNICS,
  DEFAULT_ASSISTANCE_TYPES,
  DEFAULT_3K_AREAS
} from '../constants';

const FIRST_NAMES_MALE = [
  'Aventino', 'Bryan', 'Calvin', 'Dexter', 'Evander', 'Felix', 'Gilbert',
  'Hafizan', 'Ian', 'Jason', 'Kenward', 'Larry', 'Maxwell', 'Norazlan',
  'Oliver', 'Petrus', 'Rayner', 'Stevence', 'Timothy', 'Vernon', 'Warren',
  'Xavier', 'Yohanes', 'Zulhilmi', 'Adriel', 'Christoval', 'Darryl',
  'Ernelson', 'Flavian', 'Gideon', 'Hilarius', 'Jovian', 'Krispin', 'Linus'
];

const FIRST_NAMES_FEMALE = [
  'Angelina', 'Brenda', 'Clara', 'Danielle', 'Elda', 'Felicia', 'Grace',
  'Hanna', 'Ivanna', 'Jocelyn', 'Krislyne', 'Lorita', 'Melanie', 'Natasya',
  'Olivia', 'Prescilla', 'Quinnie', 'Roslinda', 'Stefannie', 'Tracie', 'Vanessa',
  'Wilma', 'Yvonne', 'Zahara', 'Avril', 'Bella', 'Cassandra', 'Daphne',
  'Evelyn', 'Fransisca', 'Gillian', 'Hazel', 'Jessica', 'Kelly'
];

const SABAH_SURNAMES = [
  'Majanil', 'Gindol', 'Mokujin', 'Sompungan', 'Gonsilou', 'Majapil',
  'Moduying', 'Majalang', 'Solibun', 'Konding', 'Minis', 'Masudal',
  'Daim', 'Bin Abdullah', 'Binti Japar', 'Sabran', 'Wong', 'Liew',
  'Linggi', 'Gompul', 'Tombul', 'Lumpisau', 'Motinggo', 'Guntabid',
  'Kandayan', 'Bin Rusli', 'Binti Kassim', 'Chin', 'Bungkias'
];

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateFictitiousStudents(): Student[] {
  const rand = createSeededRandom(42);
  const students: Student[] = [];

  CLASSES_LIST.forEach((cls) => {
    const studentCount = cls.kapasiti || 30;
    for (let i = 1; i <= studentCount; i++) {
      const isMale = rand() > 0.48;
      const firstName = isMale
        ? FIRST_NAMES_MALE[Math.floor(rand() * FIRST_NAMES_MALE.length)]
        : FIRST_NAMES_FEMALE[Math.floor(rand() * FIRST_NAMES_FEMALE.length)];
      const surname = SABAH_SURNAMES[Math.floor(rand() * SABAH_SURNAMES.length)];
      
      const connector = isMale
        ? (surname.startsWith('Bin') || surname.includes(' ') ? '' : ' Anak ')
        : (surname.startsWith('Binti') || surname.includes(' ') ? '' : ' Anak ');
      
      const fullName = surname.startsWith('Bin') || surname.startsWith('Binti')
        ? `${firstName} ${surname}`
        : `${firstName}${connector}${surname}`;

      const birthYear = 2026 - 12 - cls.tingkatan;
      const birthMonth = String(Math.floor(rand() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(rand() * 28) + 1).padStart(2, '0');
      const birthYear2 = String(birthYear).slice(-2);
      
      const random4 = String(Math.floor(rand() * 8999) + 1000);
      const noKP = `${birthYear2}${birthMonth}${birthDay}-12-${random4}`;
      const noMurid = `SMKS${2026 - cls.tingkatan + 1}-${String(students.length + 1).padStart(4, '0')}`;

      const village = KOTA_MARUDU_VILLAGES[Math.floor(rand() * KOTA_MARUDU_VILLAGES.length)];
      const isFarVillage = village.includes('Sonsogon') || village.includes('Melinsau') || village.includes('Morion') || village.includes('Pitas');
      const distanceKm = isFarVillage ? Math.floor(rand() * 20) + 12 : Math.floor(rand() * 8) + 1;

      const ethnicRand = rand();
      let ethnic = 'Rungus';
      if (ethnicRand > 0.45) ethnic = 'Dusun';
      if (ethnicRand > 0.70) ethnic = 'Bajau';
      if (ethnicRand > 0.85) ethnic = 'Sungai';
      if (ethnicRand > 0.92) ethnic = 'Cina';
      if (ethnicRand > 0.96) ethnic = 'Murut';

      const isHostel = isFarVillage || (distanceKm > 10 && rand() > 0.25);
      const isOku = rand() < 0.035;

      const incomeRand = rand();
      let income: IncomeCategory = 'B40';
      if (incomeRand > 0.78) income = 'M40';
      if (incomeRand > 0.97) income = 'T20';

      const transportModes: TransportMode[] = isHostel
        ? ['jalan_kaki']
        : distanceKm <= 2
        ? ['jalan_kaki', 'motosikal']
        : distanceKm <= 8
        ? ['motosikal', 'bas', 'kereta']
        : ['bas', 'kereta', 'motosikal', 'bot'];
      const caraKeSekolah = transportModes[Math.floor(rand() * transportModes.length)];

      const guardianSurname = surname.startsWith('Bin') ? surname.replace('Bin ', '') : surname;
      const guardianPhone = `01${Math.floor(rand() * 8) + 1}-${Math.floor(rand() * 8999999) + 1000000}`;

      students.push({
        id: `stu_${cls.id}_${i}`,
        noMurid,
        nama: fullName,
        noKP,
        jantina: isMale ? 'lelaki' : 'perempuan',
        tarikhLahir: `${birthYear}-${birthMonth}-${birthDay}`,
        tingkatan: cls.tingkatan,
        kelas: cls.nama,
        tahunMasuk: 2026 - cls.tingkatan + 1,
        etnik: ethnic,
        agama: ethnic === 'Bajau' || surname.includes('Bin') || surname.includes('Binti') ? 'Islam' : (ethnic === 'Cina' ? 'Buddha' : 'Kristian'),
        kampung: village,
        alamat: `${village}, Peti Surat 188, 89108 Kota Marudu, Sabah`,
        caraKeSekolah,
        jarakKm: distanceKm,
        status: 'aktif',
        penjaga: [
          {
            nama: `En. ${guardianSurname} Anak Majanil`,
            hubungan: 'bapa',
            noTel: guardianPhone,
            pekerjaan: income === 'B40' ? 'Petani / Penoreh Getah' : (income === 'M40' ? 'Kakitangan Awam / Peniaga' : 'Pengurus Ladang')
          },
          {
            nama: `Pn. Rosnah Bte Japar`,
            hubungan: 'ibu',
            noTel: `019-${Math.floor(rand() * 8999999) + 1000000}`,
            pekerjaan: 'Suri Rumah'
          }
        ],
        oku: {
          status: isOku,
          jenis: isOku ? (rand() > 0.5 ? 'Masalah Pembelajaran (Disleksia)' : 'Fizikal (Anggota)') : undefined
        },
        kategoriPendapatan: income,
        penghuniAsrama: isHostel,
        kamarAsrama: isHostel ? (isMale ? `Kamar Kinabalu ${Math.floor(rand() * 4) + 1}` : `Kamar Mahua ${Math.floor(rand() * 4) + 1}`) : undefined,
        catatanKesihatan: rand() < 0.08 ? 'Alahan Makanan Laut / Asma Ringan' : 'Sihat sepenuhnya',
        dicipta: '2026-01-02T08:00:00.000Z',
        dikemaskini: '2026-03-01T08:00:00.000Z'
      });
    }
  });

  return students;
}

export function generateFictitiousAttendance(students: Student[]): DailyClassAttendance[] {
  const rand = createSeededRandom(101);
  const result: DailyClassAttendance[] = [];

  const dates: string[] = [];
  const curr = new Date(2026, 9, 9);
  while (dates.length < 30) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    curr.setDate(curr.getDate() - 1);
  }
  dates.reverse();

  CLASSES_LIST.forEach((cls) => {
    const classStudents = students.filter(s => s.kelas === cls.nama);
    const totalCount = classStudents.length;

    dates.forEach((tarikh, dateIdx) => {
      const isToday = dateIdx === dates.length - 1;
      const records: DailyClassAttendance['rekod'] = {};
      let hadirCount = 0;

      classStudents.forEach(stu => {
        // Specific dropout test cases
        if (stu.nama.includes('Guntabid') && dateIdx >= dates.length - 22) {
          records[stu.id] = { status: 'tidak_hadir', sebab: 'Membantu keluarga di kebun / Tiada pengangkutan', suratDisahkan: false };
          return;
        }
        if (stu.nama.includes('Masudal') && dateIdx >= dates.length - 11) {
          records[stu.id] = { status: 'tidak_hadir', sebab: 'Masalah kewangan keluarga & menjaga adik', suratDisahkan: false };
          return;
        }
        if (stu.nama.includes('Minis') && dateIdx >= dates.length - 4) {
          records[stu.id] = { status: 'cuti_sakit', sebab: 'Demam Denggi dalam pemantauan', suratDisahkan: true };
          return;
        }

        const roll = rand();
        if (roll < 0.915) {
          records[stu.id] = { status: 'hadir', masaTiba: '06:55' };
          hadirCount++;
        } else if (roll < 0.94) {
          records[stu.id] = { status: 'lewat', sebab: 'Jalan rosak / Hujan lebat di kg.', masaTiba: '07:35' };
          hadirCount++;
        } else if (roll < 0.97) {
          records[stu.id] = { status: 'cuti_sakit', sebab: 'Demam / Selesema', suratDisahkan: rand() > 0.4 };
        } else if (roll < 0.985) {
          records[stu.id] = { status: 'urusan_rasmi', sebab: 'Wakil MSSD / Kadet Polis', suratDisahkan: true };
          hadirCount++;
        } else {
          records[stu.id] = { status: 'tidak_hadir', sebab: 'Tiada makluman / Ponteng sekolah', suratDisahkan: false };
        }
      });

      const peratus = totalCount > 0 ? Number(((hadirCount / totalCount) * 100).toFixed(1)) : 100;

      result.push({
        id: `${tarikh}_${cls.id}`,
        tarikh,
        kelasId: cls.id,
        tingkatan: cls.tingkatan,
        direkodOleh: (cls as any).guruKelasUid || 'admin_sekolah',
        namaPerekod: (cls as any).namaGuruKelas || 'Guru Kelas',
        masaDirekod: isToday ? '07:25 AM' : '07:20 AM',
        rekod: records,
        jumlahHadir: hadirCount,
        jumlahMurid: totalCount,
        peratus,
        statusPenghantaran: 'dihantar'
      });
    });
  });

  return result;
}

// ================= MODUL DISIPLIN FASA 2 (SSDM ASAL) =================
export function generateFictitiousDiscipline(students: Student[]): DisciplineCase[] {
  const rand = createSeededRandom(88);
  const cases: DisciplineCase[] = [];

  const locations = [
    'Tandas Blok B',
    'Belakang Bengkel RBT',
    'Kantin Sekolah',
    'Padang Bola',
    'Belakang Surau',
    'Dewan Terbuka',
    'Koridor Tingkatan 3',
    'Pondok Menunggu Bas'
  ];

  const candidateStudents = students.slice(0, 35);

  const offensesDef = [
    { kat: 'Lewat / Ponteng Kelas', jenis: 'disiplin' as const, tahap: 'sederhana' as const, tindak: 'Amaran Bertulis (Direkodkan)' },
    { kat: 'Merokok / Menggunakan Vape', jenis: 'disiplin' as const, tahap: 'berat' as const, tindak: 'Panggilan Penjaga & Kaunseling UBK' },
    { kat: 'Pakaian / Rambut Tidak Mematuhi Peraturan', jenis: 'disiplin' as const, tahap: 'ringan' as const, tindak: 'Nasihat & Peringatan Lisan' },
    { kat: 'Buli Fizikal / Lisan / Siber', jenis: 'disiplin' as const, tahap: 'berat' as const, tindak: 'Rujuk Sidang Lembaga Disiplin Sekolah' },
    { kat: 'Kecurian Wang / Barangan Berharga', jenis: 'jenayah' as const, tahap: 'jenayah' as const, tindak: 'Siasatan Polis & Rujuk Lembaga Disiplin' },
    { kat: 'Pergaduhan Mencederakan / Senjata', jenis: 'jenayah' as const, tahap: 'jenayah' as const, tindak: 'Gantung Persekolahan Sementara (PGB)' },
    { kat: 'Vandalisme & Kerosakan Harta Sekolah', jenis: 'disiplin' as const, tahap: 'sederhana' as const, tindak: 'Khidmat Masyarakat Sekolah' },
    { kat: 'Membawa Telefon / Gajet Tanpa Kebenaran', jenis: 'disiplin' as const, tahap: 'ringan' as const, tindak: 'Simpan di Pejabat Disiplin' }
  ];

  // Specific repeat offender for recidivism test (Dexter Anak Majanil - 3 offenses)
  const repeatStudent = candidateStudents[2];

  for (let i = 0; i < 18; i++) {
    const stu = i < 3 ? repeatStudent : candidateStudents[(i + 4) % candidateStudents.length];
    const off = offensesDef[i % offensesDef.length];
    const loc = locations[i % locations.length];
    const day = (i * 3 + 4) % 28 + 1;
    const dateStr = `2026-09-${String(day).padStart(2, '0')}`;

    // Workflow status variety
    let statusAliran: DisciplineCase['statusAliran'] = 'selesai';
    let pertuduhanLengkap = true;
    let belaDiriLengkap = true;
    let kaunselingLengkap = true;
    let statusKes: DisciplineCase['statusKes'] = 'selesai';

    if (i === 1) {
      statusAliran = 'disiasat';
      pertuduhanLengkap = false;
      belaDiriLengkap = false;
      kaunselingLengkap = false;
      statusKes = 'dalam_siasatan';
    } else if (i === 3) {
      statusAliran = 'pertuduhan_bela_diri';
      pertuduhanLengkap = true;
      belaDiriLengkap = false;
      kaunselingLengkap = false;
      statusKes = 'dalam_siasatan';
    } else if (i === 4) {
      statusAliran = 'kaunseling';
      pertuduhanLengkap = true;
      belaDiriLengkap = true;
      kaunselingLengkap = false;
      statusKes = 'dirujuk_kaunseling';
    } else if (i === 5) {
      statusAliran = 'keputusan';
      pertuduhanLengkap = true;
      belaDiriLengkap = true;
      kaunselingLengkap = true;
      statusKes = 'lembaga_disiplin';
    }

    cases.push({
      id: `disp_${i + 1}`,
      noRujukan: `DISP/SMKS/2026/${String(i + 1).padStart(3, '0')}`,
      studentId: stu.id,
      tarikhKejadian: dateStr,
      masaKejadian: `${String((i * 2 + 7) % 5 + 7).padStart(2, '0')}:${String((i * 15) % 60).padStart(2, '0')} AM`,
      jenisSalahLaku: off.jenis,
      kategori: off.kat,
      perincianKes: `Murid terlibat dalam insiden ${off.kat.toLowerCase()} di ${loc}. Saksi mengesahkan kejadian berlaku pada waktu rehat/pertukaran kelas.`,
      lokasi: loc,
      tahap: off.tahap,
      tindakanDiambil: off.tindak,
      statusAliran,
      statusKes,
      saksi: 'Pengawas Bertugas & Guru Disiplin',
      dilaporOleh: 'Cikgu Albert Sompungan',
      guruDisiplinUid: 'demo_ketua_disiplin',
      langkahWajib: {
        pertuduhanLengkap,
        belaDiriLengkap,
        kaunselingLengkap
      },
      kenyataanBelaDiri: belaDiriLengkap ? 'Murid mengaku melakukan salah laku tersebut dan memohon maaf secara bertulis.' : undefined,
      catatanKaunselingIntervensi: kaunselingLengkap ? 'Sesi bimbingan sahsiah terpuji telah dijalankan oleh UBK.' : undefined,
      keputusanOleh: off.tahap === 'berat' || off.tahap === 'jenayah' ? 'En. Justin Bin Moduying (Pengetua)' : 'Ustaz Hafiz Bin Roslan (Ketua Disiplin)',
      tarikhKemaskiniTerakhir: dateStr,
      dicipta: `${dateStr}T10:00:00.000Z`
    });
  }

  return cases;
}

// ================= MODUL LEMBAGA DISIPLIN =================
export function generateFictitiousBoardMeetings(cases: DisciplineCase[], students: Student[]): DisciplinaryBoardMeeting[] {
  return [
    {
      id: 'board_1',
      noRujukan: 'LD/SMKS/2026/01',
      tarikh: '2026-09-18',
      masa: '02:30 PM',
      tempat: 'Bilik Mesyuarat Utama SMK Salaping',
      kesIds: [cases[4]?.id || 'disp_5'],
      studentIds: [cases[4]?.studentId || students[0].id],
      pengerusi: 'En. Justin Bin Moduying (Pengetua)',
      ahliHadir: [
        'Pn. Masnah Binti Japar (GPK HEM)',
        'Ustaz Hafiz Bin Roslan (Ketua Guru Disiplin)',
        'Cik Norazimah Binti Abdullah (GBK)',
        'Cikgu Elda Grace Majanil (Guru Kelas)'
      ],
      minitRingkas: 'Mesyuarat membincangkan pertuduhan dan rayuan bela diri murid bagi kes salah laku berat. Ibu bapa hadir bersama dan bersetuju dengan intervensi berfokus UBK.',
      keputusan: 'Gantung persekolahan selama 7 hari dengan tugasan khidmat masyarakat sekolah dan sesi kaunseling wajib.',
      tarikhSusulan: '2026-10-02',
      status: 'selesai',
      dicipta: '2026-09-15T08:00:00.000Z'
    },
    {
      id: 'board_2',
      noRujukan: 'LD/SMKS/2026/02',
      tarikh: '2026-10-14',
      masa: '10:00 AM',
      tempat: 'Bilik Gerakan HEM',
      kesIds: [cases[5]?.id || 'disp_6'],
      studentIds: [cases[5]?.studentId || students[1].id],
      pengerusi: 'En. Justin Bin Moduying (Pengetua)',
      ahliHadir: [
        'Pn. Masnah Binti Japar (GPK HEM)',
        'Ustaz Hafiz Bin Roslan (Ketua Guru Disiplin)',
        'Cik Norazimah Binti Abdullah (GBK)'
      ],
      minitRingkas: 'Sidang khas mendengar laporan siasatan insiden kecurian barangan di blok akademik.',
      keputusan: 'Dalam perbincangan akhir bersama Pegawai Perhubungan Sekolah PDRM.',
      tarikhSusulan: '2026-10-21',
      status: 'dijadualkan',
      dicipta: '2026-10-05T08:00:00.000Z'
    }
  ];
}

// ================= MODUL ADUAN BULI & PERLINDUNGAN KANAK-KANAK =================
export function generateFictitiousBullyingReports(students: Student[]): BullyingReport[] {
  const victim1 = students[5];
  const victim2 = students[12];
  const victim3 = students[25];

  return [
    {
      id: 'buli_1',
      noAduan: 'BULI/SMKS/2026/001',
      tarikhAduan: '2026-09-22',
      kategoriBuli: 'fizikal',
      tahapSegera: 'kritikal_segera',
      aduanAnonim: false,
      namaPelapor: 'Cikgu Stephen Gonsilou',
      hubunganPelapor: 'guru',
      noTelPelapor: '019-8654321',
      mangsaNama: victim1?.nama || 'Murid Mangsa 1',
      mangsaKelas: victim1?.kelas || '2 Arif',
      mangsaStudentId: victim1?.id,
      pihakTerlibat: 'Kumpulan murid Tingkatan 3 di belakang tandas',
      lokasi: 'Tandas Murid Blok Melati',
      keterangan: 'Mangsa didorong dan diugut meminta wang saku sebanyak RM5 setiap hari sejak minggu lalu. Terdapat lebam ringan pada lengan.',
      buktiLampiran: 'Foto kesan lebam telah diserahkan kepada GPK HEM',
      status: 'tindakan',
      tarikhSemakSemulaWajib: '2026-10-08',
      semakan1Minggu: {
        tarikh: '2026-09-29',
        catatan: 'Mangsa hadir ke sekolah dalam keadaan lebih tenang. Rakan sebaya menyokong mangsa.',
        keadaanMangsa: 'Emosi stabil, tiada ancaman baharu dilaporkan.',
        selesai: true,
        pegawaiNama: 'Cik Norazimah Binti Abdullah (GBK)'
      },
      semakan1Bulan: {
        tarikh: '2026-10-22',
        catatan: 'Menunggu tarikh genap 1 bulan untuk semakan psikososial lanjutan.',
        keadaanMangsa: 'Dalam pemantauan berkala UBK.',
        selesai: false,
        pegawaiNama: 'Cik Norazimah Binti Abdullah (GBK)'
      },
      catatanTindakan: 'Ibu bapa pelaku telah dipanggil ke sekolah. Pelaku dikenakan amaran bertulis dan sesi intervensi UBK.',
      tarikhKemaskini: '2026-09-29',
      dikendalikanOleh: 'Pn. Masnah Binti Japar (GPK HEM)'
    },
    {
      id: 'buli_2',
      noAduan: 'BULI/SMKS/2026/002',
      tarikhAduan: '2026-09-26',
      kategoriBuli: 'siber',
      tahapSegera: 'tinggi',
      aduanAnonim: true,
      hubunganPelapor: 'murid',
      mangsaNama: victim2?.nama || 'Murid Mangsa 2',
      mangsaKelas: victim2?.kelas || '3 Marikh',
      mangsaStudentId: victim2?.id,
      pihakTerlibat: 'Akaun Instagram/TikTok palsu murid sekelas',
      lokasi: 'Media Sosial / Kumpulan WhatsApp Kelas',
      keterangan: 'Foto mangsa diedit secara mengaibkan dan disebarkan dalam grup sembang dengan kata-kata ejekan menghina rupa paras.',
      status: 'siasatan',
      tarikhSemakSemulaWajib: '2026-10-03', // Melebihi 7 hari tanpa kemas kini untuk mencetuskan peringatan!
      catatanTindakan: 'Tangkapan layar mesej telah diserahkan kepada Guru Penyelaras ICT dan GPK HEM untuk siasatan forensik.',
      tarikhKemaskini: '2026-09-26', // > 7 days ago!
      dikendalikanOleh: 'Ustaz Hafiz Bin Roslan (Ketua Disiplin)'
    },
    {
      id: 'buli_3',
      noAduan: 'BULI/SMKS/2026/003',
      tarikhAduan: '2026-09-10',
      kategoriBuli: 'lisan',
      tahapSegera: 'sederhana',
      aduanAnonim: false,
      namaPelapor: 'Pn. Masnah Binti Japar',
      hubunganPelapor: 'ibu_bapa',
      noTelPelapor: '019-8123987',
      mangsaNama: victim3?.nama || 'Murid Mangsa 3',
      mangsaKelas: victim3?.kelas || '1 Bestari',
      mangsaStudentId: victim3?.id,
      pihakTerlibat: 'Murid senior asrama desa',
      lokasi: 'Dewan Makan Asrama Desa',
      keterangan: 'Ejekan berulang kali tentang loghat bahasa dan latar belakang kampung asal mangsa.',
      status: 'selesai',
      tarikhSemakSemulaWajib: '2026-10-10',
      semakan1Minggu: {
        tarikh: '2026-09-17',
        catatan: 'Warden telah mengadakan sesi mediasi antara penghuni bilik asrama.',
        keadaanMangsa: 'Hubungan antara penghuni kembali harmoni.',
        selesai: true,
        pegawaiNama: 'Cikgu Jerry Mojuntin (Warden)'
      },
      semakan1Bulan: {
        tarikh: '2026-10-08',
        catatan: 'Semakan 1 bulan mendapati murid ceria dan aktif dalam aktiviti sukan asrama.',
        keadaanMangsa: 'Selesai sepenuhnya tanpa sebarang insiden ulangan.',
        selesai: true,
        pegawaiNama: 'Cikgu Jerry Mojuntin (Warden)'
      },
      catatanTindakan: 'Selesai melalui sesi kaunseling kelompok penghuni asrama.',
      tarikhKemaskini: '2026-10-08',
      dikendalikanOleh: 'Cikgu Jerry Mojuntin (Warden)'
    }
  ];
}

export function generateFictitiousAwarenessPrograms(): AwarenessProgram[] {
  return [
    {
      id: 'prog_1',
      namaProgram: 'Kempen "Sekolahku Sejahtera: Hentikan Buli & Hargai Rakan"',
      tarikh: '2026-08-15',
      sasaran: 'Semua Murid Tingkatan 1 hingga 5 (240 murid)',
      penceramah: 'Pegawai Perhubungan Sekolah (PPS) IPD Kota Marudu',
      catatan: 'Pendedahan jenis-jenis buli, implikasi undang-undang Kanun Keseksaan, dan saluran aduan rahsia peti aduan/portal.'
    },
    {
      id: 'prog_2',
      namaProgram: 'Bengkel Celik Emosi & Literasi Siber UBK',
      tarikh: '2026-09-05',
      sasaran: 'Pemimpin Murid & Pengawas Sekolah (35 murid)',
      penceramah: 'Cik Norazimah Binti Abdullah (GBK SMK Salaping)',
      catatan: 'Latihan pengesanan tanda-tanda kemurungan rakan sebaya dan etika penggunaan media sosial.'
    }
  ];
}

// ================= MODUL SARINGAN KESIHATAN MENTAL (UBK) =================
export function generateFictitiousMentalHealthScreenings(students: Student[]): MentalHealthScreening[] {
  return [
    {
      id: 'mhs_1',
      studentId: students[0]?.id || 'stu_1',
      tarikh: '2026-09-14',
      skorStres: 8,
      skorKeresahan: 6,
      skorKemurungan: 4,
      tahapKeseluruhan: 'normal',
      perluRujukanKKM: false,
      catatanGbk: 'Tahap kesejahteraan emosi berada dalam keadaan terkawal. Motivasi belajar yang memuaskan.',
      statusRujukan: 'tiada',
      dicipta: '2026-09-14T09:00:00.000Z'
    },
    {
      id: 'mhs_2',
      studentId: students[5]?.id || 'stu_6', // Mangsa buli
      tarikh: '2026-09-24',
      skorStres: 24,
      skorKeresahan: 22,
      skorKemurungan: 18,
      tahapKeseluruhan: 'teruk',
      perluRujukanKKM: true,
      catatanGbk: 'Menunjukkan simptom keresahan ketara selepas insiden di sekolah. Sukar tidur dan takut ke sekolah.',
      statusRujukan: 'dirujuk_kkm',
      namaKlinikHospital: 'Klinik Kesihatan Tandek / Hospital Kota Marudu',
      dicipta: '2026-09-24T11:00:00.000Z'
    },
    {
      id: 'mhs_3',
      studentId: students[15]?.id || 'stu_16',
      tarikh: '2026-09-18',
      skorStres: 16,
      skorKeresahan: 14,
      skorKemurungan: 12,
      tahapKeseluruhan: 'sederhana',
      perluRujukanKKM: false,
      catatanGbk: 'Tekanan persediaan SPM. Diberikan bimbingan teknik relaksasi 4-7-8 dan jadual ulangkaji seimbang.',
      statusRujukan: 'dalam_pantauan',
      dicipta: '2026-09-18T10:30:00.000Z'
    }
  ];
}

// ================= MODUL MENTOR-MENTEE =================
export function generateFictitiousMentorMentee(students: Student[]): MentorMenteePair[] {
  return [
    {
      id: 'mm_1',
      mentorUid: 'demo_guru_kelas_3m',
      namaMentor: 'Cikgu Elda Grace Majanil',
      menteeStudentId: students[1]?.id || 'stu_2',
      namaMentee: students[1]?.nama || 'Mentee 1',
      kelasMentee: students[1]?.kelas || '3 Marikh',
      tahun: 2026,
      fokusBimbingan: 'Pengurusan Masa & Kehadiran Kelas',
      logPertemuan: [
        {
          id: 'log_1',
          tarikh: '2026-08-20',
          topik: 'Sesi Suai Kenal & Matlamat Tahun 2026',
          catatan: 'Perbincangan sasaran kehadiran 95% dan minat subjek Geografi.'
        },
        {
          id: 'log_2',
          tarikh: '2026-09-22',
          topik: 'Semakan Prestasi Pertengahan Penggal',
          catatan: 'Murid menunjukkan peningkatan kehadiran dan lebih aktif menjawab soalan di dalam kelas.'
        }
      ]
    },
    {
      id: 'mm_2',
      mentorUid: 'demo_warden',
      namaMentor: 'Cikgu Jerry Mojuntin',
      menteeStudentId: students[8]?.id || 'stu_9',
      namaMentee: students[8]?.nama || 'Mentee 2',
      kelasMentee: students[8]?.kelas || '2 Arif',
      tahun: 2026,
      fokusBimbingan: 'Sahsiah & Disiplin Asrama Desa',
      logPertemuan: [
        {
          id: 'log_3',
          tarikh: '2026-09-10',
          topik: 'Penyesuaian Diri di Asrama',
          catatan: 'Membimbing murid mengatasi rasa rindu keluarga di kampung pedalaman.'
        }
      ]
    }
  ];
}

// ================= MODUL KAUNSELING KERJAYA =================
export function generateFictitiousCareerProfiles(students: Student[]): CareerCounselingProfile[] {
  const form5Students = students.filter(s => s.tingkatan >= 4);
  return form5Students.slice(0, 5).map((stu, idx) => ({
    id: `career_${idx + 1}`,
    studentId: stu.id,
    minatRIASEC: idx % 2 === 0 ? 'Realistik & Konvensional (TVET / Kejuruteraan)' : 'Sosial & Keusahawanan (Pendidikan / Perniagaan)',
    pilihanPascaSPM: idx % 2 === 0
      ? ['Institut Kemahiran MARA (IKM) Kota Kinabalu', 'Kolej Vokasional Kudat', 'Politeknik Kota Kinabalu']
      : ['Tingkatan 6 SMK Salaping', 'Matrikulasi Labuan', 'Universiti Malaysia Sabah (UMS)'],
    rekodBimbingan: [
      {
        tarikh: '2026-09-12',
        halaTuju: 'Penerangan Laluan TVET Sabah & Tajaan Biasiswa Kerajaan Negeri Sabah (BKNS)',
        institusiSasaran: 'IKM Kota Kinabalu / GiatMARA Kota Marudu',
        catatan: 'Murid berminat dalam bidang Automotif dan Pendawaian Elektrik. Telah diberikan risalah syarat kemasukan.'
      }
    ]
  }));
}

// ================= MODUL KAUNSELING ASAL =================
export function generateFictitiousCounseling(students: Student[]): CounselingSession[] {
  const rand = createSeededRandom(77);
  const sessions: CounselingSession[] = [];
  const candidateStudents = students.slice(0, 30);

  const topics = [
    { isu: 'Masalah kehadiran berterusan (Risiko Cicir)', jenis: 'individu' as const, kat: 'ponteng' as const, tindak: 'Pelan motivasi harian dan bantuan sokongan rakan sebaya' },
    { isu: 'Bimbingan Hala Tuju Kerjaya Lepasan SPM', jenis: 'kerjaya' as const, kat: 'kerjaya' as const, tindak: 'Penerangan kursus TVET dan tajaan biasiswa Sabah' },
    { isu: 'Pengurusan Emosi dan Masalah Tekanan Keluarga', jenis: 'krisis' as const, kat: 'emosi' as const, tindak: 'Teknik relaksasi dan perjumpaan berkala seminggu sekali' },
    { isu: 'Rujukan Kes Disiplin - Salah Laku Buli/Merokok', jenis: 'disiplin' as const, kat: 'disiplin' as const, tindak: 'Program intervensi sahsiah terpuji' }
  ];

  for (let i = 0; i < 12; i++) {
    const stu = candidateStudents[Math.floor(rand() * candidateStudents.length)];
    const top = topics[Math.floor(rand() * topics.length)];
    const day = Math.floor(rand() * 25) + 1;

    sessions.push({
      id: `coun_${i + 1}`,
      studentId: stu.id,
      tarikh: `2026-09-${String(day).padStart(2, '0')}`,
      tempohMinit: 45,
      jenisSesi: top.jenis,
      isuUtama: top.isu,
      kategoriIsu: top.kat,
      rujukanDari: i % 2 === 0 ? 'disiplin' : 'guru',
      tahapKeutamaan: i < 3 ? 'tinggi' : 'sederhana',
      catatanSesi: `Murid meluahkan situasi yang dihadapi. Sesi berjalan lancar dalam suasana terapeutik dan beretika. Persetujuan bersama dicapai untuk pemulihan tingkah laku.`,
      tindakanSusulan: top.tindak,
      gbkUid: 'demo_gbk',
      namaGbk: 'Cik Norazimah Binti Abdullah',
      status: rand() > 0.4 ? 'aktif' : 'selesai',
      dicipta: `2026-09-${String(day).padStart(2, '0')}T10:00:00.000Z`
    });
  }

  return sessions;
}

export function generateFictitiousAssistance(students: Student[]): AssistanceRecord[] {
  const records: AssistanceRecord[] = [];
  let aidCounter = 1;

  students.forEach(stu => {
    if (stu.kategoriPendapatan === 'B40') {
      records.push({
        id: `aid_${aidCounter++}`,
        studentId: stu.id,
        jenisBantuan: 'BAP',
        tahun: 2026,
        jumlahBantuan: 150,
        statusAgihan: 'telah_terima',
        tarikhTerima: '2026-01-20',
        catatan: 'Diserahkan dalam Majlis Bantuan Awal Persekolahan KPM'
      });
    }

    if (stu.tingkatan >= 3 && stu.kategoriPendapatan === 'B40' && Math.random() < 0.25) {
      records.push({
        id: `aid_${aidCounter++}`,
        studentId: stu.id,
        jenisBantuan: 'BKP',
        tahun: 2026,
        jumlahBantuan: 700,
        statusAgihan: 'telah_terima',
        tarikhTerima: '2026-03-15',
        catatan: 'Bayaran Fasa 1 BKP ke akaun BSN murid'
      });
    }

    if (stu.oku.status) {
      records.push({
        id: `aid_${aidCounter++}`,
        studentId: stu.id,
        jenisBantuan: 'EMK',
        tahun: 2026,
        jumlahBantuan: 1800,
        statusAgihan: 'telah_terima',
        tarikhTerima: '2026-02-10',
        catatan: 'Elaun EMK KPM bagi murid berkeperluan pendidikan khas'
      });
    }
  });

  return records;
}

export function generateFictitiousFollowUps(students: Student[]): FollowUpAction[] {
  const followUps: FollowUpAction[] = [];
  const rayner = students.find(s => s.nama.includes('Guntabid'));
  const lorita = students.find(s => s.nama.includes('Masudal'));

  if (rayner) {
    followUps.push({
      id: 'fu_1',
      studentId: rayner.id,
      tarikh: '2026-09-28',
      jenis: 'panggilan_telefon',
      pegawaiUid: 'demo_guru_kelas_3m',
      namaPegawai: 'Cikgu Elda Grace Majanil',
      hasil: 'Berjaya hubungi bapa. Bapa memaklumkan jalan perhubungan ke Kg. Sonsogon terputus dan murid tiada kenderaan.',
      status: 'selesai',
      catatan: 'Dicadangkan masuk asrama desa sekiranya ada kekosongan kamar'
    });
    followUps.push({
      id: 'fu_2',
      studentId: rayner.id,
      tarikh: '2026-10-04',
      jenis: 'surat_dihantar',
      pegawaiUid: 'demo_gpk_hem',
      namaPegawai: 'Pn. Masnah Binti Japar (GPK HEM)',
      hasil: 'Surat Amaran Pertama & Panggilan Temu Bual diserahkan melalui Ketua Kampung.',
      status: 'dalam_tindakan',
      catatan: 'Menunggu kehadiran waris ke sekolah'
    });
  }

  if (lorita) {
    followUps.push({
      id: 'fu_3',
      studentId: lorita.id,
      tarikh: '2026-10-02',
      jenis: 'lawatan_rumah',
      pegawaiUid: 'demo_gbk',
      namaPegawai: 'Cik Norazimah Binti Abdullah (GBK)',
      hasil: 'Lawatan Ziarah Cakna ke Kg. Melinsau. Murid menjaga adik kerana ibu bekerja di kebun.',
      status: 'selesai',
      catatan: 'Bantuan keperluan asas disalurkan oleh PIBG & permohonan asrama dibuka'
    });
  }

  return followUps;
}

// ================= GENERATOR FASA 3 =================
export function generateFictitiousAssistanceApplications(students: Student[]): AssistanceApplication[] {
  const rand = createSeededRandom(88);
  const apps: AssistanceApplication[] = [];
  const b40Students = students.filter(s => s.kategoriPendapatan === 'B40').slice(0, 15);

  const statuses: AssistanceApplication['status'][] = ['baharu', 'disemak', 'disyorkan', 'lulus', 'lulus', 'diserah'];
  const types = DEFAULT_ASSISTANCE_TYPES;

  b40Students.forEach((stu, idx) => {
    const t = types[idx % types.length];
    const stat = statuses[idx % statuses.length];
    apps.push({
      id: `app_${idx + 1}`,
      studentId: stu.id,
      jenisBantuan: t,
      sebab: `Keluarga berpendapatan rendah dari ${stu.kampung}. Bapa bekerja sebagai penoreh getah/pekebun sara diri dengan tanggungan 5 orang anak.`,
      kategoriPendapatan: stu.kategoriPendapatan,
      dokumenSokongan: `slip_pendapatan_pengesahan_ketua_kampung_${stu.noMurid.toLowerCase()}.pdf`,
      status: stat,
      tarikhMohon: '2026-09-10',
      tarikhStatus: '2026-09-22',
      pegawaiPenyemak: 'Pn. Grace Liew (Penyelaras Bantuan)',
      catatanKelulusan: stat === 'lulus' || stat === 'diserah' ? 'Disahkan layak oleh Jawatankuasa Bantuan Murid Sekolah (JBMS).' : 'Dalam semakan dokumen asal ketua kampung.'
    });
  });

  return apps;
}

export function generateFictitiousHostelMovements(students: Student[]): HostelMovementLog[] {
  const hostelStudents = students.filter(s => s.penghuniAsrama).slice(0, 8);
  return hostelStudents.map((stu, idx) => ({
    id: `mv_${idx + 1}`,
    studentId: stu.id,
    jenis: idx % 3 === 0 ? 'pulang_bermalam' : idx % 3 === 1 ? 'urusan_keluar' : 'lewat_pulang',
    tarikhKeluar: '2026-10-02',
    masaKeluar: '02:30 PM',
    tarikhJangkaPulang: '2026-10-04',
    tarikhSebenarPulang: idx % 2 === 0 ? '2026-10-04' : undefined,
    tujuan: idx % 2 === 0 ? `Pulang ke ${stu.kampung} untuk urusan kenduri keluarga dan ziarah ibu bapa.` : 'Keluar ke Pekan Kota Marudu membeli kelengkapan asrama & buku kerja.',
    statusKelulusan: idx % 2 === 0 ? 'telah_pulang' : 'diluluskan',
    wardenUid: 'demo_warden',
    namaWarden: 'Cikgu Jerry Mojuntin (Ketua Warden)',
    catatan: 'Permit diluluskan dengan kebenaran ibu bapa melalui WhatsApp/Surat.'
  }));
}

export function generateFictitiousHostelInspections(): HostelInspection[] {
  return [
    {
      id: 'insp_1',
      tarikh: '2026-10-05',
      blok: 'Blok A (Putera)',
      kamar: 'Kamar Kinabalu 1',
      skorKebersihan: 9,
      barangLaranganDitemui: false,
      wardenBertugas: 'Cikgu Jerry Mojuntin',
      tindakan: 'Kamar kemas dan susun atur loker mematuhi standard.'
    },
    {
      id: 'insp_2',
      tarikh: '2026-10-05',
      blok: 'Blok A (Putera)',
      kamar: 'Kamar Kinabalu 2',
      skorKebersihan: 7,
      barangLaranganDitemui: true,
      perincianBarangLarangan: '1 unit pemanas air rendam (water immersion heater) tanpa kelulusan SIRIM.',
      wardenBertugas: 'Cikgu Jerry Mojuntin',
      tindakan: 'Barang disita ke bilik warden dan penghuni diberikan peringatan lisan keselamatan elektrik.'
    },
    {
      id: 'insp_3',
      tarikh: '2026-10-06',
      blok: 'Blok B (Puteri)',
      kamar: 'Kamar Tambuyukon 1',
      skorKebersihan: 10,
      barangLaranganDitemui: false,
      wardenBertugas: 'Ustazah Sakinah',
      tindakan: 'Kamar terbaik mingguan. Layak menerima piala pusingan kebersihan asrama.'
    }
  ];
}

export function generateFictitiousHostelDailyReports(): HostelDailyReport[] {
  return [
    {
      id: 'hdr_1',
      tarikh: '2026-10-08',
      wardenBertugas: 'Cikgu Jerry Mojuntin',
      kiraanMuridMalam: {
        hadir: 38,
        pulangBermalam: 4,
        sakit: 1,
        tiadaKebenaran: 0
      },
      isuKebajikan: '1 murid (Kamar Kinabalu 1) mengalami demam ringan, telah diberikan ubat paracetamol dan berehat di bilik isolasi asrama.',
      catatan: 'Roll call selesai jam 10.15 malam. Semua lampu bilik dipadamkan tepat 11.00 malam.'
    },
    {
      id: 'hdr_2',
      tarikh: '2026-10-07',
      wardenBertugas: 'Ustazah Sakinah',
      kiraanMuridMalam: {
        hadir: 39,
        pulangBermalam: 4,
        sakit: 0,
        tiadaKebenaran: 0
      },
      isuKebajikan: 'Bekalan air graviti asrama stabil. Dewan makan menyajikan hidangan mengikut menu KPM.',
      catatan: 'Kelas persediaan (prep) malam berjalan lancar dipantau warden bertugas.'
    }
  ];
}

export function generateFictitiousSickBay(students: Student[]): SickBayRecord[] {
  const cand = students.slice(10, 16);
  return [
    {
      id: 'sb_1',
      studentId: cand[0].id,
      tarikh: '2026-10-07',
      masaMasuk: '09:15 AM',
      masaKeluar: '11:30 AM',
      simptom: 'Pening kepala, loya dan gastrik selepas tidak sempat bersarapan di rumah.',
      tindakan: 'Diberikan minuman panas, biskut dan berehat di katil bilik kesihatan.',
      dihantarHospital: false,
      penjagaDimaklumkan: true,
      namaGuruBertugas: 'Cikgu Masnah Binti Japar'
    },
    {
      id: 'sb_2',
      studentId: cand[1].id,
      tarikh: '2026-10-08',
      masaMasuk: '10:45 AM',
      masaKeluar: '01:00 PM',
      simptom: 'Terseliuh pergelangan kaki kanan semasa aktiviti Pendidikan Jasmani di padang.',
      tindakan: 'Rawatan awal R.I.C.E (tuaman ais dan balutan elastik) oleh guru PBSM, kemudian dirujuk ke Klinik Kesihatan.',
      dihantarHospital: true,
      namaKlinikHospital: 'Klinik Kesihatan Tandek',
      penjagaDimaklumkan: true,
      namaGuruBertugas: 'Cikgu Elda Grace Majanil'
    }
  ];
}

export function generateFictitious3KInspections(): Inspection3KRecord[] {
  return [
    {
      id: '3k_1',
      tarikh: '2026-10-06',
      kawasan: 'Kantin & Dapur Sekolah',
      aspek: 'keseluruhan',
      skor: 92,
      status: 'cemerlang',
      catatan: 'Tahap kebersihan makanan gred A. Pengendali makanan memakai apron, topi dan suntikan tifoid sah.',
      pemeriksa: 'Pn. Masnah (GPK HEM) & Penyelaras 3K'
    },
    {
      id: '3k_2',
      tarikh: '2026-10-06',
      kawasan: 'Tandas Murid Lelaki (Blok A)',
      aspek: 'kebersihan',
      skor: 68,
      status: 'perlu_tindakan',
      catatan: 'Sinki tersumbat dan terdapat kesan air bertakung. Kontraktor pembersihan telah diarah membaiki paip.',
      pemeriksa: 'Cikgu Jerry Mojuntin'
    },
    {
      id: '3k_3',
      tarikh: '2026-10-07',
      kawasan: 'Makmal Sains & Bengkel RBT',
      aspek: 'keselamatan',
      skor: 95,
      status: 'cemerlang',
      catatan: 'Alat pemadam api berkeadaan baik dan disahkan bomba. Kotak pertolongan cemas lengkap.',
      pemeriksa: 'Penyelaras Keselamatan Sekolah'
    }
  ];
}

export function generateFictitiousPrefects(students: Student[]): Prefect[] {
  const seniorStudents = students.filter(s => s.tingkatan >= 3 && s.status === 'aktif').slice(0, 12);
  const roles: Prefect['jawatan'][] = [
    'Ketua Pengawas',
    'Penolong Ketua Pengawas 1',
    'Penolong Ketua Pengawas 2',
    'Setiausaha',
    'Bendahari',
    'Exco Disiplin',
    'Exco Perhimpunan',
    'Exco Kebersihan',
    'Pengawas',
    'Pengawas',
    'Pengawas',
    'Pengawas'
  ];

  return seniorStudents.map((stu, i) => ({
    id: `pref_${i + 1}`,
    studentId: stu.id,
    jawatan: roles[i] || 'Pengawas',
    sesi: '2026/2027',
    status: 'aktif',
    skorPrestasi: 88 + (i % 10),
    catatanPrestasi: 'Komited bertugas, berdisiplin tinggi dan menjadi teladan sahsiah murid SMK Salaping.'
  }));
}

export function generateFictitiousPrefectDutyRosters(prefects: Prefect[]): PrefectDutyRoster[] {
  const pIds = prefects.map(p => p.id);
  return [
    {
      id: 'roster_1',
      hari: 'Isnin',
      lokasi: 'Pintu Pagar Utama',
      pengawasIds: pIds.slice(0, 3),
      masaTugas: '06:40 AM - 07:15 AM'
    },
    {
      id: 'roster_2',
      hari: 'Isnin',
      lokasi: 'Tapak Perhimpunan',
      pengawasIds: pIds.slice(3, 7),
      masaTugas: '07:10 AM - 08:15 AM'
    },
    {
      id: 'roster_3',
      hari: 'Selasa',
      lokasi: 'Kantin Sekolah',
      pengawasIds: pIds.slice(2, 5),
      masaTugas: '09:40 AM - 10:40 AM (Rehat)'
    },
    {
      id: 'roster_4',
      hari: 'Rabu',
      lokasi: 'Rondaan Blok Akademik',
      pengawasIds: pIds.slice(5, 8),
      masaTugas: '09:40 AM - 10:40 AM (Rehat)'
    }
  ];
}

export function generateFictitiousHemPrograms(): HemProgram[] {
  return [
    {
      id: 'prog_1',
      namaProgram: 'Program Ziarah Cakna & Jejak Murid Cicir Siri 1',
      unit: 'Kebajikan & Biasiswa',
      tarikh: '2026-09-18',
      tempat: 'Kg. Sonsogon, Kg. Melinsau & Kg. Tandek',
      bajetAnggaran: 1200,
      penyelaras: 'Pn. Grace Liew & Kaunselor UBK',
      status: 'selesai',
      kehadiranPeserta: 18,
      refleksi: 'Berjaya menyantuni 6 keluarga berisiko cicir dan menyalurkan kit makanan serta peranti lampu suria kecil.',
      gambarUrl: 'ziarah_cakna_salaping_sep2026.jpg'
    },
    {
      id: 'prog_2',
      namaProgram: 'Kem Kepimpinan Pengawas & PRS SMK Salaping 2026',
      unit: 'Pengawas',
      tarikh: '2026-10-17',
      masa: '08:00 AM - 04:30 PM',
      tempat: 'Dewan Terbuka SMK Salaping & Dataran Tagal',
      bajetAnggaran: 2500,
      penyelaras: 'Penyelaras Pengawas & UBK',
      status: 'dirancang',
      kehadiranPeserta: 45,
      refleksi: 'Fokus pembinaan jati diri, protokol pengurusan perhimpunan rasmi, dan pengucapan awam.'
    },
    {
      id: 'prog_3',
      namaProgram: 'Kempen Kesedaran Anti-Buli & Perlindungan Kanak-kanak (CPP)',
      unit: 'Disiplin',
      tarikh: '2026-09-25',
      tempat: 'Dewan Perdana SMK Salaping',
      bajetAnggaran: 800,
      penyelaras: 'Ketua Guru Disiplin & PPS IPD Kota Marudu',
      status: 'selesai',
      kehadiranPeserta: 238,
      refleksi: 'Semua murid Tingkatan 1 - 5 menandatangani ikrar Sifar Buli. Sesi ceramah pegawai PPS mendapat sambutan positif.'
    },
    {
      id: 'prog_4',
      namaProgram: 'Latihan Kebakaran & Simulasi Pengosongan Bangunan Peringkat Sekolah',
      unit: '3K & Kesihatan',
      tarikh: '2026-10-24',
      tempat: 'Seluruh Blok Sekolah & Tapak Padang',
      bajetAnggaran: 600,
      penyelaras: 'Unit 3K & BBP Kota Marudu',
      status: 'dirancang'
    }
  ];
}

export function generateFictitiousAssemblyDuties(): AssemblyDuty[] {
  return [
    {
      id: 'asm_1',
      minggu: 39,
      tarikh: '2026-10-05',
      guruBertugas: ['Cikgu Elda Grace Majanil', 'Cikgu Jerry Mojuntin'],
      temaPerhimpunan: 'Integriti dan Tanggungjawab Menjaga Harta Benda Sekolah',
      laporanRingkas: 'Perhimpunan berjalan teratur. Pakaian murid kemas. Peringatan diberikan mengenai waktu ketibaan sebelum 7.15 pagi.',
      peringatanTindakan: 'Guru bertugas ronda tandas Blok A semasa rehat.'
    },
    {
      id: 'asm_2',
      minggu: 40,
      tarikh: '2026-10-12',
      guruBertugas: ['Cikgu Masnah Binti Japar', 'Cik Norazimah Abdullah'],
      temaPerhimpunan: 'Budi Bahasa Budaya Kita & Sifar Buli di Sekolah',
      laporanRingkas: 'Jadual bertugas sedia maklum.',
      peringatanTindakan: 'Peringatan serahan borang permohonan biasiswa BKP sebelum 15 Oktober.'
    }
  ];
}

export function generateFictitiousHemMeetings(): HemMeeting[] {
  return [
    {
      id: 'meet_1',
      tajuk: 'Mesyuarat Pengurusan HEM Bil. 3/2026',
      bilangan: 'Bil. 3/2026',
      tarikh: '2026-09-22',
      masa: '02:00 PM - 04:30 PM',
      tempat: 'Bilik Gerakan HEM SMK Salaping',
      pengerusi: 'En. Justin Bin Moduying (Pengetua)',
      pencatatMinit: 'Setiausaha HEM',
      ahliHadir: [
        'En. Justin Bin Moduying (Pengetua)',
        'Pn. Masnah Binti Japar (GPK HEM)',
        'Ketua Guru Disiplin',
        'Cik Norazimah Binti Abdullah (GBK)',
        'Pn. Grace Liew (Penyelaras Bantuan)',
        'Cikgu Jerry Mojuntin (Ketua Warden)'
      ],
      agenda: [
        '1. Perutusan Pengerusi (Pengetua)',
        '2. Pengesahan Minit Mesyuarat Bil. 2/2026',
        '3. Laporan Analisis Kehadiran & Murid Berisiko Cicir (SOP 1:3:7)',
        '4. Status Permohonan Bantuan KWAPM & Agihan BAP',
        '5. Isu Keselamatan Asrama Desa & Bilik Sakit',
        '6. Hal-hal Lain & Penutup'
      ],
      minitRingkas: 'Pengetua menegaskan tindakan intervensi awal bagi murid berisiko cicir di Kg. Sonsogon. Bantuan basikal atau asrama desa perlu diutamakan. Pengurusan asrama desa perlu memperketat rondaan malam.',
      tindakanSusulan: [
        {
          id: 'act_1',
          perkara: 'Menyediakan senarai murid cicir Kg. Sonsogon untuk tawaran bilik asrama desa sesi Oktober.',
          tindakanOlehUid: 'demo_warden',
          namaTindakanOleh: 'Cikgu Jerry Mojuntin (Ketua Warden)',
          tarikhAkhir: '2026-10-15',
          status: 'dalam_tindakan'
        },
        {
          id: 'act_2',
          perkara: 'Menghantar surat panggilan temu bual waris murid amaran ke-3 ke alamat rumah.',
          tindakanOlehUid: 'demo_gpk_hem',
          namaTindakanOleh: 'Pn. Masnah Binti Japar (GPK HEM)',
          tarikhAkhir: '2026-10-10',
          status: 'selesai'
        },
        {
          id: 'act_3',
          perkara: 'Menyemak stok ubat peti kecemasan dan tilam bilik isolasi asrama.',
          tindakanOlehUid: 'demo_guru_biasa',
          namaTindakanOleh: 'Penyelaras 3K & Kesihatan',
          tarikhAkhir: '2026-10-12',
          status: 'belum_selesai'
        }
      ]
    }
  ];
}
