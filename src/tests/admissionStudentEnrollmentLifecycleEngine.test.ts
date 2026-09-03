import { describe, it, expect } from 'vitest';
import { admissionStudentEnrollmentLifecycleService } from '../services/admissionStudentEnrollmentLifecycleService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 38: Admission & Student Enrollment Management System Engine', () => {

  it('TEST 1: Weighted Composite Merit Calculation: Accurately derives weighted score', () => {
    // 0.50*88 + 0.35*84 + 0.15*90 = 44 + 29.4 + 13.5 = 86.9
    const score = admissionStudentEnrollmentLifecycleService.calculateCompositeMerit(88, 84, 90);
    expect(score).toBe(86.9);
  });

  it('TEST 2: Dynamic Program Seat Matrix: Accurately derives sanctioned, filled, and available seats', () => {
    const seatMatrix = admissionStudentEnrollmentLifecycleService.getSeatAvailability('prog-bca');
    expect(seatMatrix.sanctionedSeats).toBe(60);
    expect(seatMatrix.filledSeats).toBe(58);
    expect(seatMatrix.availableSeats).toBe(2);
  });

  it('TEST 3: Controlled Student Master Instantiation: Generates canonical Enrollment No and Roll No upon confirmation', () => {
    const student = admissionStudentEnrollmentLifecycleService.confirmAdmissionAndInstantiateStudent({
      applicationId: 'app-doc-01',
      batchName: '2026-2029',
      sectionName: 'A'
    });

    expect(student.fullName).toBe('Harshil Varma');
    expect(student.enrollmentNumber).toBe('SSIU26BCA000059');
    expect(student.rollNumber).toBe('BCA-26-A-59');
    expect(student.academicStatus).toBe('ACTIVE');

    // Available seats should decrement from 2 to 1
    const seatMatrixAfter = admissionStudentEnrollmentLifecycleService.getSeatAvailability('prog-bca');
    expect(seatMatrixAfter.availableSeats).toBe(1);
  });

  it('TEST 4: Duplicate Prevention & Seat Overbooking Protection: Blocks duplicate student creation', () => {
    expect(() => {
      admissionStudentEnrollmentLifecycleService.confirmAdmissionAndInstantiateStudent({
        applicationId: 'app-doc-01', // Already confirmed
        batchName: '2026-2029',
        sectionName: 'A'
      });
    }).toThrow(/Student record already created/);
  });
});
