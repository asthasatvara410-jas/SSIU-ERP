import { describe, it, expect } from 'vitest';
import { hrEmployeeLifecycleGovernanceService } from '../services/hrEmployeeLifecycleGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 19: HR + Employee + Faculty + Staff Lifecycle Engine', () => {

  const facultyAContext: UserAuthorizationContext = {
    userId: 'emp-fac-101',
    userName: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const facultyBContext: UserAuthorizationContext = {
    userId: 'emp-fac-102',
    userName: 'Prof. Anjali Sharma',
    email: 'anjali.sharma@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Acyclic Reporting Hierarchy: Validates reporting chain and strictly disallows self-reporting and circular loops', () => {
    // Valid: Assistant Registrar -> Deputy Registrar -> Registrar
    const validChain = hrEmployeeLifecycleGovernanceService.isReportingChainValid('emp-ar-01', 'emp-dr-01');
    expect(validChain).toBe(true);

    // Invalid: Self reporting
    const selfReport = hrEmployeeLifecycleGovernanceService.isReportingChainValid('emp-reg-01', 'emp-reg-01');
    expect(selfReport).toBe(false);

    // Invalid: Circular reporting (Making Registrar report to Assistant Registrar)
    const circularChain = hrEmployeeLifecycleGovernanceService.isReportingChainValid('emp-reg-01', 'emp-ar-01');
    expect(circularChain).toBe(false);
  });

  it('TEST 2: Promotion Lineage: Records promotion history and updates active designation without destroying past records', () => {
    const details = hrEmployeeLifecycleGovernanceService.getEmployeeDetails('emp-fac-101');
    expect(details).toBeDefined();
    expect(details?.employee.designationTitle).toBe('Associate Professor');
    expect(details?.promotions.length).toBeGreaterThan(0);
    expect(details?.promotions[0].oldDesignationTitle).toBe('Assistant Professor');
  });

  it('TEST 3: Vacancy Calculation: Dynamically derives vacant strength from sanctioned and filled positions', () => {
    const strength = hrEmployeeLifecycleGovernanceService.getStaffStrengthSummary('ou-sit-cse');
    expect(strength.totalSanctioned).toBe(4);
    expect(strength.totalFilled).toBe(3);
    expect(strength.totalVacant).toBe(1); // 4 - 3 = 1
  });

  it('TEST 4: Employee Privacy: Employee A can view own profile, but Employee B is blocked from viewing Employee A dossier', () => {
    const ownDetails = hrEmployeeLifecycleGovernanceService.getEmployeeDetails('emp-fac-101', facultyAContext);
    expect(ownDetails).toBeDefined();

    const unauthorizedDetails = hrEmployeeLifecycleGovernanceService.getEmployeeDetails('emp-fac-101', facultyBContext);
    expect(unauthorizedDetails).toBeUndefined(); // Strictly blocked
  });
});
