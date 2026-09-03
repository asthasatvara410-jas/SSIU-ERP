import { describe, it, expect } from 'vitest';
import { student360DossierAggregationService } from '../services/student360DossierAggregationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 25: Student Information System (SIS) + Student 360° Profile & Dossier Engine', () => {

  const studentAContext: UserAuthorizationContext = {
    userId: 'stud-001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'stud-002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Student 360 Aggregation: Accurately aggregates personal, academic, financial, and logistics records', () => {
    const dossier = student360DossierAggregationService.getStudent360Dossier('stud-001');
    expect(dossier).toBeDefined();
    expect(dossier?.fullName).toBe('Aarav Patel');
    expect(dossier?.progress.currentSGPA).toBe(9.5);
    expect(dossier?.campusServices.hostelBed).toBeDefined();
    expect(dossier?.finance.clearanceStatus).toBe('CLEARED');
    expect(dossier?.timeline.length).toBeGreaterThanOrEqual(4);
  });

  it('TEST 2: Deep Link Security & RBAC: Student A can view own dossier, but Student B cannot view Student A dossier', () => {
    const ownDossier = student360DossierAggregationService.getStudent360Dossier('stud-001', studentAContext);
    expect(ownDossier).toBeDefined();

    const unauthorizedDossier = student360DossierAggregationService.getStudent360Dossier('stud-001', studentBContext);
    expect(unauthorizedDossier).toBeUndefined(); // Deep link strictly rejected
  });
});
