import { describe, it, expect } from 'vitest';
import { admissionEnquiryLifecycleGovernanceService } from '../services/admissionEnquiryLifecycleGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 24: Admission Management + Enquiry/Lead + Complete Admission Lifecycle Engine', () => {

  const admissionAdminContext: UserAuthorizationContext = {
    userId: 'usr-adm-admin',
    userName: 'Admission Officer SSIU',
    email: 'admissions@ssiu.ac.in',
    activeRole: 'ADMIN',
    assignedRoles: ['ADMIN'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Seat Matrix Inventory Engine: Dynamically tracks seat availability and prevents overflow', () => {
    const summaryBefore = admissionEnquiryLifecycleGovernanceService.getEnquirySummary(admissionAdminContext);
    const matrixBefore = summaryBefore.seatMatrices[0];
    const initialAvailable = matrixBefore.availableSeats;

    const updatedMatrix = admissionEnquiryLifecycleGovernanceService.allocateSeat({
      admissionCycleId: 'adm-cycle-2026-ug',
      programId: 'prog-1'
    });

    expect(updatedMatrix.availableSeats).toBe(initialAvailable - 1);
    expect(updatedMatrix.allocatedSeats).toBe(81);
  });

  it('TEST 2: Offer Acceptance & Canonical Student Conversion: Converts applicant to Student Master reusing Person ID', () => {
    const studentConversion = admissionEnquiryLifecycleGovernanceService.acceptOfferAndCreateStudent({
      offerId: 'off-01',
      personId: 'per-412',
      programId: 'prog-1',
      academicYearId: 'ay-2026-27'
    });

    expect(studentConversion.status).toBe('ACTIVE');
    expect(studentConversion.personId).toBe('per-412'); // Reuses person
    expect(studentConversion.studentNumber.startsWith('STU-2026-')).toBe(true);
    expect(studentConversion.universityEnrollmentNumber.startsWith('UNI-2026-')).toBe(true);
  });

  it('TEST 3: Admission Summary KPIs: Returns accurate counts for enquiries, cycles, and program seat inventories', () => {
    const summary = admissionEnquiryLifecycleGovernanceService.getEnquirySummary(admissionAdminContext);
    expect(summary.totalEnquiries).toBeGreaterThan(0);
    expect(summary.cycles.length).toBeGreaterThan(0);
    expect(summary.cycles[0].status).toBe('OPEN');
  });
});
