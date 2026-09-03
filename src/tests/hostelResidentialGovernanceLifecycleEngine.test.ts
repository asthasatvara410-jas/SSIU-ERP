import { describe, it, expect } from 'vitest';
import { hostelResidentialGovernanceLifecycleService } from '../services/hostelResidentialGovernanceLifecycleService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 42: Hostel & Residential Management Engine', () => {

  it('TEST 1: Dynamic Capacity & Occupancy Derivation: Accurately calculates total, occupied, and available beds', () => {
    const occ = hostelResidentialGovernanceLifecycleService.getHostelOccupancy('Swarrnim Boys Hostel 1');
    expect(occ.totalBeds).toBe(3);
    expect(occ.occupiedBeds).toBe(0);
    expect(occ.availableBeds).toBe(3);
    expect(occ.occupancyPercentage).toBe(0);
  });

  it('TEST 2: Atomic Bed Allocation Engine: Allocates bed to student, transitions bed status to ALLOCATED', () => {
    const alloc = hostelResidentialGovernanceLifecycleService.allocateBedToStudent({
      studentId: 'stud-001',
      enrollmentNumber: 'SSIU26BCA000059',
      bedId: 'bed-101-a',
      academicYear: '2026-2027'
    });

    expect(alloc.status).toBe('ACTIVE');
    expect(alloc.roomNumber).toBe('101');
    expect(alloc.bedNumber).toBe('101-A');

    // Occupancy should now reflect 1 occupied out of 3 (33%)
    const occAfter = hostelResidentialGovernanceLifecycleService.getHostelOccupancy('Swarrnim Boys Hostel 1');
    expect(occAfter.occupiedBeds).toBe(1);
    expect(occAfter.availableBeds).toBe(2);
    expect(occAfter.occupancyPercentage).toBe(33);
  });

  it('TEST 3: Duplicate Allocation & Over-capacity Protection: Blocks multiple active allocations for same student or bed', () => {
    // Attempting duplicate allocation for same student
    expect(() => {
      hostelResidentialGovernanceLifecycleService.allocateBedToStudent({
        studentId: 'stud-001',
        enrollmentNumber: 'SSIU26BCA000059',
        bedId: 'bed-101-b',
        academicYear: '2026-2027'
      });
    }).toThrow(/already has an active hostel allocation/);

    // Attempting allocation of an already occupied bed
    expect(() => {
      hostelResidentialGovernanceLifecycleService.allocateBedToStudent({
        studentId: 'stud-002',
        enrollmentNumber: 'SSIU26BCA000060',
        bedId: 'bed-101-a', // Already allocated
        academicYear: '2026-2027'
      });
    }).toThrow(/is not available/);
  });

  it('TEST 4: Atomic Room/Bed Transfer & Outpass Verification: Transfers student to new room, releases old bed, and verifies outpass', () => {
    const transfer = hostelResidentialGovernanceLifecycleService.transferStudentBed({
      studentId: 'stud-001',
      targetBedId: 'bed-102-a'
    });

    expect(transfer.previousAllocation.status).toBe('TRANSFERRED');
    expect(transfer.newAllocation.status).toBe('ACTIVE');
    expect(transfer.newAllocation.roomNumber).toBe('102');
    expect(transfer.newAllocation.bedNumber).toBe('102-A');

    // Issue Outpass
    const outpass = hostelResidentialGovernanceLifecycleService.createAndApproveOutpass({
      studentId: 'stud-001',
      reason: 'Home Visit over weekend',
      destination: 'Ahmedabad',
      departureTime: '2026-08-29T18:00:00Z',
      expectedReturnTime: '2026-08-31T09:00:00Z'
    });

    expect(outpass.status).toBe('ACTIVE');
    expect(outpass.roomNumber).toBe('102');
    expect(outpass.destination).toBe('Ahmedabad');
  });
});
