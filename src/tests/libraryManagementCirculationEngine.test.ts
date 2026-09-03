import { describe, it, expect } from 'vitest';
import { libraryManagementGovernanceService } from '../services/libraryManagementGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 29: Library Management System + Circulation, Fines & Clearance Engine', () => {

  it('TEST 1: Dynamic Book Availability: Computes available, issued, and damaged copies dynamically', () => {
    const availability = libraryManagementGovernanceService.getBookAvailability('bk-01');
    expect(availability.total).toBe(5);
    expect(availability.available).toBe(3);
    expect(availability.issued).toBe(1);
    expect(availability.damaged).toBe(1);
  });

  it('TEST 2: Book Circulation Engine: Issues available copy and blocks double-issuance of unavailable copy', () => {
    const issuedCirc = libraryManagementGovernanceService.issueBook({
      copyId: 'cpy-01',
      memberId: 'stud-002',
      memberType: 'STUDENT'
    });

    expect(issuedCirc.status).toBe('ISSUED');
    expect(issuedCirc.copyId).toBe('cpy-01');

    // Attempt double issue
    expect(() => {
      libraryManagementGovernanceService.issueBook({
        copyId: 'cpy-01', // now issued
        memberId: 'stud-003',
        memberType: 'STUDENT'
      });
    }).toThrow(/cannot be issued/);
  });

  it('TEST 3: Library Clearance Engine: Blocks clearance for member with active overdue issues and pending fines', () => {
    const clearance = libraryManagementGovernanceService.getMemberLibraryClearance('stud-001');
    expect(clearance.status).toBe('BLOCKED');
    expect(clearance.activeIssuedCount).toBeGreaterThan(0);
    expect(clearance.pendingFineAmount).toBe(80);
  });

  it('TEST 4: Digital Resources Catalog: Exposes active university research databases and e-resources', () => {
    const resources = libraryManagementGovernanceService.getDigitalResources();
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].status).toBe('ACTIVE');
    expect(resources[0].resourceType).toBe('RESEARCH_DATABASE');
  });
});
