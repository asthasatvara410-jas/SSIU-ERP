import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface RouteStopRecord {
  id: string;
  routeId: string;
  stopName: string;
  sequence: number;
  estimatedArrival: string;
  estimatedDeparture: string;
}

export interface TransportRouteRecord {
  id: string;
  routeCode: string;
  routeName: string;
  campusName: string;
  startPoint: string;
  endPoint: string;
  distanceKm: number;
  stops: RouteStopRecord[];
}

export interface VehicleMasterRecord {
  id: string;
  registrationNumber: string;
  vehicleNumber: string;
  vehicleType: 'BUS' | 'VAN' | 'CAR';
  capacity: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'BREAKDOWN';
  insuranceExpiry: string;
  fitnessExpiry: string;
}

export interface StudentTransportAllocationRecord {
  id: string;
  studentId: string;
  routeId: string;
  stopId: string;
  vehicleId: string;
  passNumber: string;
  academicYearId: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface TransportTripRecord {
  id: string;
  tripNumber: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  tripType: 'PICKUP' | 'DROP';
  tripDate: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'STARTED' | 'COMPLETED' | 'DELAYED';
  boardedStudentCount: number;
}

export interface TransportClearanceRecord {
  studentId: string;
  hasActiveAllocation: boolean;
  pendingFeeDues: number;
  clearanceStatus: 'CLEARED' | 'BLOCKED';
}

class TransportVehicleGovernanceService {
  private static instance: TransportVehicleGovernanceService;

  private routes: TransportRouteRecord[] = [
    {
      id: 'rt-01',
      routeCode: 'R-01',
      routeName: 'Ahmedabad East Express (Maninagar - Gandhinagar Campus)',
      campusName: 'SSIU Main Campus',
      startPoint: 'Maninagar Char Rasta',
      endPoint: 'SSIU Gandhinagar Campus',
      distanceKm: 34.5,
      stops: [
        { id: 'stp-01', routeId: 'rt-01', stopName: 'Maninagar Station', sequence: 1, estimatedArrival: '07:15', estimatedDeparture: '07:20' },
        { id: 'stp-02', routeId: 'rt-01', stopName: 'Geeta Mandir', sequence: 2, estimatedArrival: '07:30', estimatedDeparture: '07:35' },
        { id: 'stp-03', routeId: 'rt-01', stopName: 'Income Tax', sequence: 3, estimatedArrival: '07:50', estimatedDeparture: '07:55' },
        { id: 'stp-04', routeId: 'rt-01', stopName: 'SSIU Campus Gate', sequence: 4, estimatedArrival: '08:30', estimatedDeparture: '08:35' }
      ]
    }
  ];

  private vehicles: VehicleMasterRecord[] = [
    {
      id: 'veh-01',
      registrationNumber: 'GJ-01-ER-8801',
      vehicleNumber: 'BUS-01',
      vehicleType: 'BUS',
      capacity: 50,
      status: 'AVAILABLE',
      insuranceExpiry: '2027-06-30',
      fitnessExpiry: '2027-04-15'
    }
  ];

  private allocations: StudentTransportAllocationRecord[] = [
    {
      id: 'alloc-01',
      studentId: 'stud-001',
      routeId: 'rt-01',
      stopId: 'stp-01',
      vehicleId: 'veh-01',
      passNumber: 'TP-PASS-2026-000412',
      academicYearId: 'ay-2026-27',
      status: 'ACTIVE'
    }
  ];

  private trips: TransportTripRecord[] = [
    {
      id: 'trip-01',
      tripNumber: 'TRIP-2026-0828-01',
      routeId: 'rt-01',
      vehicleId: 'veh-01',
      driverId: 'drv-01',
      tripType: 'PICKUP',
      tripDate: '2026-08-28',
      scheduledTime: '07:15',
      status: 'COMPLETED',
      boardedStudentCount: 42
    }
  ];

  private constructor() {}

  public static getInstance(): TransportVehicleGovernanceService {
    if (!TransportVehicleGovernanceService.instance) {
      TransportVehicleGovernanceService.instance = new TransportVehicleGovernanceService();
    }
    return TransportVehicleGovernanceService.instance;
  }

  // ─── DYNAMIC CAPACITY & SEAT DERIVATION ────────────────────────────────

  public getRouteCapacityMetrics(routeId: string, vehicleId: string): {
    totalVehicleCapacity: number;
    activeAllocationsCount: number;
    availableSeatsCount: number;
  } {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) throw new Error(`Vehicle ${vehicleId} not found`);

    const activeAllocations = this.allocations.filter(a => a.routeId === routeId && a.vehicleId === vehicleId && a.status === 'ACTIVE');
    const availableSeatsCount = vehicle.capacity - activeAllocations.length;

    return {
      totalVehicleCapacity: vehicle.capacity,
      activeAllocationsCount: activeAllocations.length,
      availableSeatsCount
    };
  }

  // ─── STUDENT TRANSPORT ALLOCATION ENGINE ──────────────────────────────

  public allocateTransportRoute(params: {
    studentId: string;
    routeId: string;
    stopId: string;
    vehicleId: string;
    academicYearId: string;
  }): StudentTransportAllocationRecord {
    // Check if student already has active allocation
    const existing = this.allocations.find(a => a.studentId === params.studentId && a.status === 'ACTIVE');
    if (existing) {
      throw new Error(`Student ${params.studentId} already has an active transport pass (${existing.passNumber})`);
    }

    const { availableSeatsCount } = this.getRouteCapacityMetrics(params.routeId, params.vehicleId);
    if (availableSeatsCount <= 0) {
      throw new Error(`Cannot allocate transport: Vehicle is at full capacity (0 seats available)`);
    }

    const newAlloc: StudentTransportAllocationRecord = {
      id: `alloc-${Date.now()}`,
      studentId: params.studentId,
      routeId: params.routeId,
      stopId: params.stopId,
      vehicleId: params.vehicleId,
      passNumber: `TP-PASS-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      academicYearId: params.academicYearId,
      status: 'ACTIVE'
    };

    this.allocations.push(newAlloc);
    return newAlloc;
  }

  // ─── TRANSPORT CLEARANCE ENGINE ───────────────────────────────────────

  public getTransportClearance(studentId: string): TransportClearanceRecord {
    const activeAlloc = this.allocations.find(a => a.studentId === studentId && a.status === 'ACTIVE');
    const isBlocked = !!activeAlloc;

    return {
      studentId,
      hasActiveAllocation: !!activeAlloc,
      pendingFeeDues: 0,
      clearanceStatus: isBlocked ? 'BLOCKED' : 'CLEARED'
    };
  }
}

export const transportVehicleGovernanceService = TransportVehicleGovernanceService.getInstance();
