import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface HostelBedRecord {
  id: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  blockName: string;
  hostelName: string;
  status: 'AVAILABLE' | 'ALLOCATED' | 'BLOCKED' | 'MAINTENANCE';
}

export interface StudentHostelAllocationRecord {
  id: string;
  studentId: string;
  enrollmentNumber: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  academicYear: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'VACATED' | 'CANCELLED';
}

export interface StudentOutpassRecord {
  id: string;
  studentId: string;
  enrollmentNumber: string;
  hostelName: string;
  roomNumber: string;
  reason: string;
  destination: string;
  departureTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: 'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
}

class HostelResidentialGovernanceLifecycleService {
  private static instance: HostelResidentialGovernanceLifecycleService;

  private beds: HostelBedRecord[] = [
    { id: 'bed-101-a', bedNumber: '101-A', roomId: 'rm-101', roomNumber: '101', blockName: 'Block A', hostelName: 'Swarrnim Boys Hostel 1', status: 'AVAILABLE' },
    { id: 'bed-101-b', bedNumber: '101-B', roomId: 'rm-101', roomNumber: '101', blockName: 'Block A', hostelName: 'Swarrnim Boys Hostel 1', status: 'AVAILABLE' },
    { id: 'bed-102-a', bedNumber: '102-A', roomId: 'rm-102', roomNumber: '102', blockName: 'Block A', hostelName: 'Swarrnim Boys Hostel 1', status: 'AVAILABLE' }
  ];

  private allocations: StudentHostelAllocationRecord[] = [];
  private outpasses: StudentOutpassRecord[] = [];

  private constructor() {}

  public static getInstance(): HostelResidentialGovernanceLifecycleService {
    if (!HostelResidentialGovernanceLifecycleService.instance) {
      HostelResidentialGovernanceLifecycleService.instance = new HostelResidentialGovernanceLifecycleService();
    }
    return HostelResidentialGovernanceLifecycleService.instance;
  }

  // ─── DYNAMIC OCCUPANCY & CAPACITY CALCULATION ENGINE ──────────────────

  public getHostelOccupancy(hostelName: string): {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    occupancyPercentage: number;
  } {
    const hostelBeds = this.beds.filter(b => b.hostelName === hostelName);
    const totalBeds = hostelBeds.length;
    const occupiedBeds = hostelBeds.filter(b => b.status === 'ALLOCATED').length;
    const maintenanceBeds = hostelBeds.filter(b => b.status === 'MAINTENANCE').length;
    const availableBeds = hostelBeds.filter(b => b.status === 'AVAILABLE').length;

    const occupancyPercentage = totalBeds > 0
      ? Math.round((occupiedBeds / totalBeds) * 100)
      : 0;

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyPercentage
    };
  }

  // ─── ATOMIC ROOM / BED ALLOCATION ENGINE ──────────────────────────────

  public allocateBedToStudent(params: {
    studentId: string;
    enrollmentNumber: string;
    bedId: string;
    academicYear: string;
  }): StudentHostelAllocationRecord {
    // Check if student already has an active allocation
    const existing = this.allocations.find(a => a.studentId === params.studentId && a.status === 'ACTIVE');
    if (existing) {
      throw new Error(`Student ${params.enrollmentNumber} already has an active hostel allocation in Room ${existing.roomNumber} Bed ${existing.bedNumber}`);
    }

    const bed = this.beds.find(b => b.id === params.bedId);
    if (!bed) throw new Error(`Bed ${params.bedId} not found`);

    if (bed.status !== 'AVAILABLE') {
      throw new Error(`Bed ${bed.bedNumber} is not available (Current status: ${bed.status})`);
    }

    bed.status = 'ALLOCATED';

    const allocation: StudentHostelAllocationRecord = {
      id: `alloc-${Date.now()}`,
      studentId: params.studentId,
      enrollmentNumber: params.enrollmentNumber,
      hostelName: bed.hostelName,
      roomNumber: bed.roomNumber,
      bedNumber: bed.bedNumber,
      academicYear: params.academicYear,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    this.allocations.push(allocation);
    return allocation;
  }

  // ─── ATOMIC ROOM / BED TRANSFER WORKFLOW ──────────────────────────────

  public transferStudentBed(params: {
    studentId: string;
    targetBedId: string;
  }): { previousAllocation: StudentHostelAllocationRecord; newAllocation: StudentHostelAllocationRecord } {
    const currentAlloc = this.allocations.find(a => a.studentId === params.studentId && a.status === 'ACTIVE');
    if (!currentAlloc) throw new Error(`Active hostel allocation not found for student ${params.studentId}`);

    const targetBed = this.beds.find(b => b.id === params.targetBedId);
    if (!targetBed) throw new Error(`Target bed ${params.targetBedId} not found`);
    if (targetBed.status !== 'AVAILABLE') {
      throw new Error(`Target bed ${targetBed.bedNumber} is not available`);
    }

    // Release old bed
    const oldBed = this.beds.find(b => b.bedNumber === currentAlloc.bedNumber && b.hostelName === currentAlloc.hostelName);
    if (oldBed) {
      oldBed.status = 'AVAILABLE';
    }

    currentAlloc.status = 'TRANSFERRED';
    currentAlloc.endDate = new Date().toISOString().split('T')[0];

    // Allocate new bed
    targetBed.status = 'ALLOCATED';
    const newAlloc: StudentHostelAllocationRecord = {
      id: `alloc-${Date.now()}`,
      studentId: params.studentId,
      enrollmentNumber: currentAlloc.enrollmentNumber,
      hostelName: targetBed.hostelName,
      roomNumber: targetBed.roomNumber,
      bedNumber: targetBed.bedNumber,
      academicYear: currentAlloc.academicYear,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    this.allocations.push(newAlloc);
    return { previousAllocation: currentAlloc, newAllocation: newAlloc };
  }

  // ─── OUTPASS & OVERDUE MANAGEMENT ─────────────────────────────────────

  public createAndApproveOutpass(params: {
    studentId: string;
    reason: string;
    destination: string;
    departureTime: string;
    expectedReturnTime: string;
  }): StudentOutpassRecord {
    const alloc = this.allocations.find(a => a.studentId === params.studentId && a.status === 'ACTIVE');
    if (!alloc) throw new Error(`Cannot issue outpass: Student ${params.studentId} does not have an active hostel allocation`);

    const outpass: StudentOutpassRecord = {
      id: `outp-${Date.now()}`,
      studentId: params.studentId,
      enrollmentNumber: alloc.enrollmentNumber,
      hostelName: alloc.hostelName,
      roomNumber: alloc.roomNumber,
      reason: params.reason,
      destination: params.destination,
      departureTime: params.departureTime,
      expectedReturnTime: params.expectedReturnTime,
      status: 'ACTIVE'
    };

    this.outpasses.push(outpass);
    return outpass;
  }
}

export const hostelResidentialGovernanceLifecycleService = HostelResidentialGovernanceLifecycleService.getInstance();
