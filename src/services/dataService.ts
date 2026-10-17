import {
  Student,
  DailyClassAttendance,
  DisciplineCase,
  CounselingSession,
  AssistanceRecord,
  FollowUpAction,
  SchoolSettings,
  RulesSettings,
  AuditLog,
  UserProfile,
  ClassInfo,
  DisciplinaryBoardMeeting,
  BullyingReport,
  AwarenessProgram,
  MentalHealthScreening,
  MentorMenteePair,
  CareerCounselingProfile,
  AssistanceApplication,
  HostelRoom,
  HostelMovementLog,
  HostelInspection,
  HostelDailyReport,
  SickBayRecord,
  Inspection3KRecord,
  EmergencyContact,
  FireDrillRecord,
  Prefect,
  PrefectDutyRoster,
  HemProgram,
  AssemblyDuty,
  HemMeeting,
  DashboardSettings
} from '../types';
import {
  INITIAL_SCHOOL_SETTINGS,
  INITIAL_RULES_SETTINGS,
  DEFAULT_DASHBOARD_SETTINGS,
  CLASSES_LIST,
  DEMO_USERS,
  DEFAULT_EMERGENCY_CONTACTS,
  DEFAULT_HOSTEL_ROOMS,
  DEFAULT_ASSISTANCE_BUDGETS
} from '../constants';
import {
  generateFictitiousStudents,
  generateFictitiousAttendance,
  generateFictitiousDiscipline,
  generateFictitiousCounseling,
  generateFictitiousAssistance,
  generateFictitiousFollowUps,
  generateFictitiousBoardMeetings,
  generateFictitiousBullyingReports,
  generateFictitiousAwarenessPrograms,
  generateFictitiousMentalHealthScreenings,
  generateFictitiousMentorMentee,
  generateFictitiousCareerProfiles,
  generateFictitiousAssistanceApplications,
  generateFictitiousHostelMovements,
  generateFictitiousHostelInspections,
  generateFictitiousHostelDailyReports,
  generateFictitiousSickBay,
  generateFictitious3KInspections,
  generateFictitiousPrefects,
  generateFictitiousPrefectDutyRosters,
  generateFictitiousHemPrograms,
  generateFictitiousAssemblyDuties,
  generateFictitiousHemMeetings
} from './demoDataGenerator';
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

const STORAGE_KEYS = {
  STUDENTS: 'hem_smks_students_v1',
  ATTENDANCE: 'hem_smks_attendance_v1',
  DISCIPLINE: 'hem_smks_discipline_v2',
  BOARD_MEETINGS: 'hem_smks_board_meetings_v2',
  BULLYING_REPORTS: 'hem_smks_bullying_reports_v2',
  AWARENESS_PROGRAMS: 'hem_smks_awareness_programs_v2',
  MENTAL_HEALTH: 'hem_smks_mental_health_v2',
  MENTOR_MENTEE: 'hem_smks_mentor_mentee_v2',
  CAREER_PROFILES: 'hem_smks_career_profiles_v2',
  COUNSELING: 'hem_smks_counseling_v2',
  ASSISTANCE: 'hem_smks_assistance_v1',
  ASSISTANCE_APPS: 'hem_smks_assistance_apps_v3',
  ASSISTANCE_BUDGETS: 'hem_smks_assistance_budgets_v3',
  HOSTEL_ROOMS: 'hem_smks_hostel_rooms_v3',
  HOSTEL_MOVEMENTS: 'hem_smks_hostel_movements_v3',
  HOSTEL_INSPECTIONS: 'hem_smks_hostel_inspections_v3',
  HOSTEL_DAILY_REPORTS: 'hem_smks_hostel_daily_reports_v3',
  SICK_BAY: 'hem_smks_sick_bay_v3',
  INSPECTIONS_3K: 'hem_smks_3k_inspections_v3',
  EMERGENCY_CONTACTS: 'hem_smks_emergency_contacts_v3',
  FIRE_DRILLS: 'hem_smks_fire_drills_v3',
  PREFECTS: 'hem_smks_prefects_v3',
  PREFECT_ROSTERS: 'hem_smks_prefect_rosters_v3',
  HEM_PROGRAMS: 'hem_smks_hem_programs_v3',
  ASSEMBLY_DUTIES: 'hem_smks_assembly_duties_v3',
  HEM_MEETINGS: 'hem_smks_hem_meetings_v3',
  FOLLOW_UPS: 'hem_smks_followups_v1',
  SCHOOL_SETTINGS: 'hem_smks_school_settings_v1',
  RULES_SETTINGS: 'hem_smks_rules_settings_v2',
  DASHBOARD_SETTINGS: 'hem_smks_dashboard_settings_v1',
  AUDIT_LOGS: 'hem_smks_audit_logs_v1',
  USERS: 'hem_smks_users_v1',
  CLASSES: 'hem_smks_classes_v1'
};

function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Gagal menyimpan ke simpanan setempat (${key}):`, err);
  }
}

export function initializeCleanProductionData(): void {
  console.log('[HEM Digital] Memulakan persekitaran bersih untuk data sebenar SMK Salaping...');
  setLocalItem(STORAGE_KEYS.STUDENTS, []);
  setLocalItem(STORAGE_KEYS.ATTENDANCE, []);
  setLocalItem(STORAGE_KEYS.DISCIPLINE, []);
  setLocalItem(STORAGE_KEYS.BOARD_MEETINGS, []);
  setLocalItem(STORAGE_KEYS.BULLYING_REPORTS, []);
  setLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, []);
  setLocalItem(STORAGE_KEYS.MENTAL_HEALTH, []);
  setLocalItem(STORAGE_KEYS.MENTOR_MENTEE, []);
  setLocalItem(STORAGE_KEYS.CAREER_PROFILES, []);
  setLocalItem(STORAGE_KEYS.COUNSELING, []);
  setLocalItem(STORAGE_KEYS.ASSISTANCE, []);
  setLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, []);
  setLocalItem(STORAGE_KEYS.SICK_BAY, []);
  setLocalItem(STORAGE_KEYS.INSPECTIONS_3K, []);
  setLocalItem(STORAGE_KEYS.PREFECTS, []);
  setLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, []);
  setLocalItem(STORAGE_KEYS.HEM_PROGRAMS, []);
  setLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, []);
  setLocalItem(STORAGE_KEYS.HEM_MEETINGS, []);
  setLocalItem(STORAGE_KEYS.FOLLOW_UPS, []);

  // Bilik asrama sedia ada tetapi kosong tanpa penghuni demo
  const cleanRooms = DEFAULT_HOSTEL_ROOMS.map(r => ({
    ...r,
    penghuniIds: []
  }));
  setLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, cleanRooms);
  setLocalItem(STORAGE_KEYS.EMERGENCY_CONTACTS, DEFAULT_EMERGENCY_CONTACTS);

  // Tetapan rasmi sekolah, peraturan ambang, dan kelas
  setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, INITIAL_SCHOOL_SETTINGS);
  setLocalItem(STORAGE_KEYS.RULES_SETTINGS, INITIAL_RULES_SETTINGS);
  setLocalItem(STORAGE_KEYS.CLASSES, CLASSES_LIST);

  const initialUsers: UserProfile[] = [
    {
      uid: 'admin_sekolah',
      nama: 'Pentadbir Sistem HEM',
      emel: 'admin@smksalaping.edu.my',
      peranan: ['admin_sistem', 'pengetua', 'gpk_hem'],
      jawatan: 'Pentadbir Utama Sekolah',
      aktif: true,
      dicipta: '2026-01-01T00:00:00.000Z'
    }
  ];
  setLocalItem(STORAGE_KEYS.USERS, initialUsers);

  const initialLog: AuditLog = {
    id: `log_${Date.now()}`,
    uid: 'admin_sekolah',
    namaPengguna: 'Pentadbir Sistem HEM',
    tindakan: 'cipta',
    koleksi: 'system',
    dokumenId: 'data_sebenar_sedia',
    perincian: 'Pangkalan data dibersihkan sepenuhnya untuk kemasukan data sekolah sebenar SMK Salaping. Tiada data demo fiktif murid atau staf.',
    masa: new Date().toISOString()
  };
  setLocalItem(STORAGE_KEYS.AUDIT_LOGS, [initialLog]);

  localStorage.setItem('hem_production_mode', 'true');
  localStorage.setItem('hem_demo_data_purged', 'true');
}

export function clearAllDemoDataForProduction(operator?: { uid: string; nama: string }): void {
  console.log('[HEM Digital] Mengosongkan semua data demo murid, rekod, dan nama demo staf...');
  setLocalItem(STORAGE_KEYS.STUDENTS, []);
  setLocalItem(STORAGE_KEYS.ATTENDANCE, []);
  setLocalItem(STORAGE_KEYS.DISCIPLINE, []);
  setLocalItem(STORAGE_KEYS.BOARD_MEETINGS, []);
  setLocalItem(STORAGE_KEYS.BULLYING_REPORTS, []);
  setLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, []);
  setLocalItem(STORAGE_KEYS.MENTAL_HEALTH, []);
  setLocalItem(STORAGE_KEYS.MENTOR_MENTEE, []);
  setLocalItem(STORAGE_KEYS.CAREER_PROFILES, []);
  setLocalItem(STORAGE_KEYS.COUNSELING, []);
  setLocalItem(STORAGE_KEYS.ASSISTANCE, []);
  setLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, []);
  setLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, []);
  setLocalItem(STORAGE_KEYS.SICK_BAY, []);
  setLocalItem(STORAGE_KEYS.INSPECTIONS_3K, []);
  setLocalItem(STORAGE_KEYS.PREFECTS, []);
  setLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, []);
  setLocalItem(STORAGE_KEYS.HEM_PROGRAMS, []);
  setLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, []);
  setLocalItem(STORAGE_KEYS.HEM_MEETINGS, []);
  setLocalItem(STORAGE_KEYS.FOLLOW_UPS, []);

  // Bilik asrama sedia ada tetapi kosong tanpa penghuni demo
  const cleanRooms = DEFAULT_HOSTEL_ROOMS.map(r => ({
    ...r,
    penghuniIds: []
  }));
  setLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, cleanRooms);

  // Padamkan semua akaun demo dan nama-nama staf demo
  const currentUsers = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const cleanUsers = currentUsers.filter(u => 
    !u.uid.startsWith('demo_') &&
    !['En. Justin Bin Moduying', 'Pn. Masnah Binti Japar', 'Ustaz Hafiz Bin Roslan', 'Cik Norazimah Binti Abdullah', 'Cikgu Elda Grace Majanil', 'Cikgu Jerry Mojuntin', 'Pn. Grace Liew', 'En. Walter Gindol'].includes(u.nama)
  );

  if (cleanUsers.length === 0) {
    cleanUsers.push({
      uid: 'admin_sekolah',
      nama: 'Pentadbir Sistem HEM',
      emel: 'admin@smksalaping.edu.my',
      peranan: ['admin_sistem', 'pengetua', 'gpk_hem'],
      jawatan: 'Pentadbir Utama Sekolah',
      aktif: true,
      dicipta: new Date().toISOString()
    });
  }
  setLocalItem(STORAGE_KEYS.USERS, cleanUsers);

  // Tandakan mod data sebenar kekal
  localStorage.setItem('hem_production_mode', 'true');
  localStorage.setItem('hem_demo_data_purged', 'true');

  const op = operator || { uid: 'admin_sekolah', nama: 'Pentadbir Sistem' };
  const log: AuditLog = {
    id: `log_${Date.now()}`,
    uid: op.uid,
    namaPengguna: op.nama,
    tindakan: 'padam',
    koleksi: 'system',
    dokumenId: 'demo_purged',
    perincian: 'Data demo fiktif murid, rekod kehadiran, dan akaun staf demo telah dipadamkan sepenuhnya. Sistem sedia untuk data sebenar.',
    masa: new Date().toISOString()
  };
  const logs = getLocalItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  logs.unshift(log);
  setLocalItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));
}

export function initializeDemoDataIfEmpty(): void {
  // Kekalkan mod data sebenar tanpa menjana data demo
  const hasInitialized = localStorage.getItem('hem_demo_data_purged') === 'true';
  if (!hasInitialized) {
    clearAllDemoDataForProduction();
  }
}

export function resetAllToDemoData(): void {
  console.log('[HEM Digital] Menjana semula data demo fiktif lengkap SMK Salaping (Fasa 1, 2 & 3)...');
  const students = generateFictitiousStudents();
  const attendance = generateFictitiousAttendance(students);
  const discipline = generateFictitiousDiscipline(students);
  const boardMeetings = generateFictitiousBoardMeetings(discipline, students);
  const bullyingReports = generateFictitiousBullyingReports(students);
  const awarenessPrograms = generateFictitiousAwarenessPrograms();
  const mentalHealth = generateFictitiousMentalHealthScreenings(students);
  const mentorMentee = generateFictitiousMentorMentee(students);
  const careerProfiles = generateFictitiousCareerProfiles(students);
  const counseling = generateFictitiousCounseling(students);
  const assistance = generateFictitiousAssistance(students);
  const followUps = generateFictitiousFollowUps(students);

  // Fasa 3 Demo
  const assistanceApps = generateFictitiousAssistanceApplications(students);
  const hostelMovements = generateFictitiousHostelMovements(students);
  const hostelInspections = generateFictitiousHostelInspections();
  const hostelDailyReports = generateFictitiousHostelDailyReports();
  const sickBay = generateFictitiousSickBay(students);
  const inspections3K = generateFictitious3KInspections();
  const prefects = generateFictitiousPrefects(students);
  const prefectRosters = generateFictitiousPrefectDutyRosters(prefects);
  const hemPrograms = generateFictitiousHemPrograms();
  const assemblyDuties = generateFictitiousAssemblyDuties();
  const hemMeetings = generateFictitiousHemMeetings();

  // Populate hostel rooms with student IDs
  const hostelRooms = DEFAULT_HOSTEL_ROOMS.map(r => {
    const matchingStu = students.filter(s => s.penghuniAsrama && (r.blok.includes('Putera') ? s.jantina === 'lelaki' : s.jantina === 'perempuan'));
    return {
      ...r,
      penghuniIds: matchingStu.slice(0, 8).map(s => s.id)
    };
  });

  const initialUsers: UserProfile[] = DEMO_USERS.map(u => ({
    uid: u.uid,
    nama: u.nama,
    emel: u.emel,
    peranan: u.peranan,
    kelasDiajar: u.kelasDiajar,
    aktif: true,
    dicipta: '2026-01-01T00:00:00.000Z'
  }));

  setLocalItem(STORAGE_KEYS.STUDENTS, students);
  setLocalItem(STORAGE_KEYS.ATTENDANCE, attendance);
  setLocalItem(STORAGE_KEYS.DISCIPLINE, discipline);
  setLocalItem(STORAGE_KEYS.BOARD_MEETINGS, boardMeetings);
  setLocalItem(STORAGE_KEYS.BULLYING_REPORTS, bullyingReports);
  setLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, awarenessPrograms);
  setLocalItem(STORAGE_KEYS.MENTAL_HEALTH, mentalHealth);
  setLocalItem(STORAGE_KEYS.MENTOR_MENTEE, mentorMentee);
  setLocalItem(STORAGE_KEYS.CAREER_PROFILES, careerProfiles);
  setLocalItem(STORAGE_KEYS.COUNSELING, counseling);
  setLocalItem(STORAGE_KEYS.ASSISTANCE, assistance);
  setLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, assistanceApps);
  setLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, hostelRooms);
  setLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, hostelMovements);
  setLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, hostelInspections);
  setLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, hostelDailyReports);
  setLocalItem(STORAGE_KEYS.SICK_BAY, sickBay);
  setLocalItem(STORAGE_KEYS.INSPECTIONS_3K, inspections3K);
  setLocalItem(STORAGE_KEYS.EMERGENCY_CONTACTS, DEFAULT_EMERGENCY_CONTACTS);
  setLocalItem(STORAGE_KEYS.PREFECTS, prefects);
  setLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, prefectRosters);
  setLocalItem(STORAGE_KEYS.HEM_PROGRAMS, hemPrograms);
  setLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, assemblyDuties);
  setLocalItem(STORAGE_KEYS.HEM_MEETINGS, hemMeetings);
  setLocalItem(STORAGE_KEYS.FOLLOW_UPS, followUps);
  setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, INITIAL_SCHOOL_SETTINGS);
  setLocalItem(STORAGE_KEYS.RULES_SETTINGS, INITIAL_RULES_SETTINGS);
  setLocalItem(STORAGE_KEYS.CLASSES, CLASSES_LIST);
  setLocalItem(STORAGE_KEYS.USERS, initialUsers);

  const initialLog: AuditLog = {
    id: `log_${Date.now()}`,
    uid: 'demo_admin',
    namaPengguna: 'Admin Sistem',
    tindakan: 'cipta',
    koleksi: 'system',
    dokumenId: 'demo_data_fasa3',
    perincian: 'Data demo fiktif lengkap SMK Salaping (Fasa 1, Fasa 2 & Fasa 3) dimuatkan semula untuk tujuan latihan.',
    masa: new Date().toISOString()
  };
  setLocalItem(STORAGE_KEYS.AUDIT_LOGS, [initialLog]);

  localStorage.removeItem('hem_demo_data_purged');
  localStorage.removeItem('hem_production_mode');

  if (db && isFirebaseConfigured) {
    syncDemoDataToFirestore();
  }
}

async function syncDemoDataToFirestore() {
  if (!db) return;
  try {
    await setDoc(doc(db, 'settings', 'school'), INITIAL_SCHOOL_SETTINGS, { merge: true });
    await setDoc(doc(db, 'settings', 'rules'), INITIAL_RULES_SETTINGS, { merge: true });
  } catch (err) {
    console.warn('[HEM Digital] Ralat segerak tetapan ke Firestore:', err);
  }
}

// ================= AUDIT LOG SERVICE =================
export async function addAuditLog(
  user: { uid: string; nama: string },
  tindakan: AuditLog['tindakan'],
  koleksi: string,
  dokumenId: string,
  perincian: string
): Promise<void> {
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    uid: user.uid,
    namaPengguna: user.nama,
    tindakan,
    koleksi,
    dokumenId,
    perincian,
    masa: new Date().toISOString()
  };

  const logs = getLocalItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  logs.unshift(newLog);
  setLocalItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));

  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
    } catch {
      // Abaikan ralat audit log dalam mod luar talian
    }
  }
}

export function getAuditLogs(): AuditLog[] {
  return getLocalItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
}

// ================= SCHOOL & RULES SETTINGS =================
export async function getSchoolSettings(): Promise<SchoolSettings> {
  initializeDemoDataIfEmpty();
  const settings = getLocalItem<SchoolSettings>(STORAGE_KEYS.SCHOOL_SETTINGS, INITIAL_SCHOOL_SETTINGS);
  if (!settings.logo || settings.logo === '' || settings.logo.startsWith('/src/assets/images/')) {
    settings.logo = '/logo.png';
    setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, settings);
  }

  // Bersihkan sebarang nama demo lama yang mungkin masih tersimpan
  const demoNames = [
    'En. Justin Bin Moduying',
    'Pn. Masnah Binti Japar',
    'Ustaz Hafiz Bin Roslan',
    'Cik Norazimah Binti Abdullah',
    'Cikgu Jerry Mojuntin',
    'Pn. Grace Liew',
    'En. Walter Gindol',
    'Cikgu Elda Grace Majanil',
    'Ustaz Mohd Azlan'
  ];

  let cleaned = false;
  const adminKeys: (keyof SchoolSettings)[] = [
    'namaPengetua',
    'namaGpkHem',
    'namaGpk1',
    'namaGpkKoko',
    'namaKetuaDisiplin',
    'namaGbk',
    'namaKetuaWarden',
    'namaPenyelarasBiasiswa',
    'namaPenyelarasPengawas',
    'namaGuruData'
  ];

  for (const k of adminKeys) {
    if (typeof settings[k] === 'string' && demoNames.includes(settings[k] as string)) {
      (settings as any)[k] = '';
      cleaned = true;
    }
  }

  if (cleaned) {
    setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, settings);
  }

  return settings;
}

export async function saveSchoolSettings(settings: SchoolSettings, user: { uid: string; nama: string }): Promise<void> {
  setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, settings);
  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'school'), settings, { merge: true });
    } catch (err) {
      console.warn('Ralat menyimpan settings/school ke Firestore:', err);
    }
  }
  await addAuditLog(user, 'ubah', 'settings', 'school', `Mengemaskini maklumat sekolah (${settings.nama})`);
}

export async function getRulesSettings(): Promise<RulesSettings> {
  initializeDemoDataIfEmpty();
  return getLocalItem<RulesSettings>(STORAGE_KEYS.RULES_SETTINGS, INITIAL_RULES_SETTINGS);
}

export async function saveRulesSettings(rules: RulesSettings, user: { uid: string; nama: string }): Promise<void> {
  setLocalItem(STORAGE_KEYS.RULES_SETTINGS, rules);
  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'rules'), rules, { merge: true });
    } catch (err) {
      console.warn('Ralat menyimpan settings/rules ke Firestore:', err);
    }
  }
  await addAuditLog(user, 'ubah', 'settings', 'rules', 'Mengemaskini peraturan disiplin, ambang cicir, dan panduan lapor pihak luar');
}

export async function getDashboardSettings(): Promise<DashboardSettings> {
  initializeDemoDataIfEmpty();
  const current = getLocalItem<DashboardSettings>(STORAGE_KEYS.DASHBOARD_SETTINGS, DEFAULT_DASHBOARD_SETTINGS);
  const merged = { ...DEFAULT_DASHBOARD_SETTINGS, ...current, kpiCards: { ...DEFAULT_DASHBOARD_SETTINGS.kpiCards, ...(current?.kpiCards || {}) } };
  if (!merged.gambarBannerUrl || merged.gambarBannerUrl.startsWith('/src/assets/images/')) {
    merged.gambarBannerUrl = '/banner.jpg';
    setLocalItem(STORAGE_KEYS.DASHBOARD_SETTINGS, merged);
  }
  return merged;
}

export async function saveDashboardSettings(settings: DashboardSettings, user: { uid: string; nama: string }): Promise<void> {
  setLocalItem(STORAGE_KEYS.DASHBOARD_SETTINGS, settings);
  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'settings', 'dashboard'), settings, { merge: true });
    } catch (err) {
      console.warn('Ralat menyimpan settings/dashboard ke Firestore:', err);
    }
  }
  await addAuditLog(user, 'ubah', 'settings', 'dashboard', 'Mengemaskini konfigurasi dan paparan Dashboard Utama');
}

// ================= STUDENTS SERVICE =================
export async function getStudents(): Promise<Student[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const list = await getStudents();
  return list.find(s => s.id === id) || null;
}

export async function saveStudent(student: Student, user: { uid: string; nama: string }, isNew: boolean): Promise<void> {
  const students = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const duplicate = students.find(s => s.noKP.replace(/[^0-9]/g, '') === student.noKP.replace(/[^0-9]/g, '') && s.id !== student.id);
  if (duplicate) {
    throw new Error(`No. Kad Pengenalan ${student.noKP} telah wujud untuk murid: ${duplicate.nama} (${duplicate.kelas}).`);
  }

  const updatedStudents = isNew ? [student, ...students] : students.map(s => (s.id === student.id ? student : s));
  setLocalItem(STORAGE_KEYS.STUDENTS, updatedStudents);

  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.warn('Ralat menyimpan murid ke Firestore:', err);
    }
  }

  await addAuditLog(user, isNew ? 'cipta' : 'ubah', 'students', student.id, `${isNew ? 'Menambah' : 'Mengemaskini'} data murid: ${student.nama} (${student.kelas})`);
}

export async function archiveStudent(id: string, newStatus: Student['status'], user: { uid: string; nama: string }): Promise<void> {
  const students = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const target = students.find(s => s.id === id);
  if (!target) throw new Error('Murid tidak dijumpai.');

  const updated = students.map(s => (s.id === id ? { ...s, status: newStatus, dikemaskini: new Date().toISOString() } : s));
  setLocalItem(STORAGE_KEYS.STUDENTS, updated);

  await addAuditLog(user, 'ubah', 'students', id, `Menukar status murid ${target.nama} kepada "${newStatus}"`);
}

export async function bulkPromoteStudents(
  updates: { id: string; tingkatan: number; kelas: string; status?: Student['status'] }[],
  user: { uid: string; nama: string }
): Promise<void> {
  const students = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const mapUpdates = new Map(updates.map(u => [u.id, u]));

  const updatedList = students.map(s => {
    const up = mapUpdates.get(s.id);
    if (up) {
      return { ...s, tingkatan: up.tingkatan, kelas: up.kelas, status: up.status || s.status, dikemaskini: new Date().toISOString() };
    }
    return s;
  });

  setLocalItem(STORAGE_KEYS.STUDENTS, updatedList);
  await addAuditLog(user, 'ubah', 'students', 'bulk_promotion', `Naik tingkatan / pemindahan kelas bagi ${updates.length} orang murid.`);
}

export async function bulkImportStudents(newStudents: Student[], user: { uid: string; nama: string }): Promise<number> {
  const current = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const existingKPs = new Set(current.map(s => s.noKP.replace(/[^0-9]/g, '')));
  
  const validToAdd: Student[] = [];
  for (const st of newStudents) {
    const cleanKp = st.noKP.replace(/[^0-9]/g, '');
    if (!existingKPs.has(cleanKp)) {
      validToAdd.push(st);
      existingKPs.add(cleanKp);
    }
  }

  const combined = [...validToAdd, ...current];
  setLocalItem(STORAGE_KEYS.STUDENTS, combined);
  await addAuditLog(user, 'import', 'students', 'csv_import', `Import CSV: ${validToAdd.length} murid baharu dimasukkan.`);
  return validToAdd.length;
}

export async function anonymizeGraduatedStudents(
  studentIds: string[],
  user: { uid: string; nama: string },
  approvalNote: string
): Promise<number> {
  const students = getLocalItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  const targetIds = new Set(studentIds);

  let count = 0;
  const updatedList = students.map(s => {
    if (targetIds.has(s.id)) {
      count++;
      return {
        ...s,
        nama: `[MURID TAMAT SESI ${s.tahunMasuk}]`,
        noKP: '000000-00-0000',
        alamat: 'KOTA MARUDU (DIANONIMKAN SELEPAS TAMAT)',
        penjaga: s.penjaga.map(p => ({
          ...p,
          nama: '[PENJAGA DIANONIMKAN]',
          noTel: '000-0000000'
        })),
        dikemaskini: new Date().toISOString()
      };
    }
    return s;
  });

  setLocalItem(STORAGE_KEYS.STUDENTS, updatedList);
  await addAuditLog(
    user,
    'ubah',
    'students',
    'anonymization',
    `Pematuhan APDP: ${count} rekod murid tamat telah dianonimkan (Kelulusan Dua Peringkat: ${approvalNote})`
  );
  return count;
}

// ================= ATTENDANCE SERVICE =================
export async function getAttendanceList(): Promise<DailyClassAttendance[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<DailyClassAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
}

export async function saveDailyClassAttendance(
  attendance: DailyClassAttendance,
  user: { uid: string; nama: string }
): Promise<void> {
  const list = getLocalItem<DailyClassAttendance[]>(STORAGE_KEYS.ATTENDANCE, []);
  const existingIdx = list.findIndex(a => a.id === attendance.id);

  if (existingIdx >= 0) {
    list[existingIdx] = attendance;
  } else {
    list.push(attendance);
  }

  setLocalItem(STORAGE_KEYS.ATTENDANCE, list);
  await addAuditLog(
    user,
    existingIdx >= 0 ? 'ubah' : 'cipta',
    'attendance',
    attendance.id,
    `Perekodan kehadiran kelas ${attendance.kelasId} bagi tarikh ${attendance.tarikh} (${attendance.jumlahHadir}/${attendance.jumlahMurid} hadir)`
  );
}

// ================= DISCIPLINE SERVICE (SSDM ALIRAN LENGKAP) =================
export async function getDisciplineCases(): Promise<DisciplineCase[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<DisciplineCase[]>(STORAGE_KEYS.DISCIPLINE, []);
}

export async function saveDisciplineCase(
  c: DisciplineCase,
  user: { uid: string; nama: string },
  isNew: boolean
): Promise<void> {
  const cases = getLocalItem<DisciplineCase[]>(STORAGE_KEYS.DISCIPLINE, []);
  const updated = isNew ? [c, ...cases] : cases.map(item => (item.id === c.id ? c : item));
  setLocalItem(STORAGE_KEYS.DISCIPLINE, updated);

  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'discipline', c.id), c);
    } catch {
      // Offline fallback
    }
  }

  await addAuditLog(
    user,
    isNew ? 'cipta' : 'ubah',
    'discipline',
    c.id,
    `${isNew ? 'Merekod kes' : 'Mengemaskini aliran kes'} ${c.noRujukan} (${c.kategori} - ${c.tahap.toUpperCase()}) -> Status: ${c.statusAliran}`
  );
}

// ================= LEMBAGA DISIPLIN =================
export async function getDisciplinaryBoardMeetings(): Promise<DisciplinaryBoardMeeting[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<DisciplinaryBoardMeeting[]>(STORAGE_KEYS.BOARD_MEETINGS, []);
}

export async function saveDisciplinaryBoardMeeting(
  meeting: DisciplinaryBoardMeeting,
  user: { uid: string; nama: string },
  isNew: boolean
): Promise<void> {
  const list = getLocalItem<DisciplinaryBoardMeeting[]>(STORAGE_KEYS.BOARD_MEETINGS, []);
  const updated = isNew ? [meeting, ...list] : list.map(m => m.id === meeting.id ? meeting : m);
  setLocalItem(STORAGE_KEYS.BOARD_MEETINGS, updated);

  await addAuditLog(
    user,
    isNew ? 'cipta' : 'ubah',
    'disciplinaryBoard',
    meeting.id,
    `Sidang Lembaga Disiplin ${meeting.noRujukan} (${meeting.tarikh}) - Status: ${meeting.status}`
  );
}

// ================= ADUAN BULI & CPP =================
export async function getBullyingReports(user?: { uid: string; nama: string }): Promise<BullyingReport[]> {
  initializeDemoDataIfEmpty();
  const reports = getLocalItem<BullyingReport[]>(STORAGE_KEYS.BULLYING_REPORTS, []);
  if (user) {
    // Log audit for accessing sensitive bullying records
    await addAuditLog(user, 'akses_sulit', 'bullyingReports', 'all', 'Mengakses senarai aduan buli & fail perlindungan kanak-kanak');
  }
  return reports;
}

export async function saveBullyingReport(
  report: BullyingReport,
  user?: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = getLocalItem<BullyingReport[]>(STORAGE_KEYS.BULLYING_REPORTS, []);
  const updated = isNew ? [report, ...list] : list.map(r => r.id === report.id ? report : r);
  setLocalItem(STORAGE_KEYS.BULLYING_REPORTS, updated);

  const operator = user || { uid: 'public', nama: report.namaPelapor || 'Orang Awam / Murid' };
  await addAuditLog(
    operator,
    isNew ? 'cipta' : 'ubah',
    'bullyingReports',
    report.id,
    `${isNew ? 'Penerimaan aduan buli' : 'Tindakan/semakan aduan buli'} ${report.noAduan} (${report.kategoriBuli}) - Status: ${report.status}`
  );
}

export async function getAwarenessPrograms(): Promise<AwarenessProgram[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<AwarenessProgram[]>(STORAGE_KEYS.AWARENESS_PROGRAMS, []);
}

export async function saveAwarenessProgram(program: AwarenessProgram, user: { uid: string; nama: string }): Promise<void> {
  const list = getLocalItem<AwarenessProgram[]>(STORAGE_KEYS.AWARENESS_PROGRAMS, []);
  list.unshift(program);
  setLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, list);
  await addAuditLog(user, 'cipta', 'awarenessPrograms', program.id, `Merekod program kesedaran anti-buli: ${program.namaProgram}`);
}

// ================= COUNSELING SENSITIVE (UBK) =================
export async function getCounselingSessions(user?: { uid: string; nama: string }): Promise<CounselingSession[]> {
  initializeDemoDataIfEmpty();
  const list = getLocalItem<CounselingSession[]>(STORAGE_KEYS.COUNSELING, []);
  if (user) {
    await addAuditLog(user, 'akses_sulit', 'counselingSessions', 'all', 'Mengakses rekod sulit sesi kaunseling murid');
  }
  return list;
}

export async function saveCounselingSession(
  s: CounselingSession,
  user: { uid: string; nama: string },
  isNew: boolean
): Promise<void> {
  const sessions = getLocalItem<CounselingSession[]>(STORAGE_KEYS.COUNSELING, []);
  const updated = isNew ? [s, ...sessions] : sessions.map(item => (item.id === s.id ? s : item));
  setLocalItem(STORAGE_KEYS.COUNSELING, updated);

  await addAuditLog(
    user,
    isNew ? 'cipta' : 'ubah',
    'counseling',
    s.id,
    `${isNew ? 'Membuka' : 'Mengemaskini'} sesi bimbingan kaunseling murid ID: ${s.studentId} (${s.jenisSesi})`
  );
}

export async function getMentalHealthScreenings(): Promise<MentalHealthScreening[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<MentalHealthScreening[]>(STORAGE_KEYS.MENTAL_HEALTH, []);
}

export async function saveMentalHealthScreening(m: MentalHealthScreening, user: { uid: string; nama: string }): Promise<void> {
  const list = getLocalItem<MentalHealthScreening[]>(STORAGE_KEYS.MENTAL_HEALTH, []);
  list.unshift(m);
  setLocalItem(STORAGE_KEYS.MENTAL_HEALTH, list);
  await addAuditLog(user, 'cipta', 'mentalHealth', m.id, `Merekod saringan minda sihat murid ID: ${m.studentId} (Tahap: ${m.tahapKeseluruhan})`);
}

export async function getMentorMenteePairs(): Promise<MentorMenteePair[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<MentorMenteePair[]>(STORAGE_KEYS.MENTOR_MENTEE, []);
}

export async function saveMentorMenteePair(pair: MentorMenteePair, user: { uid: string; nama: string }): Promise<void> {
  const list = getLocalItem<MentorMenteePair[]>(STORAGE_KEYS.MENTOR_MENTEE, []);
  const idx = list.findIndex(p => p.id === pair.id);
  if (idx >= 0) list[idx] = pair;
  else list.push(pair);
  setLocalItem(STORAGE_KEYS.MENTOR_MENTEE, list);
  await addAuditLog(user, 'ubah', 'mentorMentee', pair.id, `Mengemaskini rekod mentor-mentee: ${pair.namaMentor} -> ${pair.namaMentee}`);
}

export async function getCareerProfiles(): Promise<CareerCounselingProfile[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<CareerCounselingProfile[]>(STORAGE_KEYS.CAREER_PROFILES, []);
}

export async function saveCareerProfile(profile: CareerCounselingProfile, user: { uid: string; nama: string }): Promise<void> {
  const list = getLocalItem<CareerCounselingProfile[]>(STORAGE_KEYS.CAREER_PROFILES, []);
  const idx = list.findIndex(p => p.id === profile.id);
  if (idx >= 0) list[idx] = profile;
  else list.push(profile);
  setLocalItem(STORAGE_KEYS.CAREER_PROFILES, list);
  await addAuditLog(user, 'ubah', 'careerProfiles', profile.id, `Mengemaskini profil kerjaya murid ID: ${profile.studentId}`);
}

// ================= ASSISTANCE SERVICE =================
export async function getAssistanceRecords(): Promise<AssistanceRecord[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<AssistanceRecord[]>(STORAGE_KEYS.ASSISTANCE, []);
}

export async function saveAssistanceRecord(
  rec: AssistanceRecord,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getAssistanceRecords();
  const updated = isNew ? [rec, ...list] : list.map(item => (item.id === rec.id ? rec : item));
  setLocalItem(STORAGE_KEYS.ASSISTANCE, updated);
  await addAuditLog(
    operator,
    isNew ? 'cipta' : 'ubah',
    'assistance',
    rec.id,
    `${isNew ? 'Menambah' : 'Mengemaskini'} agihan bantuan (${rec.jenisBantuan}) untuk murid ID: ${rec.studentId} (Status: ${rec.statusAgihan})`
  );
}

export async function getAssistanceApplications(): Promise<AssistanceApplication[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<AssistanceApplication[]>(STORAGE_KEYS.ASSISTANCE_APPS, []);
}

export async function saveAssistanceApplication(
  app: AssistanceApplication,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getAssistanceApplications();
  const updated = isNew ? [app, ...list] : list.map(item => (item.id === app.id ? app : item));
  setLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, updated);
  await addAuditLog(
    operator,
    isNew ? 'cipta' : 'ubah',
    'assistance_apps',
    app.id,
    `${isNew ? 'Memohon' : 'Mengemaskini status permohonan'} bantuan (${app.jenisBantuan}) murid ID: ${app.studentId} -> ${app.status}`
  );
}

export async function getAssistanceBudgets(): Promise<Record<string, { kuotaMurid: number; perMurid: number; peruntukanSekolah: number; sumber?: string }>> {
  initializeDemoDataIfEmpty();
  return getLocalItem(STORAGE_KEYS.ASSISTANCE_BUDGETS, DEFAULT_ASSISTANCE_BUDGETS);
}

export async function saveAssistanceBudgets(
  budgets: Record<string, { kuotaMurid: number; perMurid: number; peruntukanSekolah: number; sumber?: string }>,
  operator: { uid: string; nama: string }
): Promise<void> {
  setLocalItem(STORAGE_KEYS.ASSISTANCE_BUDGETS, budgets);
  await addAuditLog(
    operator,
    'ubah',
    'assistance_budgets',
    'all',
    'Mengemaskini kuota penerima dan peruntukan bajet bantuan sekolah'
  );
}

// ================= ASRAMA SERVICES =================
export async function getHostelRooms(): Promise<HostelRoom[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HostelRoom[]>(STORAGE_KEYS.HOSTEL_ROOMS, []);
}

export async function saveHostelRoom(
  room: HostelRoom,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getHostelRooms();
  const idx = list.findIndex(r => r.id === room.id);
  if (idx >= 0) list[idx] = room;
  else list.push(room);
  setLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, list);
  await addAuditLog(operator, 'ubah', 'hostel_rooms', room.id, `Mengemaskini pendaftaran kamar: ${room.namaKamar} (${room.penghuniIds.length}/${room.kapasiti})`);
}

export async function getHostelMovements(): Promise<HostelMovementLog[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HostelMovementLog[]>(STORAGE_KEYS.HOSTEL_MOVEMENTS, []);
}

export async function saveHostelMovement(
  mov: HostelMovementLog,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getHostelMovements();
  const updated = isNew ? [mov, ...list] : list.map(m => (m.id === mov.id ? mov : m));
  setLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, updated);
  await addAuditLog(
    operator,
    isNew ? 'cipta' : 'ubah',
    'hostel_movements',
    mov.id,
    `${isNew ? 'Merekod permit pergerakan' : 'Mengemaskini status permit'} (${mov.jenis}) murid ID: ${mov.studentId} -> ${mov.statusKelulusan}`
  );
}

export async function getHostelInspections(): Promise<HostelInspection[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HostelInspection[]>(STORAGE_KEYS.HOSTEL_INSPECTIONS, []);
}

export async function saveHostelInspection(
  insp: HostelInspection,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getHostelInspections();
  list.unshift(insp);
  setLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, list);
  await addAuditLog(operator, 'cipta', 'hostel_inspections', insp.id, `Merekod pemeriksaan bilik/spot-check: ${insp.kamar} (Skor: ${insp.skorKebersihan}/10)`);
}

export async function getHostelDailyReports(): Promise<HostelDailyReport[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HostelDailyReport[]>(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, []);
}

export async function saveHostelDailyReport(
  hdr: HostelDailyReport,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getHostelDailyReports();
  list.unshift(hdr);
  setLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, list);
  await addAuditLog(operator, 'cipta', 'hostel_reports', hdr.id, `Merekod laporan harian & roll call warden (${hdr.tarikh})`);
}

// ================= KESIHATAN & 3K SERVICES =================
export async function getSickBayRecords(): Promise<SickBayRecord[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<SickBayRecord[]>(STORAGE_KEYS.SICK_BAY, []);
}

export async function saveSickBayRecord(
  sb: SickBayRecord,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getSickBayRecords();
  const updated = isNew ? [sb, ...list] : list.map(item => (item.id === sb.id ? sb : item));
  setLocalItem(STORAGE_KEYS.SICK_BAY, updated);
  await addAuditLog(
    operator,
    isNew ? 'cipta' : 'ubah',
    'sick_bay',
    sb.id,
    `${isNew ? 'Merekod kemasukan bilik sakit' : 'Mengemaskini rekod rawatan'} murid ID: ${sb.studentId} (${sb.simptom})`
  );
}

export async function get3KInspections(): Promise<Inspection3KRecord[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<Inspection3KRecord[]>(STORAGE_KEYS.INSPECTIONS_3K, []);
}

export async function save3KInspection(
  insp: Inspection3KRecord,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await get3KInspections();
  list.unshift(insp);
  setLocalItem(STORAGE_KEYS.INSPECTIONS_3K, list);
  await addAuditLog(operator, 'cipta', '3k_inspections', insp.id, `Merekod audit 3K: ${insp.kawasan} (Skor: ${insp.skor}%, Status: ${insp.status})`);
}

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<EmergencyContact[]>(STORAGE_KEYS.EMERGENCY_CONTACTS, DEFAULT_EMERGENCY_CONTACTS);
}

export async function saveEmergencyContact(
  contact: EmergencyContact,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getEmergencyContacts();
  const idx = list.findIndex(c => c.id === contact.id);
  if (idx >= 0) list[idx] = contact;
  else list.push(contact);
  setLocalItem(STORAGE_KEYS.EMERGENCY_CONTACTS, list);
  await addAuditLog(operator, 'ubah', 'emergency_contacts', contact.id, `Mengemaskini talian kecemasan: ${contact.agensi} (${contact.noTel})`);
}

export async function getFireDrillRecords(): Promise<FireDrillRecord[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<FireDrillRecord[]>(STORAGE_KEYS.FIRE_DRILLS, []);
}

export async function saveFireDrillRecord(
  drill: FireDrillRecord,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getFireDrillRecords();
  list.unshift(drill);
  setLocalItem(STORAGE_KEYS.FIRE_DRILLS, list);
  await addAuditLog(operator, 'cipta', 'fire_drills', drill.id, `Merekod latihan pengosongan bangunan/kebakaran: ${drill.tarikh} (${drill.tempohEvakuasiMinit} minit)`);
}

// ================= PENGAWAS SERVICES =================
export async function getPrefects(): Promise<Prefect[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<Prefect[]>(STORAGE_KEYS.PREFECTS, []);
}

export async function savePrefect(
  pref: Prefect,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getPrefects();
  const updated = isNew ? [pref, ...list] : list.map(p => (p.id === pref.id ? pref : p));
  setLocalItem(STORAGE_KEYS.PREFECTS, updated);
  await addAuditLog(operator, isNew ? 'cipta' : 'ubah', 'prefects', pref.id, `${isNew ? 'Melantik' : 'Mengemaskini'} pengawas ID murid: ${pref.studentId} (${pref.jawatan})`);
}

export async function getPrefectDutyRosters(): Promise<PrefectDutyRoster[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<PrefectDutyRoster[]>(STORAGE_KEYS.PREFECT_ROSTERS, []);
}

export async function savePrefectDutyRoster(
  roster: PrefectDutyRoster,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getPrefectDutyRosters();
  const idx = list.findIndex(r => r.id === roster.id);
  if (idx >= 0) list[idx] = roster;
  else list.push(roster);
  setLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, list);
  await addAuditLog(operator, 'ubah', 'prefect_rosters', roster.id, `Mengemaskini jadual tugas pengawas: ${roster.hari} - ${roster.lokasi}`);
}

// ================= PROGRAM HEM & PERHIMPUNAN =================
export async function getHemPrograms(): Promise<HemProgram[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HemProgram[]>(STORAGE_KEYS.HEM_PROGRAMS, []);
}

export async function saveHemProgram(
  prog: HemProgram,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getHemPrograms();
  const updated = isNew ? [prog, ...list] : list.map(p => (p.id === prog.id ? prog : p));
  setLocalItem(STORAGE_KEYS.HEM_PROGRAMS, updated);
  await addAuditLog(operator, isNew ? 'cipta' : 'ubah', 'hem_programs', prog.id, `${isNew ? 'Mendaftarkan' : 'Mengemaskini'} program HEM: ${prog.namaProgram} (${prog.status})`);
}

export async function getAssemblyDuties(): Promise<AssemblyDuty[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<AssemblyDuty[]>(STORAGE_KEYS.ASSEMBLY_DUTIES, []);
}

export async function saveAssemblyDuty(
  duty: AssemblyDuty,
  operator: { uid: string; nama: string }
): Promise<void> {
  const list = await getAssemblyDuties();
  const idx = list.findIndex(d => d.id === duty.id);
  if (idx >= 0) list[idx] = duty;
  else list.push(duty);
  setLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, list);
  await addAuditLog(operator, 'ubah', 'assembly_duties', duty.id, `Mengemaskini jadual pemandu perhimpunan: Minggu ${duty.minggu}`);
}

// ================= MESYUARAT HEM SERVICES =================
export async function getHemMeetings(): Promise<HemMeeting[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<HemMeeting[]>(STORAGE_KEYS.HEM_MEETINGS, []);
}

export async function saveHemMeeting(
  meeting: HemMeeting,
  operator: { uid: string; nama: string },
  isNew: boolean = false
): Promise<void> {
  const list = await getHemMeetings();
  const updated = isNew ? [meeting, ...list] : list.map(m => (m.id === meeting.id ? meeting : m));
  setLocalItem(STORAGE_KEYS.HEM_MEETINGS, updated);
  await addAuditLog(operator, isNew ? 'cipta' : 'ubah', 'hem_meetings', meeting.id, `${isNew ? 'Mencatat' : 'Mengemaskini'} mesyuarat HEM: ${meeting.tajuk} (${meeting.bilangan})`);
}

// ================= FOLLOW UP ACTIONS =================
export async function getFollowUps(): Promise<FollowUpAction[]> {
  initializeDemoDataIfEmpty();
  return getLocalItem<FollowUpAction[]>(STORAGE_KEYS.FOLLOW_UPS, []);
}

export async function addFollowUpAction(
  action: FollowUpAction,
  user: { uid: string; nama: string }
): Promise<void> {
  const list = getLocalItem<FollowUpAction[]>(STORAGE_KEYS.FOLLOW_UPS, []);
  list.unshift(action);
  setLocalItem(STORAGE_KEYS.FOLLOW_UPS, list);

  await addAuditLog(
    user,
    'cipta',
    'followUps',
    action.id,
    `Merekod tindakan susulan (${action.jenis}) untuk murid ID: ${action.studentId}`
  );
}

// ================= USER PROFILES & ROLES =================
export async function getUsersList(): Promise<UserProfile[]> {
  const users = getLocalItem<UserProfile[]>(STORAGE_KEYS.USERS, []);
  const demoNames = [
    'En. Justin Bin Moduying',
    'Pn. Masnah Binti Japar',
    'Ustaz Hafiz Bin Roslan',
    'Cik Norazimah Binti Abdullah',
    'Cikgu Elda Grace Majanil',
    'Cikgu Jerry Mojuntin',
    'Pn. Grace Liew',
    'En. Walter Gindol',
    'Ustaz Mohd Azlan'
  ];

  const cleanUsers = users.filter(u => 
    !u.uid.startsWith('demo_') &&
    !demoNames.includes(u.nama)
  );

  if (cleanUsers.length === 0) {
    cleanUsers.push({
      uid: 'admin_sekolah',
      nama: 'Pentadbir Sistem HEM (DELIMa)',
      emel: 'admin.salaping@moe-dl.edu.my',
      peranan: ['admin_sistem', 'pengetua', 'gpk_hem'],
      jawatan: 'Pentadbir Utama Sekolah',
      aktif: true,
      dicipta: new Date().toISOString()
    });
    setLocalItem(STORAGE_KEYS.USERS, cleanUsers);
  } else if (cleanUsers.length !== users.length) {
    setLocalItem(STORAGE_KEYS.USERS, cleanUsers);
  }

  return cleanUsers;
}

export async function saveUserProfile(
  profile: UserProfile,
  operator: { uid: string; nama: string }
): Promise<void> {
  const currentList = await getUsersList();
  const existingIdx = currentList.findIndex(u => u.uid === profile.uid);

  if (existingIdx >= 0) {
    currentList[existingIdx] = profile;
  } else {
    currentList.push(profile);
  }

  setLocalItem(STORAGE_KEYS.USERS, currentList);
  await addAuditLog(
    operator,
    existingIdx >= 0 ? 'ubah' : 'cipta',
    'users',
    profile.uid,
    `Mengemaskini profil/peranan pengguna: ${profile.nama} (${profile.emel}) -> [${profile.peranan.join(', ')}]`
  );
}

export async function deleteUserProfile(
  uid: string,
  operator: { uid: string; nama: string }
): Promise<void> {
  const currentList = await getUsersList();
  const userToDelete = currentList.find(u => u.uid === uid);
  const updatedList = currentList.filter(u => u.uid !== uid);
  setLocalItem(STORAGE_KEYS.USERS, updatedList);

  if (db && isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.warn('Ralat memadam pengguna dari Firestore:', err);
    }
  }

  await addAuditLog(
    operator,
    'padam',
    'users',
    uid,
    `Memadam profil guru/pengguna: ${userToDelete?.nama || uid} (${userToDelete?.emel || ''})`
  );
}

export async function purgeAllDemoUsers(
  operator: { uid: string; nama: string }
): Promise<void> {
  const currentList = await getUsersList();
  const cleanUsers = currentList.filter(u => 
    !u.uid.startsWith('demo_') &&
    !['En. Justin Bin Moduying', 'Pn. Masnah Binti Japar', 'Ustaz Hafiz Bin Roslan', 'Cik Norazimah Binti Abdullah', 'Cikgu Elda Grace Majanil', 'Cikgu Jerry Mojuntin', 'Pn. Grace Liew', 'En. Walter Gindol'].includes(u.nama)
  );

  if (cleanUsers.length === 0) {
    cleanUsers.push({
      uid: 'admin_sekolah',
      nama: 'Pentadbir Sistem HEM (DELIMa)',
      emel: 'admin.salaping@moe-dl.edu.my',
      peranan: ['admin_sistem', 'pengetua', 'gpk_hem'],
      jawatan: 'Pentadbir Utama Sekolah',
      aktif: true,
      dicipta: new Date().toISOString()
    });
  }

  setLocalItem(STORAGE_KEYS.USERS, cleanUsers);
  await addAuditLog(
    operator,
    'padam',
    'users',
    'purge_demo_users',
    'Memadamkan semua nama staf dan akaun pengguna demo dari pangkalan data.'
  );
}

export async function getClassesList(): Promise<ClassInfo[]> {
  return getLocalItem<ClassInfo[]>(STORAGE_KEYS.CLASSES, CLASSES_LIST);
}

export async function saveClassesList(
  classes: ClassInfo[],
  operator: { uid: string; nama: string }
): Promise<void> {
  setLocalItem(STORAGE_KEYS.CLASSES, classes);
  await addAuditLog(
    operator,
    'ubah',
    'classes',
    'school_classes',
    `Mengemaskini senarai kelas sekolah (${classes.length} kelas didaftarkan)`
  );
}

// ================= EMERGENCY FULL DATA BACKUP (OFFLINE-FIRST SABAH) =================
export async function exportCompleteBackupJSON(operator: { uid: string; nama: string }): Promise<string> {
  const fullBackup = {
    metadata: {
      sistem: 'HEM Digital',
      sekolah: 'SMK Salaping, Kota Marudu, Sabah',
      tarikhEksport: new Date().toISOString(),
      dieksportOleh: operator.nama,
      versi: '2.0.0-SabahOffline'
    },
    students: getLocalItem(STORAGE_KEYS.STUDENTS, []),
    attendance: getLocalItem(STORAGE_KEYS.ATTENDANCE, {}),
    disciplineCases: getLocalItem(STORAGE_KEYS.DISCIPLINE, []),
    boardMeetings: getLocalItem(STORAGE_KEYS.BOARD_MEETINGS, []),
    bullyingReports: getLocalItem(STORAGE_KEYS.BULLYING_REPORTS, []),
    awarenessPrograms: getLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, []),
    counselingSessions: getLocalItem(STORAGE_KEYS.COUNSELING, []),
    mentalHealthScreenings: getLocalItem(STORAGE_KEYS.MENTAL_HEALTH, []),
    mentorMenteePairs: getLocalItem(STORAGE_KEYS.MENTOR_MENTEE, []),
    careerProfiles: getLocalItem(STORAGE_KEYS.CAREER_PROFILES, []),
    assistanceRecords: getLocalItem(STORAGE_KEYS.ASSISTANCE, []),
    assistanceApplications: getLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, []),
    hostelRooms: getLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, []),
    hostelMovements: getLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, []),
    hostelInspections: getLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, []),
    hostelDailyReports: getLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, []),
    sickBayRecords: getLocalItem(STORAGE_KEYS.SICK_BAY, []),
    inspections3K: getLocalItem(STORAGE_KEYS.INSPECTIONS_3K, []),
    emergencyContacts: getLocalItem(STORAGE_KEYS.EMERGENCY_CONTACTS, []),
    fireDrills: getLocalItem(STORAGE_KEYS.FIRE_DRILLS, []),
    prefects: getLocalItem(STORAGE_KEYS.PREFECTS, []),
    prefectRosters: getLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, []),
    hemPrograms: getLocalItem(STORAGE_KEYS.HEM_PROGRAMS, []),
    assemblyDuties: getLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, []),
    hemMeetings: getLocalItem(STORAGE_KEYS.HEM_MEETINGS, []),
    followUpActions: getLocalItem(STORAGE_KEYS.FOLLOW_UPS, []),
    schoolSettings: getLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, INITIAL_SCHOOL_SETTINGS),
    rulesSettings: getLocalItem(STORAGE_KEYS.RULES_SETTINGS, INITIAL_RULES_SETTINGS),
    users: getLocalItem(STORAGE_KEYS.USERS, []),
    auditLogs: getLocalItem(STORAGE_KEYS.AUDIT_LOGS, [])
  };

  await addAuditLog(
    operator,
    'eksport',
    'sistem',
    'sandaran_penuh',
    'Memuat turun sandaran pangkalan data JSON penuh untuk kegunaan kecemasan luar talian (Disaster Recovery)'
  );

  return JSON.stringify(fullBackup, null, 2);
}

export async function importCompleteBackupJSON(
  jsonContent: string,
  operator: { uid: string; nama: string }
): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed.metadata || parsed.metadata.sistem !== 'HEM Digital') {
      throw new Error('Format fail sandaran tidak sah untuk HEM Digital.');
    }

    if (parsed.students) setLocalItem(STORAGE_KEYS.STUDENTS, parsed.students);
    if (parsed.attendance) setLocalItem(STORAGE_KEYS.ATTENDANCE, parsed.attendance);
    if (parsed.disciplineCases) setLocalItem(STORAGE_KEYS.DISCIPLINE, parsed.disciplineCases);
    if (parsed.boardMeetings) setLocalItem(STORAGE_KEYS.BOARD_MEETINGS, parsed.boardMeetings);
    if (parsed.bullyingReports) setLocalItem(STORAGE_KEYS.BULLYING_REPORTS, parsed.bullyingReports);
    if (parsed.awarenessPrograms) setLocalItem(STORAGE_KEYS.AWARENESS_PROGRAMS, parsed.awarenessPrograms);
    if (parsed.counselingSessions) setLocalItem(STORAGE_KEYS.COUNSELING, parsed.counselingSessions);
    if (parsed.mentalHealthScreenings) setLocalItem(STORAGE_KEYS.MENTAL_HEALTH, parsed.mentalHealthScreenings);
    if (parsed.mentorMenteePairs) setLocalItem(STORAGE_KEYS.MENTOR_MENTEE, parsed.mentorMenteePairs);
    if (parsed.careerProfiles) setLocalItem(STORAGE_KEYS.CAREER_PROFILES, parsed.careerProfiles);
    if (parsed.assistanceRecords) setLocalItem(STORAGE_KEYS.ASSISTANCE, parsed.assistanceRecords);
    if (parsed.assistanceApplications) setLocalItem(STORAGE_KEYS.ASSISTANCE_APPS, parsed.assistanceApplications);
    if (parsed.hostelRooms) setLocalItem(STORAGE_KEYS.HOSTEL_ROOMS, parsed.hostelRooms);
    if (parsed.hostelMovements) setLocalItem(STORAGE_KEYS.HOSTEL_MOVEMENTS, parsed.hostelMovements);
    if (parsed.hostelInspections) setLocalItem(STORAGE_KEYS.HOSTEL_INSPECTIONS, parsed.hostelInspections);
    if (parsed.hostelDailyReports) setLocalItem(STORAGE_KEYS.HOSTEL_DAILY_REPORTS, parsed.hostelDailyReports);
    if (parsed.sickBayRecords) setLocalItem(STORAGE_KEYS.SICK_BAY, parsed.sickBayRecords);
    if (parsed.inspections3K) setLocalItem(STORAGE_KEYS.INSPECTIONS_3K, parsed.inspections3K);
    if (parsed.emergencyContacts) setLocalItem(STORAGE_KEYS.EMERGENCY_CONTACTS, parsed.emergencyContacts);
    if (parsed.fireDrills) setLocalItem(STORAGE_KEYS.FIRE_DRILLS, parsed.fireDrills);
    if (parsed.prefects) setLocalItem(STORAGE_KEYS.PREFECTS, parsed.prefects);
    if (parsed.prefectRosters) setLocalItem(STORAGE_KEYS.PREFECT_ROSTERS, parsed.prefectRosters);
    if (parsed.hemPrograms) setLocalItem(STORAGE_KEYS.HEM_PROGRAMS, parsed.hemPrograms);
    if (parsed.assemblyDuties) setLocalItem(STORAGE_KEYS.ASSEMBLY_DUTIES, parsed.assemblyDuties);
    if (parsed.hemMeetings) setLocalItem(STORAGE_KEYS.HEM_MEETINGS, parsed.hemMeetings);
    if (parsed.followUpActions) setLocalItem(STORAGE_KEYS.FOLLOW_UPS, parsed.followUpActions);
    if (parsed.schoolSettings) setLocalItem(STORAGE_KEYS.SCHOOL_SETTINGS, parsed.schoolSettings);
    if (parsed.rulesSettings) setLocalItem(STORAGE_KEYS.RULES_SETTINGS, parsed.rulesSettings);
    if (parsed.users) setLocalItem(STORAGE_KEYS.USERS, parsed.users);

    await addAuditLog(
      operator,
      'import',
      'sistem',
      'pulih_sandaran',
      'Memulihkan keseluruhan pangkalan data daripada fail sandaran JSON luar talian'
    );

    return true;
  } catch (err) {
    console.error('Ralat import sandaran:', err);
    throw err;
  }
}
