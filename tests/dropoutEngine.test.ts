import { describe, it, expect } from 'vitest';
import { evaluateStudentDropoutRisk } from '../src/services/dropoutEngine';
import { Student, DailyClassAttendance, RulesSettings } from '../src/types';

describe('Dropout Risk Engine (SOP 1:3:7 & Ambang Terkumpul)', () => {
  const mockRules: RulesSettings = {
    sasaranKehadiranSekolah: 90.0,
    ambangRisikoCicir: {
      amaran1HariBerturut: 3,
      amaran2HariBerturut: 10,
      amaran3HariBerturut: 20,
      amaran1PeratusTerkumpul: 85.0,
      amaran2PeratusTerkumpul: 75.0,
      amaran3PeratusTerkumpul: 65.0
    },
    kategoriKesalahan: [],
    kategoriJenayah: [],
    jenisTindakanDisiplin: [],
    panduanLaporPihakLuar: { syaratPolis: '', syaratJKM: '', syaratPPD: '' },
    templatSuratAmaran: { amaran1: '', amaran2: '', amaran3: '' }
  };

  const mockStudent: Student = {
    id: 'stu_test_1',
    noMurid: 'SMKS2026-0001',
    nama: 'Evander Bryan',
    noKP: '090101-12-1234',
    jantina: 'lelaki',
    tarikhLahir: '2009-01-01',
    tingkatan: 3,
    kelas: '3 Marikh',
    tahunMasuk: 2024,
    etnik: 'Rungus',
    agama: 'Kristian',
    kampung: 'Kg. Salaping',
    alamat: 'Kg. Salaping, Kota Marudu',
    caraKeSekolah: 'jalan_kaki',
    jarakKm: 1.5,
    status: 'aktif',
    penjaga: [],
    oku: { status: false },
    kategoriPendapatan: 'B40',
    penghuniAsrama: false,
    dicipta: '2026-01-01',
    dikemaskini: '2026-01-01'
  };

  it('mengembalikan status selamat jika kehadiran murid penuh', () => {
    const attendanceRecords: DailyClassAttendance[] = [
      {
        id: '2026-01-05_3-marikh',
        tarikh: '2026-01-05',
        kelasId: '3-marikh',
        tingkatan: 3,
        direkodOleh: 'guru_1',
        namaPerekod: 'Cikgu Elda',
        masaDirekod: '08:00',
        jumlahHadir: 1,
        jumlahMurid: 1,
        peratus: 100,
        statusPenghantaran: 'dihantar',
        rekod: {
          'stu_test_1': { status: 'hadir' }
        }
      },
      {
        id: '2026-01-06_3-marikh',
        tarikh: '2026-01-06',
        kelasId: '3-marikh',
        tingkatan: 3,
        direkodOleh: 'guru_1',
        namaPerekod: 'Cikgu Elda',
        masaDirekod: '08:00',
        jumlahHadir: 1,
        jumlahMurid: 1,
        peratus: 100,
        statusPenghantaran: 'dihantar',
        rekod: {
          'stu_test_1': { status: 'hadir' }
        }
      }
    ];

    const result = evaluateStudentDropoutRisk(mockStudent, attendanceRecords, mockRules);
    expect(result.riskTier).toBe('selamat');
    expect(result.consecutiveAbsences).toBe(0);
    expect(result.attendancePercentage).toBe(100);
  });

  it('mengesan Amaran 1 jika murid tidak hadir 3 hari berturut-turut', () => {
    const attendanceRecords: DailyClassAttendance[] = [
      '2026-01-05',
      '2026-01-06',
      '2026-01-07',
      '2026-01-08'
    ].map((date, idx) => ({
      id: `${date}_3-marikh`,
      tarikh: date,
      kelasId: '3-marikh',
      tingkatan: 3,
      direkodOleh: 'guru_1',
      namaPerekod: 'Cikgu Elda',
      masaDirekod: '08:00',
      jumlahHadir: idx === 0 ? 1 : 0,
      jumlahMurid: 1,
      peratus: idx === 0 ? 100 : 0,
      statusPenghantaran: 'dihantar',
      rekod: {
        'stu_test_1': { status: idx === 0 ? 'hadir' : 'tidak_hadir' }
      }
    }));

    const result = evaluateStudentDropoutRisk(mockStudent, attendanceRecords, mockRules);
    expect(result.consecutiveAbsences).toBe(3);
    expect(result.riskTier).toBe('amaran1');
    expect(result.cadanganTindakan).toContain('Surat Amaran Pertama');
  });

  it('mengesan Amaran 2 jika murid tidak hadir 10 hari berturut-turut', () => {
    const dates = Array.from({ length: 10 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
    const attendanceRecords: DailyClassAttendance[] = dates.map(date => ({
      id: `${date}_3-marikh`,
      tarikh: date,
      kelasId: '3-marikh',
      tingkatan: 3,
      direkodOleh: 'guru_1',
      namaPerekod: 'Cikgu Elda',
      masaDirekod: '08:00',
      jumlahHadir: 0,
      jumlahMurid: 1,
      peratus: 0,
      statusPenghantaran: 'dihantar',
      rekod: {
        'stu_test_1': { status: 'tidak_hadir' }
      }
    }));

    const result = evaluateStudentDropoutRisk(mockStudent, attendanceRecords, mockRules);
    expect(result.consecutiveAbsences).toBe(10);
    expect(result.riskTier).toBe('amaran2');
    expect(result.cadanganTindakan).toContain('Surat Amaran Kedua');
  });

  it('mengesan Amaran 3 jika murid tidak hadir 20 hari berturut-turut', () => {
    const dates = Array.from({ length: 20 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
    const attendanceRecords: DailyClassAttendance[] = dates.map(date => ({
      id: `${date}_3-marikh`,
      tarikh: date,
      kelasId: '3-marikh',
      tingkatan: 3,
      direkodOleh: 'guru_1',
      namaPerekod: 'Cikgu Elda',
      masaDirekod: '08:00',
      jumlahHadir: 0,
      jumlahMurid: 1,
      peratus: 0,
      statusPenghantaran: 'dihantar',
      rekod: {
        'stu_test_1': { status: 'tidak_hadir' }
      }
    }));

    const result = evaluateStudentDropoutRisk(mockStudent, attendanceRecords, mockRules);
    expect(result.consecutiveAbsences).toBe(20);
    expect(result.riskTier).toBe('amaran3');
    expect(result.cadanganTindakan).toContain('Surat Amaran Terakhir');
  });
});
