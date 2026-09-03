import { describe, it, expect } from 'vitest';
import { centralCampusServicesIntegrationValidationService } from '../services/centralCampusServicesIntegrationValidationService';

describe('SSIU ERP – Phase 40.7: Library / Hostel / Transport End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Library Fine Calculation: Computes overdue fines accurately based on elapsed due date', () => {
    const overdue = centralCampusServicesIntegrationValidationService.calculateLibraryFine(3, 50);

    expect(overdue.fineAmount).toBe(150);
    expect(overdue.isOverdue).toBe(true);

    const onTime = centralCampusServicesIntegrationValidationService.calculateLibraryFine(0, 50);
    expect(onTime.fineAmount).toBe(0);
    expect(onTime.isOverdue).toBe(false);
  });

  it('TEST 2: Facility Capacity Limits: Allows valid allocations and blocks allocations once room or vehicle is full', () => {
    // 1. Valid allocation under capacity
    expect(centralCampusServicesIntegrationValidationService.validateCapacityLimit(3, 4)).toBe(true);

    // 2. Full capacity blocks further assignment
    expect(centralCampusServicesIntegrationValidationService.validateCapacityLimit(4, 4)).toBe(false);
  });

  it('TEST 3: Complete 25-Step Campus Services Integration: Verifies Student 360 link across Library, Hostel, and Transport', () => {
    const summary = centralCampusServicesIntegrationValidationService.runCompleteCampusServicesScenario();

    expect(summary.student_id).toBe('STU-2026-101');
    expect(summary.library.member_id).toBe('LIB-MEM-2026-STU-2026-101');
    expect(summary.library.fines_due).toBe(0);
    expect(summary.library.is_cleared).toBe(true);

    expect(summary.hostel.room_number).toBe('HOSTEL-B-204');
    expect(summary.hostel.bed_number).toBe('BED-1');
    expect(summary.hostel.fee_due).toBe(0);
    expect(summary.hostel.is_cleared).toBe(true);

    expect(summary.transport.route_name).toBe('ROUTE-4-GANDHINAGAR');
    expect(summary.transport.vehicle_number).toBe('GJ-01-EE-4091');
    expect(summary.transport.fee_due).toBe(0);
    expect(summary.transport.is_cleared).toBe(true);

    expect(summary.overall_facility_clearance_passed).toBe(true);
  });

  it('TEST 4: Phase 40.7 Final Gate Execution: Confirms green status across all 73 Library / Hostel / Transport criteria', () => {
    const gateReport = centralCampusServicesIntegrationValidationService.runFullCampusServicesGate();

    expect(gateReport.libraryModulePassed).toBe(true);
    expect(gateReport.hostelModulePassed).toBe(true);
    expect(gateReport.transportModulePassed).toBe(true);
    expect(gateReport.capacityAndConflictGuardsPassed).toBe(true);
    expect(gateReport.facilityDuesAndFinanceReconciled).toBe(true);
    expect(gateReport.graduationFacilityClearancePassed).toBe(true);
    expect(gateReport.student360IntegrationPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
