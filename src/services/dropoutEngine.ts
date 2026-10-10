import { Student, DailyClassAttendance, RulesSettings, SchoolSettings } from '../types';

export interface StudentRiskAssessment {
  student: Student;
  consecutiveAbsences: number;
  consecutiveDates: string[];
  totalAbsences: number;
  totalDaysRecorded: number;
  attendancePercentage: number;
  riskTier: 'selamat' | 'amaran1' | 'amaran2' | 'amaran3';
  riskLabel: string;
  cadanganTindakan: string;
  tarikhMulaTidakHadir?: string;
  tarikhAkhirTidakHadir?: string;
}

export function evaluateStudentDropoutRisk(
  student: Student,
  attendanceRecords: DailyClassAttendance[],
  rules: RulesSettings
): StudentRiskAssessment {
  // Susun rekod mengikut tarikh menaik
  const studentRecords = attendanceRecords
    .filter(a => a.rekod && a.rekod[student.id])
    .sort((a, b) => a.tarikh.localeCompare(b.tarikh));

  const totalDaysRecorded = studentRecords.length;
  if (totalDaysRecorded === 0) {
    return {
      student,
      consecutiveAbsences: 0,
      consecutiveDates: [],
      totalAbsences: 0,
      totalDaysRecorded: 0,
      attendancePercentage: 100,
      riskTier: 'selamat',
      riskLabel: 'Normal',
      cadanganTindakan: 'Tiada rekod mencukupi'
    };
  }

  let totalHadir = 0;
  let totalAbsences = 0;

  studentRecords.forEach(rec => {
    const item = rec.rekod[student.id];
    if (item.status === 'hadir' || item.status === 'lewat' || item.status === 'urusan_rasmi') {
      totalHadir++;
    } else if (item.status === 'tidak_hadir') {
      totalAbsences++;
    }
  });

  const attendancePercentage = Number(((totalHadir / totalDaysRecorded) * 100).toFixed(1));

  // Kira ketidakhadiran berturut-turut dari hari terkini ke belakang
  let consecutiveAbsences = 0;
  const consecutiveDates: string[] = [];

  for (let i = studentRecords.length - 1; i >= 0; i--) {
    const item = studentRecords[i].rekod[student.id];
    // Tidak hadir tanpa surat rasmi dikira sebagai ponteng/tidak hadir berturut-turut
    if (item.status === 'tidak_hadir') {
      consecutiveAbsences++;
      consecutiveDates.unshift(studentRecords[i].tarikh);
    } else {
      break;
    }
  }

  const ambang = rules.ambangRisikoCicir;
  let riskTier: StudentRiskAssessment['riskTier'] = 'selamat';
  let riskLabel = 'Kehadiran Memuaskan';
  let cadanganTindakan = 'Teruskan pemantauan berkala';

  if (
    consecutiveAbsences >= ambang.amaran3HariBerturut ||
    (totalDaysRecorded >= 15 && attendancePercentage <= ambang.amaran3PeratusTerkumpul)
  ) {
    riskTier = 'amaran3';
    riskLabel = 'Amaran 3 (Kritikal / Buang Sekolah)';
    cadanganTindakan = 'Keluarkan Surat Amaran Terakhir & Panggilan Mesyuarat Tatatertib HEM';
  } else if (
    consecutiveAbsences >= ambang.amaran2HariBerturut ||
    (totalDaysRecorded >= 15 && attendancePercentage <= ambang.amaran2PeratusTerkumpul)
  ) {
    riskTier = 'amaran2';
    riskLabel = 'Amaran 2 (Risiko Tinggi)';
    cadanganTindakan = 'Keluarkan Surat Amaran Kedua & Sesi Bimbingan Kaunselor / Ziarah Cakna';
  } else if (
    consecutiveAbsences >= ambang.amaran1HariBerturut ||
    (totalDaysRecorded >= 15 && attendancePercentage <= ambang.amaran1PeratusTerkumpul)
  ) {
    riskTier = 'amaran1';
    riskLabel = 'Amaran 1 (Awal)';
    cadanganTindakan = 'Keluarkan Surat Amaran Pertama & Hubungi Penjaga (WhatsApp/Panggilan)';
  }

  return {
    student,
    consecutiveAbsences,
    consecutiveDates,
    totalAbsences,
    totalDaysRecorded,
    attendancePercentage,
    riskTier,
    riskLabel,
    cadanganTindakan,
    tarikhMulaTidakHadir: consecutiveDates[0],
    tarikhAkhirTidakHadir: consecutiveDates[consecutiveDates.length - 1]
  };
}

export function evaluateAllStudentsRisk(
  students: Student[],
  attendanceRecords: DailyClassAttendance[],
  rules: RulesSettings
): StudentRiskAssessment[] {
  return students
    .map(student => evaluateStudentDropoutRisk(student, attendanceRecords, rules))
    .sort((a, b) => {
      // Prioritise amaran3 -> amaran2 -> amaran1 -> selamat, then consecutive days descending
      const weight = { amaran3: 3, amaran2: 2, amaran1: 1, selamat: 0 };
      if (weight[b.riskTier] !== weight[a.riskTier]) {
        return weight[b.riskTier] - weight[a.riskTier];
      }
      return b.consecutiveAbsences - a.consecutiveAbsences;
    });
}

export function generateWhatsAppMessage(
  assessment: StudentRiskAssessment,
  school: SchoolSettings
): string {
  const { student, consecutiveAbsences, tarikhMulaTidakHadir, tarikhAkhirTidakHadir, riskTier } = assessment;
  const primaryGuardian = student.penjaga[0] || { nama: 'Ibu Bapa / Penjaga', noTel: '' };

  const datesNotice = tarikhMulaTidakHadir && tarikhAkhirTidakHadir
    ? (tarikhMulaTidakHadir === tarikhAkhirTidakHadir ? `pada ${tarikhMulaTidakHadir}` : `dari ${tarikhMulaTidakHadir} hingga ${tarikhAkhirTidakHadir}`)
    : 'kebelakangan ini';

  const tierText = riskTier === 'amaran3'
    ? 'SURAT AMARAN KETIGA / TERAKHIR'
    : riskTier === 'amaran2'
    ? 'SURAT AMARAN KEDUA'
    : 'SURAT AMARAN PERTAMA';

  return `Salam sejahtera Tuan/Puan ${primaryGuardian.nama},

Daripada: Unit Hal Ehwal Murid (HEM), ${school.nama}, Kota Marudu.

MAKLUMAN KETIDAKHADIRAN MURID KE SEKOLAH (${tierText})

Nama Murid: ${student.nama}
Tingkatan / Kelas: ${student.kelas}
Hari Berturut Tidak Hadir: ${consecutiveAbsences} hari (${datesNotice})

Dukacita dimaklumkan bahawa anak/jagaan tuan/puan tidak hadir ke sekolah tanpa kenyataan rasmi atau surat cuti sakit. Pihak sekolah amat menitikberatkan kehadiran demi masa depan anak tuan/puan.

Sila hubungi Guru Kelas (${student.kelas}) atau pihak pentadbiran HEM SMK Salaping di talian ${school.noTelefon} dengan segera untuk makluman sebab ketidakhadiran.

Sekian, terima kasih.
"${school.motoSekolah}"
Unit Hal Ehwal Murid, ${school.nama}`;
}

export function formatWhatsAppUrl(phone: string, text: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '60' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
