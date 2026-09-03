import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface HostelBedRecord {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'MAINTENANCE' | 'BLOCKED';
}

export interface HostelRoomRecord {
  id: string;
  roomNumber: string;
  floorNumber: number;
  blockName: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR';
  capacity: number;
  beds: HostelBedRecord[];
}

export interface HostelMasterRecord {
  id: string;
  hostelCode: string;
  name: string;
  campusName: string;
  hostelType: 'BOYS' | 'GIRLS' | 'MIXED';
  wardenName: string;
  rooms: HostelRoomRecord[];
}

export interface HostelAllocationRecord {
  id: string;
  allocationNumber: string;
  studentId: string;
  hostelId: string;
  roomId: string;
  bedId: string;
  academicYearId: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'VACATED';
}

export interface HostelOutpassRecord {
  id: string;
  outpassNumber: string;
  studentId: string;
  destination: string;
  fromDate: string;
  toDate: string;
  actualReturnDate?: string;
  isLateReturn: boolean;
  status: 'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'REJECTED';
}

export interface HostelClearanceRecord {
  studentId: string;
  hasActiveAllocation: boolean;
  pendingFeeDues: number;
  pendingDamageCharges: number;
  clearanceStatus: 'CLEARED' | 'BLOCKED';
}

class HostelResidentialGovernanceService {
  private static instance: HostelResidentialGovernanceService;

  private hostels: HostelMasterRecord[] = [
    {
      id: 'host-boys-1',
      hostelCode: 'HST-B1',
      name: 'Swarrnim Boys Hostel - Block A',
      campusName: 'SSIU Main Campus',
      hostelType: 'BOYS',
      wardenName: 'Mr. Ramesh Joshi',
      rooms: [
        {
          id: 'rm-101',
          roomNumber: 'A-101',
          floorNumber: 1,
          blockName: 'Block A',
          roomType: 'DOUBLE',
          capacity: 2,
          beds: [
            { id: 'bed-101-1', roomId: 'rm-101', bedNumber: 'A-101-01', status: 'ALLOCATED' },
            { id: 'bed-101-2', roomId: 'rm-101', bedNumber: 'A-101-02', status: 'AVAILABLE' }
          ]
        },
        {
          id: 'rm-102',
          roomNumber: 'A-102',
          floorNumber: 1,
          blockName: 'Block A',
          roomType: 'DOUBLE',
          capacity: 2,
          beds: [
            { id: 'bed-102-1', roomId: 'rm-102', bedNumber: 'A-102-01', status: 'AVAILABLE' },
            { id: 'bed-102-2', roomId: 'rm-102', bedNumber: 'A-102-02', status: 'AVAILABLE' }
          ]
        }
      ]
    }
  ];

  private allocations: HostelAllocationRecord[] = [
    {
      id: 'alloc-01',
      allocationNumber: 'HST-ALC-2026-000412',
      studentId: 'stud-001',
      hostelId: 'host-boys-1',
      roomId: 'rm-101',
      bedId: 'bed-101-1',
      academicYearId: 'ay-2026-27',
      startDate: '2026-07-20',
      status: 'ACTIVE'
    }
  ];

  private outpasses: HostelOutpassRecord[] = [
    {
      id: 'out-01',
      outpassNumber: 'OP-2026-0091',
      studentId: 'stud-001',
      destination: 'Ahmedabad (Home Visit)',
      fromDate: '2026-08-20T17:00:00Z',
      toDate: '2026-08-22T20:00:00Z',
      actualReturnDate: '2026-08-22T19:30:00Z',
      isLateReturn: false,
      status: 'RETURNED'
    }
  ];

  private constructor() {}

  public static getInstance(): HostelResidentialGovernanceService {
    if (!HostelResidentialGovernanceService.instance) {
      HostelResidentialGovernanceService.instance = new HostelResidentialGovernanceService();
    }
    return HostelResidentialGovernanceService.instance;
  }

  // ─── DERIVED OCCUPANCY & CAPACITY ANALYTICS ────────────────────────────

  public getHostelOccupancyMetrics(hostelId: string): {
    totalCapacity: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancyRatePercentage: number;
  } {
    const hostel = this.hostels.find(h => h.id === hostelId);
    if (!hostel) throw new Error(`Hostel ${hostelId} not found`);

    let totalCapacity = 0;
    let occupiedBeds = 0;

    hostel.rooms.forEach(room => {
      totalCapacity += room.beds.length;
      occupiedBeds += room.beds.filter(b => b.status === 'ALLOCATED').length;
    });

    const vacantBeds = totalCapacity - occupiedBeds;
    const occupancyRatePercentage = totalCapacity > 0 ? (occupiedBeds / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      occupiedBeds,
      vacantBeds,
      occupancyRatePercentage
    };
  }

  // ─── ALLOCATION & BED MANAGEMENT ───────────────────────────────────────

  public allocateBedToStudent(params: {
    studentId: string;
    hostelId: string;
    roomId: string;
    bedId: string;
    academicYearId: string;
  }): HostelAllocationRecord {
    // Check if student already has active allocation
    const existingAlloc = this.allocations.find(a => a.studentId === params.studentId && a.status === 'ACTIVE');
    if (existingAlloc) {
      throw new Error(`Student ${params.studentId} already has an active bed allocation (${existingAlloc.allocationNumber})`);
    }

    const hostel = this.hostels.find(h => h.id === params.hostelId);
    if (!hostel) throw new Error(`Hostel ${params.hostelId} not found`);

    const room = hostel.rooms.find(r => r.id === params.roomId);
    if (!room) throw new Error(`Room ${params.roomId} not found`);

    const bed = room.beds.find(b => b.id === params.bedId);
    if (!bed) throw new Error(`Bed ${params.bedId} not found`);

    if (bed.status !== 'AVAILABLE') {
      throw new Error(`Bed ${bed.bedNumber} cannot be allocated because status is ${bed.status}`);
    }

    bed.status = 'ALLOCATED';

    const newAlloc: HostelAllocationRecord = {
      id: `alloc-${Date.now()}`,
      allocationNumber: `HST-ALC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: params.studentId,
      hostelId: params.hostelId,
      roomId: params.roomId,
      bedId: params.bedId,
      academicYearId: params.academicYearId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    this.allocations.push(newAlloc);
    return newAlloc;
  }

  // ─── OUTPASS & VISITOR GOVERNANCE ─────────────────────────────────────

  public issueOutpass(params: {
    studentId: string;
    destination: string;
    fromDate: string;
    toDate: string;
  }): HostelOutpassRecord {
    const newOutpass: HostelOutpassRecord = {
      id: `out-${Date.now()}`,
      outpassNumber: `OP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      studentId: params.studentId,
      destination: params.destination,
      fromDate: params.fromDate,
      toDate: params.toDate,
      isLateReturn: false,
      status: 'APPROVED'
    };

    this.outpasses.push(newOutpass);
    return newOutpass;
  }

  // ─── RESIDENTIAL CLEARANCE ────────────────────────────────────────────

  public getHostelClearance(studentId: string): HostelClearanceRecord {
    const activeAlloc = this.allocations.find(a => a.studentId === studentId && a.status === 'ACTIVE');
    const isBlocked = !!activeAlloc;

    return {
      studentId,
      hasActiveAllocation: !!activeAlloc,
      pendingFeeDues: 0,
      pendingDamageCharges: 0,
      clearanceStatus: isBlocked ? 'BLOCKED' : 'CLEARED'
    };
  }
}

export const hostelResidentialGovernanceService = HostelResidentialGovernanceService.getInstance();
