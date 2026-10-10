import { DisciplineCase, UserRole } from '../types';

export interface WorkflowValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pengesahan Peraturan Disiplin KPM:
 * 1. Kes berat (Gantung / Buang sekolah) TIDAK BOLEH diselesaikan jika pertuduhan,
 *    bela diri, dan kaunseling belum ditanda lengkap.
 * 2. Keputusan gantung / buang sekolah HANYA boleh dibuat oleh Pengetua atau GPK HEM.
 */
export function validateSevereDisciplineAction(
  tindakan: string,
  targetStatusAliran: string,
  langkah: { pertuduhan: boolean; belaDiri: boolean; kaunseling: boolean },
  userRoles: UserRole[]
): WorkflowValidationResult {
  const isSevereAction =
    tindakan.toLowerCase().includes('gantung') ||
    tindakan.toLowerCase().includes('buang');

  // Semak peranan Pengetua / GPK HEM
  const isPengetuaOrGpkHem =
    userRoles.includes('pengetua') ||
    userRoles.includes('gpk_hem') ||
    userRoles.includes('admin_sistem');

  if (isSevereAction && !isPengetuaOrGpkHem) {
    return {
      allowed: false,
      reason: 'KEBENARAN DIHADKAN: Keputusan hukuman berat (gantung/buang sekolah) hanya boleh dimasukkan oleh Pengetua atau GPK HEM.'
    };
  }

  // Semak prasyarat penyelesaian kes berat
  if (isSevereAction && (targetStatusAliran === 'selesai' || targetStatusAliran === 'dipantau')) {
    if (!langkah.pertuduhan || !langkah.belaDiri || !langkah.kaunseling) {
      return {
        allowed: false,
        reason: 'HALANGAN TATATERTIB KPM: Kes berat TIDAK BOLEH diselesaikan sebelum langkah Pertuduhan, Bela Diri, dan Kaunseling ditanda lengkap!'
      };
    }
  }

  return { allowed: true };
}

/**
 * Aliran status sah mengikut prosedur tatatertib KPM:
 * Dilaporkan -> Disiasat -> Pertuduhan & Bela Diri -> Kaunseling -> Keputusan -> Selesai / Dipantau
 */
export const VALID_DISCIPLINE_STATUS_FLOW = [
  'dilaporkan',
  'disiasat',
  'pertuduhan_bela_diri',
  'kaunseling',
  'keputusan',
  'selesai',
  'dipantau'
];

export function isSequentialStatusTransition(currentStatus: string, nextStatus: string): boolean {
  const currentIndex = VALID_DISCIPLINE_STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = VALID_DISCIPLINE_STATUS_FLOW.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) return false;
  // Boleh maju ke hadapan dalam aliran atau kembali satu langkah jika perlukan siasatan lanjut
  return nextIndex >= currentIndex || nextIndex === currentIndex - 1;
}
