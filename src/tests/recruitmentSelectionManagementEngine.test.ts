import { describe, it, expect } from 'vitest';
import { recruitmentSelectionGovernanceService } from '../services/recruitmentSelectionGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 33: Recruitment & Selection Management System Engine', () => {

  it('TEST 1: Dynamic Position Vacancy Derivation: Computes vacant strength from sanctioned vs active employees', () => {
    const strength = recruitmentSelectionGovernanceService.getPositionVacancyStrength('pos-cse-prof');
    expect(strength.sanctionedStrength).toBe(5);
    expect(strength.activeEmployeeCount).toBe(3);
    expect(strength.vacantPositionsCount).toBe(2);
  });

  it('TEST 2: Weighted Merit Calculation Engine: Ranks candidates by weighted scores (Test 40%, Interview 40%, Exp 20%)', () => {
    const meritList = recruitmentSelectionGovernanceService.computeMeritList('vac-01');
    expect(meritList.length).toBe(3);

    // app-01: 85*0.4 + 90*0.4 + 95*0.2 = 34 + 36 + 19 = 89
    expect(meritList[0].id).toBe('app-01');
    expect(meritList[0].meritScore).toBe(89);

    // app-02: 80*0.4 + 85*0.4 + 80*0.2 = 32 + 34 + 16 = 82
    expect(meritList[1].id).toBe('app-02');
    expect(meritList[1].meritScore).toBe(82);

    // app-03: 65*0.4 + 70*0.4 + 60*0.2 = 26 + 28 + 12 = 66
    expect(meritList[2].id).toBe('app-03');
    expect(meritList[2].meritScore).toBe(66);
  });

  it('TEST 3: Offer Issuance & Ceiling Enforcement: Issues offers up to approved posts and blocks overflow', () => {
    const offer1 = recruitmentSelectionGovernanceService.issueOfferToSelectedCandidate({
      applicationId: 'app-01',
      offeredSalaryMonthly: 120000,
      joiningDeadline: '2026-09-15'
    });
    expect(offer1.status).toBe('ISSUED');

    const offer2 = recruitmentSelectionGovernanceService.issueOfferToSelectedCandidate({
      applicationId: 'app-02',
      offeredSalaryMonthly: 110000,
      joiningDeadline: '2026-09-15'
    });
    expect(offer2.status).toBe('ISSUED');

    // Attempting 3rd offer for vacancy of 2 posts
    expect(() => {
      recruitmentSelectionGovernanceService.issueOfferToSelectedCandidate({
        applicationId: 'app-03',
        offeredSalaryMonthly: 100000,
        joiningDeadline: '2026-09-15'
      });
    }).toThrow(/Selection ceiling reached/);
  });

  it('TEST 4: Candidate to Employee Conversion: Confirms joining, generates employee code, and updates position strength', () => {
    // Re-issue an offer for app-01 and complete joining
    const offer = recruitmentSelectionGovernanceService.issueOfferToSelectedCandidate.bind(recruitmentSelectionGovernanceService);
    // Use the first offer already created in test 3
    const offers = (recruitmentSelectionGovernanceService as any).offers;
    const firstOffer = offers[0];

    const conversion = recruitmentSelectionGovernanceService.confirmJoiningAndConvertToEmployee(firstOffer.id);
    expect(conversion.status).toBe('JOINED');
    expect(conversion.employeeCode).toContain('EMP-2026-');

    // Position active count should have incremented from 3 to 4
    const updatedStrength = recruitmentSelectionGovernanceService.getPositionVacancyStrength('pos-cse-prof');
    expect(updatedStrength.activeEmployeeCount).toBe(4);
    expect(updatedStrength.vacantPositionsCount).toBe(1); // 5 - 4 = 1
  });
});
