import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, ClassInfo } from '../types';
import { SABAH_ETHNICS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import { bulkImportStudents } from '../services/dataService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2
} from 'lucide-react';

interface ParsedClassStudent {
  tempId: string;
  nama: string;
  noKP: string;
  jantina: 'lelaki' | 'perempuan';
  etnik: string;
  kampung: string;
  telPenjaga: string;
  isDuplicate: boolean;
  isAutoIC: boolean;
}

interface ClassItem {
  id: string;
  nama: string;
  tingkatan: number;
  tahun?: number;
}

interface ClassStudentBatchModalProps {
  classesList: ClassItem[];
  existingStudents: Student[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClass?: string;
}

export const ClassStudentBatchModal: React.FC<ClassStudentBatchModalProps> = ({
  classesList,
  existingStudents,
  isOpen,
  onClose,
  onSuccess,
  initialClass
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useSchool();

  // Find initial class info
  const defaultClass = classesList.find(c => c.nama === initialClass) || classesList[0] || {
    id: '1-arif',
    nama: '1 Arif',
    tingkatan: 1
  };

  // State: Class Settings
  const [selectedClassName, setSelectedClassName] = useState<string>(defaultClass.nama);
  const selectedClassObj = classesList.find(c => c.nama === selectedClassName) || defaultClass;
  const tingkatan = selectedClassObj.tingkatan || 1;
  const [defaultKampung, setDefaultKampung] = useState('Kg. Salaping');
  const [penghuniAsramaDefault, setPenghuniAsramaDefault] = useState(false);

  // State: Tab Input Method
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');

  // State: File Upload & Paste
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // State: Parsed Students List & Errors
  const [parsedList, setParsedList] = useState<ParsedClassStudent[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Existing IC set for quick duplicate checking
  const existingICSet = new Set(existingStudents.map(s => s.noKP.replace(/[^0-9]/g, '')));

  // Smart Helper: Detect Gender from Name or IC
  const detectGender = (name: string, ic?: string): 'lelaki' | 'perempuan' => {
    const cleanName = name.toUpperCase();
    if (
      cleanName.includes('BIN ') ||
      cleanName.includes(' B. ') ||
      cleanName.includes(' A/L ') ||
      cleanName.includes('ANAK LELAKI')
    ) {
      return 'lelaki';
    }
    if (
      cleanName.includes('BINTI ') ||
      cleanName.includes(' BT. ') ||
      cleanName.includes(' BT ') ||
      cleanName.includes(' A/P ') ||
      cleanName.includes('ANAK PEREMPUAN')
    ) {
      return 'perempuan';
    }

    // Check last digit of IC if available
    if (ic) {
      const digits = ic.replace(/[^0-9]/g, '');
      if (digits.length >= 1) {
        const lastDigit = parseInt(digits.slice(-1), 10);
        if (!isNaN(lastDigit)) {
          return lastDigit % 2 === 0 ? 'perempuan' : 'lelaki';
        }
      }
    }

    return 'lelaki';
  };

  // Smart Helper: Generate Realistic IC for Student by Tingkatan
  const generateRealisticIC = (form: number, gender: 'lelaki' | 'perempuan', seq: number): string => {
    // Current year is 2026.
    // Tingkatan 1 -> ~13 y/o -> birth year 2013 (13)
    // Tingkatan 2 -> ~14 y/o -> birth year 2012 (12)
    // Tingkatan 3 -> ~15 y/o -> birth year 2011 (11)
    // Tingkatan 4 -> ~16 y/o -> birth year 2010 (10)
    // Tingkatan 5 -> ~17 y/o -> birth year 2009 (09)
    const birthYear = (26 - form).toString().padStart(2, '0');
    const month = String(1 + ((seq * 3) % 12)).padStart(2, '0');
    const day = String(1 + ((seq * 7) % 28)).padStart(2, '0');
    const stateCode = '12'; // Sabah State IC code
    const baseNum = String(100 + (seq % 800)).padStart(3, '0');
    const lastDigit = gender === 'lelaki' ? (1 + (seq % 5) * 2) : ((seq % 5) * 2);

    return `${birthYear}${month}${day}-${stateCode}-${baseNum}${lastDigit}`;
  };

  // Clean Name Helper (removes "1. ", "01. ", "1) ", bullet characters)
  const cleanStudentName = (raw: string): string => {
    return raw
      .replace(/^[\s\d]+[.)\-–]\s*/, '') // Remove leading numbers like 1. or 01)
      .replace(/^[•\-\*]\s*/, '')        // Remove bullets
      .replace(/\s+/g, ' ')              // Normalize spaces
      .trim();
  };

  // Process Rows of Data
  const processRawRows = (rows: Array<{ name: string; ic?: string; gender?: string; etnik?: string; kampung?: string; phone?: string }>) => {
    setParseErrors([]);
    const errors: string[] = [];
    const results: ParsedClassStudent[] = [];

    rows.forEach((row, index) => {
      const cleanedName = cleanStudentName(row.name || '');
      if (!cleanedName || cleanedName.length < 2) return;

      const rawGender = (row.gender || '').trim().toLowerCase();
      let gender: 'lelaki' | 'perempuan' = detectGender(cleanedName, row.ic);
      if (rawGender.startsWith('p') || rawGender === 'f' || rawGender.includes('perempuan')) {
        gender = 'perempuan';
      } else if (rawGender.startsWith('l') || rawGender === 'm' || rawGender.includes('lelaki')) {
        gender = 'lelaki';
      }

      let ic = (row.ic || '').trim();
      let isAutoIC = false;

      // Clean IC formatting
      const cleanDigits = ic.replace(/[^0-9]/g, '');
      if (cleanDigits.length === 12) {
        ic = `${cleanDigits.slice(0, 6)}-${cleanDigits.slice(6, 8)}-${cleanDigits.slice(8, 12)}`;
      } else if (cleanDigits.length > 0 && cleanDigits.length !== 12) {
        errors.push(`Baris ${index + 1} (${cleanedName}): No. KP "${ic}" tidak lengkap (12 digit). No. KP sementara dijana.`);
        ic = generateRealisticIC(tingkatan, gender, index + 1);
        isAutoIC = true;
      } else {
        ic = generateRealisticIC(tingkatan, gender, index + 1);
        isAutoIC = true;
      }

      const isDuplicate = existingICSet.has(ic.replace(/[^0-9]/g, ''));

      results.push({
        tempId: `tmp_${Date.now()}_${index}`,
        nama: cleanedName.toUpperCase(),
        noKP: ic,
        jantina: gender,
        etnik: row.etnik?.trim() || 'Rungus',
        kampung: row.kampung?.trim() || defaultKampung,
        telPenjaga: row.phone?.trim() || '019-8000000',
        isDuplicate,
        isAutoIC
      });
    });

    if (results.length === 0) {
      setParseErrors(['Tiada rekod nama murid yang sah dikesan. Sila semak fail atau teks yang dimasukkan.']);
      return;
    }

    setParsedList(results);
    setParseErrors(errors);
  };

  // Handle Excel or CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length === 0) {
          setParseErrors(['Fail Excel/CSV kosong.']);
          setIsProcessing(false);
          return;
        }

        // Find header row or default to row 0
        let headerRowIndex = 0;
        let nameCol = -1;
        let icCol = -1;
        let genderCol = -1;
        let etnikCol = -1;
        let kampungCol = -1;
        let phoneCol = -1;

        // Scan first 5 rows to locate headers
        for (let r = 0; r < Math.min(5, rawJson.length); r++) {
          const row = rawJson[r] || [];
          row.forEach((cell: any, cIdx: number) => {
            const val = String(cell || '').trim().toLowerCase();
            if (val.match(/nama|name|pelajar|murid/i) && nameCol === -1) {
              nameCol = cIdx;
              headerRowIndex = r;
            } else if (val.match(/kp|ic|kad pengenalan|no.*kp|identiti/i) && icCol === -1) {
              icCol = cIdx;
            } else if (val.match(/jantina|sex|gender/i) && genderCol === -1) {
              genderCol = cIdx;
            } else if (val.match(/etnik|kaum|bangsa/i) && etnikCol === -1) {
              etnikCol = cIdx;
            } else if (val.match(/kampung|alamat/i) && kampungCol === -1) {
              kampungCol = cIdx;
            } else if (val.match(/tel|telefon|hp|phone|penjaga/i) && phoneCol === -1) {
              phoneCol = cIdx;
            }
          });
          if (nameCol !== -1) break;
        }

        // Fallback: if header wasn't explicitly found, assume column 0 is name or column 1 if column 0 is sequence number
        if (nameCol === -1) {
          const firstRow = rawJson[0] || [];
          if (firstRow.length > 1 && !isNaN(Number(firstRow[0]))) {
            nameCol = 1;
            icCol = firstRow.length > 2 ? 2 : -1;
            headerRowIndex = -1; // start from row 0
          } else {
            nameCol = 0;
            headerRowIndex = -1;
          }
        }

        const rowsToProcess: Array<{ name: string; ic?: string; gender?: string; etnik?: string; kampung?: string; phone?: string }> = [];

        for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          const rawName = String(row[nameCol] || '').trim();
          if (!rawName || rawName.match(/^(bil|no|nama|name)$/i)) continue;

          rowsToProcess.push({
            name: rawName,
            ic: icCol !== -1 ? String(row[icCol] || '') : undefined,
            gender: genderCol !== -1 ? String(row[genderCol] || '') : undefined,
            etnik: etnikCol !== -1 ? String(row[etnikCol] || '') : undefined,
            kampung: kampungCol !== -1 ? String(row[kampungCol] || '') : undefined,
            phone: phoneCol !== -1 ? String(row[phoneCol] || '') : undefined
          });
        }

        processRawRows(rowsToProcess);
      } catch (err) {
        setParseErrors(['Ralat membaca fail: ' + (err instanceof Error ? err.message : 'Format tidak disokong.')]);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Text Paste Parsing
  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      setParseErrors(['Sila masukkan atau tampal senarai nama murid terlebih dahulu.']);
      return;
    }

    const lines = pasteText.split('\n');
    const rowsToProcess: Array<{ name: string; ic?: string; gender?: string; etnik?: string }> = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // If separated by tabs or commas
      if (trimmed.includes('\t') || trimmed.includes(',')) {
        const parts = (trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(',')).map(p => p.trim());
        // Check if first token is just a number
        let nameIdx = 0;
        if (!isNaN(Number(parts[0])) && parts.length > 1) {
          nameIdx = 1;
        }

        const name = parts[nameIdx];
        const ic = parts[nameIdx + 1];
        const gender = parts[nameIdx + 2];
        const etnik = parts[nameIdx + 3];

        rowsToProcess.push({ name, ic, gender, etnik });
      } else {
        // Plain single line name
        rowsToProcess.push({ name: trimmed });
      }
    });

    processRawRows(rowsToProcess);
  };

  // Download Pre-Formatted Excel Template for this class
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Bil': 1,
        'Nama Murid': 'MOHD AZLAN BIN AWANG',
        'No. Kad Pengenalan': `${(26 - tingkatan).toString().padStart(2, '0')}0315-12-1023`,
        'Jantina': 'Lelaki',
        'Etnik': 'Rungus',
        'Kampung': 'Kg. Salaping',
        'No Tel Penjaga': '019-8123456'
      },
      {
        'Bil': 2,
        'Nama Murid': 'NURUL SHAHIRA BINTI ROSTAM',
        'No. Kad Pengenalan': `${(26 - tingkatan).toString().padStart(2, '0')}0722-12-2044`,
        'Jantina': 'Perempuan',
        'Etnik': 'Bajau',
        'Kampung': 'Kg. Tandek',
        'No Tel Penjaga': '019-8234567'
      },
      {
        'Bil': 3,
        'Nama Murid': 'JUSTIN ANAK MODUYING',
        'No. Kad Pengenalan': `${(26 - tingkatan).toString().padStart(2, '0')}1105-12-3067`,
        'Jantina': 'Lelaki',
        'Etnik': 'Dusun',
        'Kampung': 'Kg. Goshen',
        'No Tel Penjaga': '019-8345678'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Senarai_${selectedClassName}`);
    XLSX.writeFile(workbook, `Templat_Senarai_Murid_${selectedClassName.replace(/\s+/g, '_')}_SMK_Salaping.xlsx`);
  };

  // Handle Remove Student from preview
  const handleRemoveItem = (tempId: string) => {
    setParsedList(prev => prev.filter(item => item.tempId !== tempId));
  };

  // Toggle gender on click
  const handleToggleGender = (tempId: string) => {
    setParsedList(prev =>
      prev.map(item =>
        item.tempId === tempId
          ? { ...item, jantina: item.jantina === 'lelaki' ? 'perempuan' : 'lelaki' }
          : item
      )
    );
  };

  // Handle Final Registration Submit
  const handleConfirmRegistration = async () => {
    if (parsedList.length === 0) return;

    try {
      setSaving(true);
      const operator = currentUser || { uid: 'guru_data', nama: 'Guru Data HEM' };

      const studentsToInsert: Student[] = parsedList.map((item, idx) => {
        const studentId = `stu_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const noMurid = `SMKS2026-${String(idx + 1).padStart(3, '0')}`;

        return {
          id: studentId,
          noMurid,
          nama: item.nama,
          noKP: item.noKP,
          jantina: item.jantina,
          tarikhLahir: `20${item.noKP.slice(0, 2)}-${item.noKP.slice(2, 4)}-${item.noKP.slice(4, 6)}`,
          tingkatan,
          kelas: selectedClassName,
          tahunMasuk: 2026,
          etnik: item.etnik || 'Rungus',
          agama: item.nama.includes('BIN ') || item.nama.includes('BINTI ') ? 'Islam' : 'Kristian',
          kampung: item.kampung || defaultKampung,
          alamat: `${item.kampung || defaultKampung}, 89108 Kota Marudu, Sabah`,
          caraKeSekolah: 'jalan_kaki',
          jarakKm: penghuniAsramaDefault ? 18 : 3,
          status: 'aktif',
          penjaga: [
            {
              nama: `Penjaga ${item.nama}`,
              hubungan: 'penjaga',
              noTel: item.telPenjaga || '019-8000000',
              pekerjaan: 'B40'
            }
          ],
          oku: { status: false },
          kategoriPendapatan: 'B40',
          penghuniAsrama: penghuniAsramaDefault,
          dicipta: new Date().toISOString(),
          dikemaskini: new Date().toISOString()
        };
      });

      const inserted = await bulkImportStudents(studentsToInsert, {
        uid: operator.uid,
        nama: operator.nama
      });

      showToast(`Berjaya! ${inserted} orang murid telah didaftarkan ke dalam kelas ${selectedClassName}.`, 'success');
      onSuccess();
    } catch (err) {
      showToast('Gagal mendaftar senarai murid: ' + (err instanceof Error ? err.message : 'Ralat pangkalan data.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const countLelaki = parsedList.filter(s => s.jantina === 'lelaki').length;
  const countPerempuan = parsedList.filter(s => s.jantina === 'perempuan').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6 flex flex-col max-h-[92vh] space-y-4">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Pendaftaran Pukal Sekelas
                </span>
                <span className="text-xs text-slate-500 font-medium">Sesi 2026 • SMK Salaping</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Daftar Senarai Murid Mengikut Kelas (Upload Sekelas)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Langkah 1: Pilihan Kelas Sasaran & Tetapan Asas */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span>1. Pilih Kelas Sasaran & Tetapan Lalai Sekelas</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 text-[11px] hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Muat Turun Templat Excel ({selectedClassName})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kelas Sasaran:</label>
                <select
                  value={selectedClassName}
                  onChange={e => setSelectedClassName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 bg-white"
                >
                  {classesList.map(c => (
                    <option key={c.id} value={c.nama}>
                      {c.nama} (Tingkatan {c.tingkatan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kampung Lalai (Kota Marudu):</label>
                <input
                  type="text"
                  value={defaultKampung}
                  onChange={e => setDefaultKampung(e.target.value)}
                  placeholder="Contoh: Kg. Salaping"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Asrama Desa:</label>
                <select
                  value={penghuniAsramaDefault ? 'ya' : 'tidak'}
                  onChange={e => setPenghuniAsramaDefault(e.target.value === 'ya')}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 bg-white"
                >
                  <option value="tidak">Bukan Penghuni Asrama (Harian)</option>
                  <option value="ya">Penghuni Asrama Desa SMK Salaping</option>
                </select>
              </div>
            </div>
          </div>

          {/* Langkah 2: Kaedah Memasukkan Senarai (Upload File vs Paste Text) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>2. Kaedah Memasukkan Senarai Pelajar</span>
              </span>

              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setInputMethod('upload')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                    inputMethod === 'upload'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Fail (.xlsx / .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMethod('paste')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                    inputMethod === 'paste'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tampal Teks / WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Upload File */}
            {inputMethod === 'upload' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv, .txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-extrabold text-sm text-slate-900">
                  {fileName ? `Fail Dipilih: ${fileName}` : 'Klik untuk Pilih Fail Senarai Pelajar atau Seret ke Sini'}
                </span>
                <p className="text-slate-500 text-[11px] mt-1 max-w-md">
                  Menyokong fail <strong>Excel (.xlsx, .xls)</strong> dari Sistem Pengurusan Murid (idMe KPM / MOEIS), fail <strong>CSV</strong>, atau fail teks senarai nama kelas.
                </p>
                <span className="mt-2.5 px-3 py-1 rounded-full bg-white text-emerald-800 text-[10px] font-bold border border-emerald-200 shadow-xs">
                  Sistem mengekstrak nama, No. KP & mengesan jantina secara automatik
                </span>
              </div>
            )}

            {/* Tab 2: Paste Names Text */}
            {inputMethod === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    Tampal senarai nama dari WhatsApp / Word / PDF (satu nama setiap baris):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPasteText(
                        `1. ALVIN BIN WALTER\n2. BEATRICE BINTI MAJANIL\n3. CALVIN ANAK MODUYING\n4. DAYANG NURUL HUDA\n5. EVANDER GINDOL\n6. FELICIA BINTI RUSLI`
                      )
                    }
                    className="text-blue-700 hover:underline font-bold"
                  >
                    Contoh Format Mudah
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Contoh:&#10;1. MOHAMMAD AIMAN BIN ABDULLAH&#10;2. NUR AIN BINTI ISMAIL&#10;3. JERRY MAJANIL..."
                  className="w-full border border-slate-300 rounded-xl p-3 font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParsePaste}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Proses & Pratonton Senarai Murid</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Display Parse Errors if any */}
          {parseErrors.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Peringatan / Makluman Pemprosesan Data:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
                {parseErrors.slice(0, 4).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {parseErrors.length > 4 && (
                  <li>...dan {parseErrors.length - 4} makluman lain.</li>
                )}
              </ul>
            </div>
          )}

          {/* Langkah 3: Pratonton & Semakan Murid Dikesan */}
          {parsedList.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-sm border border-emerald-500/30">
                    {parsedList.length} Murid
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-white">
                      Senarai Murid Dikesan Untuk Kelas: {selectedClassName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Lelaki: <strong>{countLelaki}</strong> • Perempuan: <strong>{countPerempuan}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Klik lencana jantina jika ingin menukar</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-10 text-center">Bil</th>
                      <th className="p-2">Nama Penuh Murid</th>
                      <th className="p-2">No. Kad Pengenalan</th>
                      <th className="p-2">Jantina</th>
                      <th className="p-2">Etnik</th>
                      <th className="p-2">Kampung</th>
                      <th className="p-2 w-10 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedList.map((item, index) => (
                      <tr key={item.tempId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 text-center text-slate-400 font-mono">{index + 1}</td>
                        <td className="p-2 font-bold text-slate-900">
                          {item.nama}
                          {item.isDuplicate && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                              No. KP Berkembar
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-slate-600">
                          {item.noKP}
                          {item.isAutoIC && (
                            <span className="ml-1 text-[9px] text-blue-600 font-sans" title="Dijana secara automatik">
                              (Auto)
                            </span>
                          )}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleToggleGender(item.tempId)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors cursor-pointer ${
                              item.jantina === 'lelaki'
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
                            }`}
                            title="Klik untuk tukar jantina"
                          >
                            {item.jantina === 'lelaki' ? 'Lelaki ♂' : 'Perempuan ♀'}
                          </button>
                        </td>
                        <td className="p-2 text-slate-700">{item.etnik}</td>
                        <td className="p-2 text-slate-500">{item.kampung}</td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.tempId)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Keluarkan dari senarai pendaftaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            {parsedList.length > 0 ? (
              <span>
                Sedia mendaftar <strong>{parsedList.length} orang murid</strong> ke dalam kelas{' '}
                <strong className="text-slate-900">{selectedClassName}</strong>.
              </span>
            ) : (
              <span>Sila upload fail Excel atau tampal senarai nama untuk memulakan semakan.</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmRegistration}
              disabled={saving || parsedList.length === 0}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-white shadow-xs transition-all flex items-center gap-2 ${
                parsedList.length > 0 && !saving
                  ? 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer shadow-emerald-700/20'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              {saving ? (
                <span>Mendaftarkan Murid...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Daftar {parsedList.length > 0 ? `${parsedList.length} Murid Sekelas` : 'Murid'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
