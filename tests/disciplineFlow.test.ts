import { describe, it, expect } from 'vitest';
import {
  validateSevereDisciplineAction,
  isSequentialStatusTransition
} from '../src/services/disciplineValidator';
import { UserRole } from '../src/types';

describe('Discipline Workflow Validation (SSDM Prosedur KPM)', () => {
  it('menyekat keputusan gantung/buang sekolah jika dibuat oleh Guru Disiplin / Guru Biasa', () => {
    const roles: UserRole[] = ['guru_disiplin'];
    const result = validateSevereDisciplineAction(
      'Gantung Persekolahan Sementara (PGB/GPK Sahaja)',
      'keputusan',
      { pertuduhan: true, belaDiri: true, kaunseling: true },
      roles
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('hanya boleh dimasukkan oleh Pengetua atau GPK HEM');
  });

  it('membenarkan keputusan gantung sekolah jika dibuat oleh Pengetua atau GPK HEM', () => {
    const roles: UserRole[] = ['pengetua'];
    const result = validateSevereDisciplineAction(
      'Gantung Persekolahan Sementara (PGB/GPK Sahaja)',
      'keputusan',
      { pertuduhan: true, belaDiri: true, kaunseling: true },
      roles
    );

    expect(result.allowed).toBe(true);
  });

  it('MENGHALANG penutupan kes berat (status selesai) jika langkah pertuduhan/bela diri/kaunseling belum lengkap', () => {
    const roles: UserRole[] = ['gpk_hem'];
    
    // Kes kaunseling belum selesai
    const result = validateSevereDisciplineAction(
      'Buang Sekolah (Dengan Kelulusan PPD/JPN - PGB Sahaja)',
      'selesai',
      { pertuduhan: true, belaDiri: true, kaunseling: false },
      roles
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('HALANGAN TATATERTIB KPM');
  });

  it('membenarkan penutupan kes berat (status selesai) hanya apabila pertuduhan, bela diri DAN kaunseling lengkap', () => {
    const roles: UserRole[] = ['gpk_hem'];
    
    const result = validateSevereDisciplineAction(
      'Gantung Persekolahan Sementara (PGB/GPK Sahaja)',
      'selesai',
      { pertuduhan: true, belaDiri: true, kaunseling: true },
      roles
    );

    expect(result.allowed).toBe(true);
  });

  it('mengesahkan jujukan aliran status tatatertib KPM yang teratur', () => {
    expect(isSequentialStatusTransition('dilaporkan', 'disiasat')).toBe(true);
    expect(isSequentialStatusTransition('disiasat', 'pertuduhan_bela_diri')).toBe(true);
    expect(isSequentialStatusTransition('pertuduhan_bela_diri', 'kaunseling')).toBe(true);
    expect(isSequentialStatusTransition('kaunseling', 'keputusan')).toBe(true);
    expect(isSequentialStatusTransition('keputusan', 'selesai')).toBe(true);
    expect(isSequentialStatusTransition('status_tidak_wujud', 'disiasat')).toBe(false);
  });
});
