import jsPDF from 'jspdf';
import { Student, SchoolSettings, DisciplineCase } from '../types';
import { StudentRiskAssessment } from './dropoutEngine';

function renderSchoolHeader(doc: jsPDF, school: SchoolSettings, rujukanNo: string, todayStr: string, primaryGuardian: any, student: Student) {
  // Header / Kepala Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KEMENTERIAN PENDIDIKAN MALAYSIA', 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text('JABATAN PENDIDIKAN NEGERI SABAH', 105, 24, { align: 'center' });
  doc.setFontSize(12);
  doc.text(school.nama.toUpperCase(), 105, 30, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${school.alamat}, ${school.poskod} ${school.bandar}, ${school.negeri}`, 105, 35, { align: 'center' });
  doc.text(`Tel: ${school.noTelefon} | Emel: ${school.emel} | Kod Sekolah: ${school.kodSekolah}`, 105, 39, { align: 'center' });

  // Garis pemisah berkembar
  doc.setLineWidth(0.8);
  doc.line(20, 42, 190, 42);
  doc.setLineWidth(0.3);
  doc.line(20, 43.5, 190, 43.5);

  // Butiran Rujukan & Tarikh
  doc.setFontSize(9);
  doc.text(`Ruj. Kami : ${rujukanNo}`, 130, 50);
  doc.text(`Tarikh    : ${todayStr}`, 130, 55);

  // Alamat Penjaga
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', 20, 52);
  doc.text((primaryGuardian.nama || 'IBU BAPA / PENJAGA').toUpperCase(), 20, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(student.alamat || `${student.kampung}, 89108 Kota Marudu, Sabah`, 20, 62);
  doc.text(`No. Telefon: ${primaryGuardian.noTel || '-'}`, 20, 67);

  // Salutation
  doc.text('Tuan / Puan,', 20, 75);
}

function renderSchoolClosing(doc: jsPDF, school: SchoolSettings, closingY: number) {
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Sekian, terima kasih.', 20, closingY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('"MALAYSIA MADANI"', 20, closingY + 8);
  doc.text('"BERKHIDMAT UNTUK NEGARA"', 20, closingY + 14);

  doc.setFont('helvetica', 'normal');
  doc.text('Saya yang menjalankan amanah,', 20, closingY + 22);

  // Ruang Tandatangan Pengetua
  doc.text('......................................................', 20, closingY + 40);
  doc.setFont('helvetica', 'bold');
  doc.text(`(${school.namaPengetua.toUpperCase()})`, 20, closingY + 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pengetua,`, 20, closingY + 50);
  doc.text(`${school.nama}, Kota Marudu, Sabah`, 20, closingY + 55);

  doc.setFontSize(8);
  doc.text('s.k. : 1. Fail Hal Ehwal Murid (HEM)', 20, closingY + 64);
  doc.text('      2. Guru Bimbingan dan Kaunseling', 20, closingY + 68);
  doc.text('      3. Fail Disiplin Sekolah', 20, closingY + 72);
}

export function generateSuratAmaranPDF(
  assessment: StudentRiskAssessment,
  school: SchoolSettings,
  templateText?: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { student, consecutiveAbsences, tarikhMulaTidakHadir, tarikhAkhirTidakHadir, riskTier } = assessment;
  const primaryGuardian = student.penjaga[0] || { nama: 'Ibu Bapa / Penjaga', noTel: '', pekerjaan: '' };

  const todayStr = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const rujukanNo = `SMKS/HEM/04/02/01/(${String(Math.floor(Math.random() * 800) + 100)})`;

  renderSchoolHeader(doc, school, rujukanNo, todayStr, primaryGuardian, student);

  // Tajuk Surat
  doc.setFont('helvetica', 'bold');
  const tajukAmaran = riskTier === 'amaran3'
    ? 'SURAT AMARAN KETIGA (TERAKHIR) : KETIDAKHADIRAN KE SEKOLAH'
    : riskTier === 'amaran2'
    ? 'SURAT AMARAN KEDUA : KETIDAKHADIRAN KE SEKOLAH'
    : 'SURAT AMARAN PERTAMA : KETIDAKHADIRAN KE SEKOLAH';
  
  doc.setFontSize(10);
  doc.text(tajukAmaran, 20, 82);
  doc.line(20, 83.5, 190, 83.5);

  // Maklumat Murid Box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 86, 170, 24, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Murid :', 24, 92);
  doc.text('Tingkatan / Kelas :', 24, 98);
  doc.text('Tempoh Ketidakhadiran :', 24, 104);

  doc.setFont('helvetica', 'normal');
  doc.text(`${student.nama} (No. Murid: ${student.noMurid})`, 70, 92);
  doc.text(`${student.kelas} (${student.tingkatan})`, 70, 98);
  
  const datesSpan = tarikhMulaTidakHadir && tarikhAkhirTidakHadir
    ? `${consecutiveAbsences} Hari Berturut-turut (${tarikhMulaTidakHadir} hingga ${tarikhAkhirTidakHadir})`
    : `${consecutiveAbsences} Hari Berturut-turut`;
  doc.text(datesSpan, 70, 104);

  // Kandungan Surat
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');

  let defaultBody = '';
  if (riskTier === 'amaran1') {
    defaultBody = `1. Dengan segala hormatnya dimaklumkan bahawa anak/jagaan tuan/puan seperti nama di atas didapati tidak hadir ke sekolah selama ${consecutiveAbsences} hari berturut-turut tanpa sebarang surat makluman atau sijil sakit daripada doktor perubatan.\n\n2. Sehubungan dengan itu, pihak sekolah memohon kerjasama pihak tuan/puan untuk tampil ke sekolah atau menghubungi Guru Kelas dalam tempoh 7 HARI dari tarikh surat ini bagi mengemukakan sebab-sebab ketidakhadiran beliau.\n\n3. Kehadiran ke sekolah adalah penting bagi memastikan perkembangan sahsiah dan pembelajaran anak tuan/puan tidak tercicir selaras dengan aspirasi Kementerian Pendidikan Malaysia.`;
  } else if (riskTier === 'amaran2') {
    defaultBody = `1. Merujuk kepada perkara di atas dan Surat Peringatan terdahulu, pihak sekolah mendapati bahawa anak/jagaan tuan/puan masih terus tidak hadir ke sekolah selama ${consecutiveAbsences} hari berturut-turut tanpa penjelasan yang munasabah.\n\n2. Tindakan ketidakhadiran berterusan ini menjejaskan rekod persekolahan dan meletakkan murid dalam status Murid Berisiko Cicir.\n\n3. Pihak sekolah MEMOHON TUAN/PUAN DENGAN SEGERA hadir ke sekolah untuk berjumpa dengan Pengetua atau GPK Hal Ehwal Murid bagi membincangkan kebajikan dan masa hadapan persekolahan anak tuan/puan.`;
  } else {
    defaultBody = `1. Dukacita dimaklumkan bahawa anak/jagaan tuan/puan telah tidak hadir ke sekolah selama ${consecutiveAbsences} hari berturut-turut tanpa makluman sehingga ke tarikh surat ini dikeluarkan.\n\n2. Ini adalah AMARAN TERAKHIR sebelum tindakan tatatertib selanjutnya diambil mengikut Peraturan-peraturan Pelajaran (Disiplin Sekolah) 1959 dan Pekeliling Ikhtisas KPM, termasuk kemungkinan pertimbangan tindakan buang sekolah.\n\n3. Sila hadir ke sekolah dalam tempoh 14 HARI dari tarikh surat ini bagi mengelakkan tindakan pengeluaran nama murid daripada daftar sekolah. Kerjasama tuan/puan amat kami hargai.`;
  }

  const textToPrint = templateText || defaultBody;
  const splitText = doc.splitTextToSize(textToPrint, 170);
  doc.text(splitText, 20, 118);

  renderSchoolClosing(doc, school, 195);
  return doc;
}

// Surat Panggilan Penjaga Bagi Kes Disiplin
export function generateSuratPanggilanPenjagaDisiplinPDF(
  c: DisciplineCase,
  student: Student,
  school: SchoolSettings,
  tarikhTemuJanji: string = 'Kadar Segera'
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryGuardian = student.penjaga[0] || { nama: 'Ibu Bapa / Penjaga', noTel: '' };
  const todayStr = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  const rujukanNo = `SMKS/DISP/04/01/(${c.noRujukan.replace(/[^0-9]/g, '').slice(-4) || '101'})`;

  renderSchoolHeader(doc, school, rujukanNo, todayStr, primaryGuardian, student);

  // Tajuk Surat
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('SURAT PANGGILAN IBU BAPA / PENJAGA : KES SALAH LAKU DISIPLIN MURID', 20, 82);
  doc.line(20, 83.5, 190, 83.5);

  // Maklumat Murid Box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 86, 170, 22, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Murid :', 24, 92);
  doc.text('Tingkatan / Kelas :', 24, 98);
  doc.text('Salah Laku Terlibat :', 24, 104);

  doc.setFont('helvetica', 'normal');
  doc.text(`${student.nama} (${student.noMurid})`, 70, 92);
  doc.text(`${student.kelas}`, 70, 98);
  doc.text(`${c.kategori} [Tahap: ${c.tahap.toUpperCase()}]`, 70, 104);

  // Kandungan Surat
  doc.setFontSize(9.5);
  const bodyText = `1. Dengan segala hormatnya perkara di atas adalah dirujuk.\n\n2. Dimaklumkan bahawa anak/jagaan tuan/puan seperti nama di atas didapati terlibat dalam salah laku tatatertib sekolah iaitu (${c.kategori}) pada ${c.tarikhKejadian} di ${c.lokasi}.\n\n3. Sehubungan dengan itu, bagi memastikan proses siasatan yang adil, pertuduhan serta sesi bela diri dapat dijalankan mengikut prosedur SSDM KPM, pihak sekolah MEMOHON KEHADIRAN TUAN/PUAN ke sekolah seperti ketetapan berikut:\n\n   Tarikh / Masa : ${tarikhTemuJanji}\n   Tempat        : Bilik Gerakan HEM / Bilik Disiplin SMK Salaping\n   Pegawai Ditemui : GPK Hal Ehwal Murid / Ketua Guru Disiplin\n\n4. Kerjasama dan keprihatinan pihak tuan/puan amat kami hargai demi membentuk sahsiah terpuji anak jagaan tuan/puan. Kegagalan hadir boleh menyebabkan keputusan tatatertib diputuskan secara 'in-absentia'.`;

  const splitText = doc.splitTextToSize(bodyText, 170);
  doc.text(splitText, 20, 116);

  renderSchoolClosing(doc, school, 195);
  return doc;
}

// Surat Keputusan Tindakan Disiplin Rasmi
export function generateSuratTindakanDisiplinPDF(
  c: DisciplineCase,
  student: Student,
  school: SchoolSettings,
  tindakanMuktamad: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryGuardian = student.penjaga[0] || { nama: 'Ibu Bapa / Penjaga', noTel: '' };
  const todayStr = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  const rujukanNo = `SMKS/DISP/TATA/(${c.noRujukan.replace(/[^0-9]/g, '').slice(-4) || '202'})`;

  renderSchoolHeader(doc, school, rujukanNo, todayStr, primaryGuardian, student);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PEMBERITAHUAN KEPUTUSAN TATATERTIB LEMBAGA DISIPLIN SEKOLAH', 20, 82);
  doc.line(20, 83.5, 190, 83.5);

  // Box
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 86, 170, 22, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Murid :', 24, 92);
  doc.text('Tingkatan / Kelas :', 24, 98);
  doc.text('Keputusan Tindakan :', 24, 104);

  doc.setFont('helvetica', 'normal');
  doc.text(`${student.nama} (${student.noMurid})`, 70, 92);
  doc.text(`${student.kelas}`, 70, 98);
  doc.text(`${tindakanMuktamad.toUpperCase()}`, 70, 104);

  // Kandungan
  doc.setFontSize(9.5);
  const bodyText = `1. Merujuk kepada siasatan salah laku tatatertib (${c.kategori}) melibatkan anak/jagaan tuan/puan yang berlaku pada ${c.tarikhKejadian}.\n\n2. Adalah dimaklumkan bahawa pihak Jawatankuasa Disiplin SMK Salaping telah melengkapkan proses siasatan, sesi pertuduhan dan memberi ruang bela diri serta sesi kaunseling intervensi kepada murid.\n\n3. Mengambil kira rekod lampau murid dan peruntukan Peraturan-Peraturan Pelajaran (Disiplin Sekolah) 1959, Pengetua/Jawatankuasa Disiplin telah memutuskan tindakan tatatertib seperti berikut:\n\n   HUKUMAN / TINDAKAN : ${tindakanMuktamad}\n   PERINCIAN KES      : ${c.perincianKes}\n\n4. Diharapkan tindakan ini dapat memberi pengajaran dan keinsafan kepada anak/jagaan tuan/puan demi masa depan pembelajarannya di SMK Salaping.`;

  const splitText = doc.splitTextToSize(bodyText, 170);
  doc.text(splitText, 20, 116);

  renderSchoolClosing(doc, school, 195);
  return doc;
}

// ================= JANA REKOD PENERIMA BANTUAN & AKUAN TERIMA (PDF) =================
export function generateAssistanceRecipientsPDF(
  records: { studentId: string; jumlahBantuan: number; statusAgihan: string; tarikhTerima?: string }[],
  students: Student[],
  school: SchoolSettings,
  jenisBantuan: string,
  tahun: number
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const todayStr = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  // Kepala Surat Ringkas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KEMENTERIAN PENDIDIKAN MALAYSIA', 105, 16, { align: 'center' });
  doc.setFontSize(11);
  doc.text(school.nama.toUpperCase(), 105, 22, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Peti Surat 188, 89108 Kota Marudu, Sabah | Kod Sekolah: ${school.kodSekolah}`, 105, 27, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(15, 30, 195, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`SENARAI PENERIMA DAN AKUAN PENYERAHAN ${jenisBantuan.toUpperCase()}`, 15, 38);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Persekolahan: ${tahun} | Tarikh Cetakan: ${todayStr}`, 15, 43);

  // Header Jadual
  let y = 50;
  doc.setFillColor(230, 240, 255);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Bil', 17, y + 5.5);
  doc.text('Nama Murid', 26, y + 5.5);
  doc.text('Kelas', 95, y + 5.5);
  doc.text('Jumlah (RM)', 115, y + 5.5);
  doc.text('Status / Tarikh', 140, y + 5.5);
  doc.text('Tandatangan Waris', 165, y + 5.5);

  y += 8;
  doc.setFont('helvetica', 'normal');

  records.forEach((r, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const stu = students.find(s => s.id === r.studentId);
    doc.text(String(idx + 1), 17, y + 5);
    doc.text((stu?.nama || 'Murid').slice(0, 36), 26, y + 5);
    doc.text(stu?.kelas || '-', 95, y + 5);
    doc.text(`RM ${r.jumlahBantuan}`, 115, y + 5);
    doc.text(r.statusAgihan === 'telah_terima' ? `Diserah (${r.tarikhTerima || 'OK'})` : 'Layak', 140, y + 5);
    doc.text('....................', 165, y + 5);

    doc.setDrawColor(220, 220, 220);
    doc.line(15, y + 7, 195, y + 7);
    y += 7.5;
  });

  // Pengesahan GPK HEM
  if (y > 240) {
    doc.addPage();
    y = 25;
  } else {
    y += 10;
  }

  doc.setFontSize(9);
  doc.text('Disahkan oleh Penyelaras Bantuan / GPK HEM:', 15, y);
  doc.text('................................................................', 15, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`(${school.namaGpkHem.toUpperCase()})`, 15, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('GPK Hal Ehwal Murid, SMK Salaping', 15, y + 26);

  return doc;
}

// ================= JANA LAPORAN RINGKASAN EKSEKUTIF HEM (1 HALAMAN) =================
export function generateExecutiveHemReportPDF(
  kpis: {
    enrolmen: number;
    hadirPeratus: number;
    muridCicirBil: number;
    kesDisiplinBil: number;
    kesBuliBil: number;
    bantuanAgihanPeratus: number;
  },
  school: SchoolSettings,
  year: number
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const todayStr = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  // Kepala Surat Rasmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('KEMENTERIAN PENDIDIKAN MALAYSIA', 105, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text(school.nama.toUpperCase(), 105, 20, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${school.alamat}, ${school.bandar}, Sabah | Kod: ${school.kodSekolah}`, 105, 25, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(15, 28, 195, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`LAPORAN EKSEKUTIF PENGURUSAN HAL EHWAL MURID (HEM) TAHUN ${year}`, 105, 36, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dokumen Makluman Pengetua / PPD Kota Marudu | Tarikh: ${todayStr}`, 105, 41, { align: 'center' });

  // Kotak KPI Utama
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, 47, 180, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. KPI & PRESTASI UTAMA HEM TAHUN SEMASA', 20, 54);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Jumlah Enrolmen Berdaftar   : ${kpis.enrolmen} Orang Murid (Tingkatan 1 - 5)`, 22, 61);
  doc.text(`• Purata Kehadiran Sekolah    : ${kpis.hadirPeratus.toFixed(1)}% (Sasaran Kebangsaan: 90.0%)`, 22, 67);
  doc.text(`• Murid Dalam Amaran Cicir   : ${kpis.muridCicirBil} Orang (Dipantau di bawah SOP 1:3:7)`, 22, 73);
  doc.text(`• Jumlah Kes Salah Laku SSDM : ${kpis.kesDisiplinBil} Kes Direkodkan (100% Selesai Kaunseling)`, 110, 61);
  doc.text(`• Kes Aduan Buli / CPP       : ${kpis.kesBuliBil} Kes (Tindakan Siasatan & Pantauan Aktif)`, 110, 67);
  doc.text(`• Kemajuan Agihan Bantuan    : ${kpis.bantuanAgihanPeratus.toFixed(0)}% Peruntukan Telah Diagihkan`, 110, 73);

  // Bahagian Analisis Trend
  let y = 90;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. ANALISIS TREND & CABARAN KHUSUS KOTA MARUDU', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const trendText = `Berdasarkan pemantauan geografi SMK Salaping, faktor utama ponteng dan ketidakhadiran berturut-turut adalah berpunca daripada ketiadaan pengangkutan awam serta jarak kediaman pedalaman melebihi 15 km (contohnya murid dari Kg. Sonsogon dan Kg. Melinsau). Pengurusan HEM telah menggerakkan tindakan bersepadu termasuk tawaran penempatan di Asrama Desa dan Ziarah Cakna.`;
  doc.text(doc.splitTextToSize(trendText, 180), 15, y);

  // Cadangan Intervensi Berdasarkan Data
  y += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('3. CADANGAN INTERVENSI & PELAN TINDAKAN PENTADBIRAN', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const cadanganText = `1. Memperluas kapasiti kuota Asrama Desa bagi menempatkan murid B40 berisiko cicir dari kawasan pedalaman ekstrem.\n2. Mengukuhkan program Ziarah Cakna bersama Ketua Kampung & JKKK untuk menyerahkan surat amaran dan menyelesaikan kekangan ekonomi keluarga.\n3. Mempercepatkan serahan bantuan KWAPM & BAP secara tunai di sekolah bagi mengurangkan beban pembelian kelengkapan asas.\n4. Melaksanakan saringan minda sihat DASS secara berkala oleh GBK bagi menangani isu tekanan sosioemosi remaja.`;
  doc.text(doc.splitTextToSize(cadanganText, 180), 15, y);

  // Ruang Tandatangan Pengesahan
  y += 45;
  doc.setFontSize(9);
  doc.text('Disediakan oleh:', 20, y);
  doc.text('Disahkan oleh:', 125, y);

  y += 18;
  doc.text('......................................................', 20, y);
  doc.text('......................................................', 125, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`(${school.namaGpkHem.toUpperCase()})`, 20, y + 5);
  doc.text(`(${school.namaPengetua.toUpperCase()})`, 125, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('GPK Hal Ehwal Murid', 20, y + 10);
  doc.text('Pengetua, SMK Salaping', 125, y + 10);

  return doc;
}

// ================= JANA MINIT MESYUARAT HEM (PDF) =================
export function generateMeetingMinutesPDF(meeting: any, school: SchoolSettings): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(school.nama.toUpperCase(), 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`MINIT MESYUARAT HAL EHWAL MURID (HEM) ${meeting.bilangan.toUpperCase()}`, 105, 25, { align: 'center' });

  doc.setLineWidth(0.4);
  doc.line(15, 30, 195, 30);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tarikh  : ${meeting.tarikh}`, 15, 38);
  doc.text(`Masa    : ${meeting.masa}`, 15, 43);
  doc.text(`Tempat  : ${meeting.tempat}`, 15, 48);
  doc.text(`Pengerusi: ${meeting.pengerusi}`, 15, 53);

  doc.setFont('helvetica', 'bold');
  doc.text('Ahli Hadir:', 15, 61);
  doc.setFont('helvetica', 'normal');
  meeting.ahliHadir.forEach((ahli: string, i: number) => {
    doc.text(`${i + 1}. ${ahli}`, 20, 67 + i * 5);
  });

  let y = 67 + meeting.ahliHadir.length * 5 + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Minit & Keputusan:', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(meeting.minitRingkas, 180), 15, y);

  y += 30;
  doc.setFont('helvetica', 'bold');
  doc.text('Tindakan Susulan Mesyuarat:', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  meeting.tindakanSusulan.forEach((t: any, idx: number) => {
    doc.text(`${idx + 1}. ${t.perkara} (Tindakan: ${t.namaTindakanOleh} | Tarikh: ${t.tarikhAkhir})`, 20, y);
    y += 6;
  });

  return doc;
}
