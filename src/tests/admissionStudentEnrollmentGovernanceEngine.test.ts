import { describe, it, expect } from 'vitest';
import { admissionStudentEnrollmentGovernanceService } from '../services/admissionStudentEnrollmentGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 34: Admission & Student Enrollment Management System Engine', () => {

  it('TEST 1: Dynamic Program Seat Availability: Computes total, confirmed, and vacant seats accurately', () => {
    const availability = admissionStudentEnrollmentGovernanceService.getSeatAvailability('intake-bca-2026');
    expect(availability.totalIntakeSeats).toBe(60);
    expect(availability.confirmedAdmissionsCount).toBe(58);
    expect(availability.availableSeatsCount).toBe(2);
  });

  it('TEST 2: Controlled Student Master Creation: Enrolls candidate, assigns unique Enrollment No and Roll No', () => {
    const student1 = admissionStudentEnrollmentGovernanceService.confirmAdmissionAndCreateStudent({
      applicationId: 'adm-app-01',
      batchName: '2026-2029',
      sectionName: 'A'
    });

    expect(student1.admissionStatus).toBe('ACTIVE');
    expect(student1.enrollmentNumber).toBe('SSIU26BCA000059');
    expect(student1.rollNumber).toBe('BCA-26-A-59');

    // Seat available should decrement from 2 to 1
    const availabilityAfter = admissionStudentEnrollmentGovernanceService.getSeatAvailability('intake-bca-2026');
    expect(availabilityAfter.availableSeatsCount).toBe(1);
  });

  it('TEST 3: Duplicate Student Master Prevention: Blocks duplicate creation for an already enrolled application', () => {
    expect(() => {
      admissionStudentEnrollmentGovernanceService.confirmAdmissionAndCreateStudent({
        applicationId: 'adm-app-01', // already confirmed
        batchName: '2026-2029',
        sectionName: 'A'
      });
    }).toThrow(/Student already created/);
  });

  it('TEST 4: Overbooking Protection: Exhausts remaining seats and strictly blocks confirmation beyond capacity', () => {
    // Fill the 60th and final seat with adm-app-02
    const student2 = admissionStudentEnrollmentGovernanceService.confirmAdmissionAndCreateStudent({
      applicationId: 'adm-app-02',
      batchName: '2026-2029',
      sectionName: 'A'
    });
    expect(student2.enrollmentNumber).toBe('SSIU26BCA000060');

    // Available seats should now be 0
    const availabilityFinal = admissionStudentEnrollmentGovernanceService.getSeatAvailability('intake-bca-2026');
    expect(availabilityFinal.availableSeatsCount).toBe(0);

    // Attempting 61st student confirmation must fail
    expect(() => {
      admissionStudentEnrollmentGovernanceService.confirmAdmissionAndCreateStudent({
        applicationId: 'adm-app-03',
        batchName: '2026-2029',
        sectionName: 'A'
      });
    }).toThrow(/Intake capacity full/);
  });
});
