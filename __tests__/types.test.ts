import { UserRole, AcademicTrack, BadgeID, getAcademicTrackLabel } from '../types';

describe('Type Definitions', () => {
  describe('UserRole Enum', () => {
    it('should have correct role values', () => {
      expect(UserRole.Coach).toBe('coach');
      expect(UserRole.Student).toBe('student');
      expect(UserRole.SuperAdmin).toBe('superadmin');
      expect(UserRole.Parent).toBe('parent');
    });
  });

  describe('AcademicTrack Enum', () => {
    it('should have correct track values', () => {
      expect(AcademicTrack.Sayisal).toBe('sayisal');
      expect(AcademicTrack.EsitAgirlik).toBe('esit-agirlik');
      expect(AcademicTrack.Sozel).toBe('sozel');
      expect(AcademicTrack.Dil).toBe('dil');
    });
  });

  describe('BadgeID Enum', () => {
    it('should have correct badge IDs', () => {
      expect(BadgeID.FirstAssignment).toBe('first-assignment');
      expect(BadgeID.HighAchiever).toBe('high-achiever');
      expect(BadgeID.PerfectScore).toBe('perfect-score');
    });
  });

  describe('getAcademicTrackLabel', () => {
    it('should return correct labels for academic tracks', () => {
      expect(getAcademicTrackLabel(AcademicTrack.Sayisal)).toBe('Sayısal');
      expect(getAcademicTrackLabel(AcademicTrack.EsitAgirlik)).toBe('Eşit Ağırlık');
      expect(getAcademicTrackLabel(AcademicTrack.Sozel)).toBe('Sözel');
      expect(getAcademicTrackLabel(AcademicTrack.Dil)).toBe('Dil');
    });

    it('should return empty string for invalid track', () => {
      expect(getAcademicTrackLabel('invalid' as AcademicTrack)).toBe('');
    });
  });
});
