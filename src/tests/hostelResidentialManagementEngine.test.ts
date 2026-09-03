import { describe, it, expect } from 'vitest';
import { hostelResidentialGovernanceService } from '../services/hostelResidentialGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 30: Hostel / Residential Management System Engine', () => {

  it('TEST 1: Dynamic Occupancy & Capacity Calculation: Computes beds, occupancy %, and vacancy from physical beds', () => {
    const metrics = hostelResidentialGovernanceService.getHostelOccupancyMetrics('host-boys-1');
    expect(metrics.totalCapacity).toBe(4);
    expect(metrics.occupiedBeds).toBe(1);
    expect(metrics.vacantBeds).toBe(3);
    expect(metrics.occupancyRatePercentage).toBe(25); // 1 / 4 * 100
  });

  it('TEST 2: Bed Allocation Integrity: Enforces single active bed per student and blocks duplicate active beds', () => {
    // Attempt allocating another bed to student-001 who already has bed-101-1
    expect(() => {
      hostelResidentialGovernanceService.allocateBedToStudent({
        studentId: 'stud-001',
        hostelId: 'host-boys-1',
        roomId: 'rm-102',
        bedId: 'bed-102-1',
        academicYearId: 'ay-2026-27'
      });
    }).toThrow(/already has an active bed allocation/);

    // Valid allocation for new student-002
    const alloc = hostelResidentialGovernanceService.allocateBedToStudent({
      studentId: 'stud-002',
      hostelId: 'host-boys-1',
      roomId: 'rm-101',
      bedId: 'bed-101-2',
      academicYearId: 'ay-2026-27'
    });
    expect(alloc.status).toBe('ACTIVE');
    expect(alloc.studentId).toBe('stud-002');
  });

  it('TEST 3: Double Allocation Prevention: Blocks allocation of an already allocated bed', () => {
    expect(() => {
      hostelResidentialGovernanceService.allocateBedToStudent({
        studentId: 'stud-003',
        hostelId: 'host-boys-1',
        roomId: 'rm-101',
        bedId: 'bed-101-1', // already allocated
        academicYearId: 'ay-2026-27'
      });
    }).toThrow(/cannot be allocated because status is ALLOCATED/);
  });

  it('TEST 4: Outpass & Clearance Governance: Tracks student outpasses and blocks clearance while resident', () => {
    const outpass = hostelResidentialGovernanceService.issueOutpass({
      studentId: 'stud-002',
      destination: 'Vadodara (Weekend Leave)',
      fromDate: '2026-08-28T18:00:00Z',
      toDate: '2026-08-30T20:00:00Z'
    });
    expect(outpass.status).toBe('APPROVED');
    expect(outpass.isLateReturn).toBe(false);

    const clearance = hostelResidentialGovernanceService.getHostelClearance('stud-001');
    expect(clearance.clearanceStatus).toBe('BLOCKED'); // Still actively resident
  });
});
