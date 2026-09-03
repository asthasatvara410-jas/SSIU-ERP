import { describe, it, expect } from 'vitest';
import { transportVehicleGovernanceService } from '../services/transportVehicleGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 31: Transport & Vehicle Management System Engine', () => {

  it('TEST 1: Dynamic Route Seat Capacity: Computes capacity, active allocations, and vacant seats dynamically', () => {
    const metrics = transportVehicleGovernanceService.getRouteCapacityMetrics('rt-01', 'veh-01');
    expect(metrics.totalVehicleCapacity).toBe(50);
    expect(metrics.activeAllocationsCount).toBe(1);
    expect(metrics.availableSeatsCount).toBe(49);
  });

  it('TEST 2: Transport Pass Allocation: Enforces single active transport pass per student', () => {
    // Attempt allocating another pass to stud-001 who already has one
    expect(() => {
      transportVehicleGovernanceService.allocateTransportRoute({
        studentId: 'stud-001',
        routeId: 'rt-01',
        stopId: 'stp-02',
        vehicleId: 'veh-01',
        academicYearId: 'ay-2026-27'
      });
    }).toThrow(/already has an active transport pass/);

    // Valid allocation for stud-002
    const alloc = transportVehicleGovernanceService.allocateTransportRoute({
      studentId: 'stud-002',
      routeId: 'rt-01',
      stopId: 'stp-03',
      vehicleId: 'veh-01',
      academicYearId: 'ay-2026-27'
    });

    expect(alloc.status).toBe('ACTIVE');
    expect(alloc.studentId).toBe('stud-002');
    expect(alloc.passNumber).toContain('TP-PASS-2026-');
  });

  it('TEST 3: Dynamic Capacity Update: Available seats decrement after successful allocation', () => {
    const metrics = transportVehicleGovernanceService.getRouteCapacityMetrics('rt-01', 'veh-01');
    expect(metrics.activeAllocationsCount).toBe(2); // stud-001 + stud-002
    expect(metrics.availableSeatsCount).toBe(48); // 50 - 2
  });

  it('TEST 4: Transport Clearance Engine: Blocks graduation clearance while student holds active pass', () => {
    const clearance = transportVehicleGovernanceService.getTransportClearance('stud-001');
    expect(clearance.clearanceStatus).toBe('BLOCKED');
    expect(clearance.hasActiveAllocation).toBe(true);
  });
});
