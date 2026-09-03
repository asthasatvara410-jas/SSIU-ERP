import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVisitorRequestDto,
  UpdateVisitorDto,
  ApproveVisitorDto,
  RejectVisitorDto,
  CheckInVisitorDto,
  CheckOutVisitorDto,
  VisitorQueryDto,
  VisitorStatusEnum,
} from './dto/visitor.dto';
import {
  CreateMaintenanceRequestDto,
  AssignMaintenanceDto,
  HoldMaintenanceDto,
  ResolveMaintenanceDto,
  ConfirmResolutionDto,
  ReopenMaintenanceDto,
  MaintenanceQueryDto,
  MaintenancePriorityEnum,
  MaintenanceStatusEnum,
} from './dto/maintenance.dto';

@Injectable()
export class HostelService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── Hostel Master ─────────────────────────────────────────────────────────

  async createHostel(data: {
    code: string;
    name: string;
    hostelType?: string;
    gender?: string;
    building?: string;
    address?: string;
    capacity?: number;
    location?: string;
    wardenName?: string;
    wardenPhone?: string;
    wardenEmail?: string;
    status?: string;
  }) {
    const existing = await this.prisma.hostel.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Hostel with code '${data.code}' already exists.`);
    }

    return this.prisma.hostel.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        hostelType: data.hostelType || 'STANDARD',
        gender: data.gender || 'BOYS',
        building: data.building,
        address: data.address,
        capacity: data.capacity || 100,
        location: data.location,
        wardenName: data.wardenName,
        wardenPhone: data.wardenPhone,
        wardenEmail: data.wardenEmail,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async getHostels() {
    let hostels = await this.prisma.hostel.findMany({
      include: {
        rooms: {
          include: { beds: true },
        },
        _count: { select: { rooms: true, allotments: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    });

    if (hostels.length === 0) {
      const defaultHostels = [
        { code: 'BH-1', name: 'Vivekananda Boys Hostel (Block A)', building: 'Block A', gender: 'BOYS', capacity: 150, wardenName: 'Dr. Suresh Patel', wardenPhone: '+91 9876500001', status: 'ACTIVE' },
        { code: 'GH-1', name: 'Gargi Girls Hostel (Block B)', building: 'Block B', gender: 'GIRLS', capacity: 120, wardenName: 'Dr. Meena Shah', wardenPhone: '+91 9876500002', status: 'ACTIVE' },
        { code: 'IH-1', name: 'Sarabhai International Hostel', building: 'Block C', gender: 'CO_ED', capacity: 80, wardenName: 'Prof. Rajesh Sharma', wardenPhone: '+91 9876500003', status: 'ACTIVE' },
      ];
      for (const h of defaultHostels) {
        const created = await this.prisma.hostel.create({ data: h });
        for (let r = 101; r <= 105; r++) {
          const room = await this.prisma.hostelRoom.create({
            data: {
              hostelId: created.id,
              block: h.building,
              roomNumber: String(r),
              floor: 1,
              capacity: 2,
              roomType: 'DOUBLE',
              facilities: 'Attached Washroom, Study Table, AC, Balcony',
              status: 'AVAILABLE',
            },
          });
          await this.prisma.hostelBed.createMany({
            data: [
              { roomId: room.id, bedNumber: `${r}-A`, status: 'AVAILABLE' },
              { roomId: room.id, bedNumber: `${r}-B`, status: 'AVAILABLE' },
            ],
          });
        }
      }
      hostels = await this.prisma.hostel.findMany({
        include: {
          rooms: {
            include: { beds: true },
          },
          _count: { select: { rooms: true, allotments: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { name: 'asc' },
      });
    }

    return hostels;
  }

  async updateHostel(id: string, data: Partial<{
    name: string;
    hostelType: string;
    gender: string;
    building: string;
    address: string;
    capacity: number;
    location: string;
    wardenName: string;
    wardenPhone: string;
    wardenEmail: string;
    status: string;
  }>) {
    const hostel = await this.prisma.hostel.findUnique({ where: { id } });
    if (!hostel) throw new NotFoundException('Hostel not found.');

    return this.prisma.hostel.update({
      where: { id },
      data,
    });
  }

  // ── Hostel Room Management ────────────────────────────────────────────────

  async createRoom(data: {
    hostelId: string;
    block?: string;
    roomNumber: string;
    floor?: number;
    capacity?: number;
    roomType?: string;
    facilities?: string;
    status?: string;
  }) {
    const hostel = await this.prisma.hostel.findUnique({ where: { id: data.hostelId } });
    if (!hostel) throw new NotFoundException('Hostel not found.');

    const existingRoom = await this.prisma.hostelRoom.findUnique({
      where: { hostelId_roomNumber: { hostelId: data.hostelId, roomNumber: data.roomNumber } },
    });
    if (existingRoom) {
      throw new ConflictException(`Room '${data.roomNumber}' already exists in this hostel.`);
    }

    const capacity = data.capacity || 2;
    const room = await this.prisma.hostelRoom.create({
      data: {
        hostelId: data.hostelId,
        block: data.block || hostel.building || 'Block A',
        roomNumber: data.roomNumber,
        floor: data.floor || 1,
        capacity,
        occupiedBeds: 0,
        roomType: data.roomType || 'DOUBLE',
        facilities: data.facilities || 'Attached Bath, Study Table, Fan',
        status: data.status || 'AVAILABLE',
      },
    });

    for (let b = 1; b <= capacity; b++) {
      await this.prisma.hostelBed.create({
        data: {
          roomId: room.id,
          bedNumber: `${data.roomNumber}-${String.fromCharCode(64 + b)}`,
          status: 'AVAILABLE',
        },
      });
    }

    return room;
  }

  async getRooms(hostelId?: string) {
    return this.prisma.hostelRoom.findMany({
      where: { ...(hostelId ? { hostelId } : {}) },
      include: {
        hostel: true,
        beds: true,
        allotments: {
          where: { status: 'ACTIVE' },
          include: { student: true },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async getRoomsByHostel(hostelId: string) {
    return this.getRooms(hostelId);
  }

  async updateRoom(id: string, data: Partial<{
    block: string;
    floor: number;
    capacity: number;
    roomType: string;
    facilities: string;
    status: string;
  }>) {
    const room = await this.prisma.hostelRoom.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Hostel room not found.');

    return this.prisma.hostelRoom.update({
      where: { id },
      data,
    });
  }

  // ── Student Hostel Allocation ───────────────────────────────────────────────

  async allotBed(data: {
    studentId: string;
    hostelId: string;
    roomId: string;
    bedId?: string;
    bedNumber?: string;
    academicYear?: string;
    expectedCheckout?: string;
    remarks?: string;
  }) {
    // 1. Verify student exists
    const student = await this.prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) throw new NotFoundException(`Student with ID '${data.studentId}' not found.`);

    // 2. Prevent duplicate active hostel allocation
    const activeAllotment = await this.prisma.hostelAllotment.findFirst({
      where: { studentId: data.studentId, status: 'ACTIVE' },
      include: { hostel: true, room: true },
    });
    if (activeAllotment) {
      throw new ConflictException(
        `Student already has an active allocation in Hostel ${activeAllotment.hostel?.name}, Room ${activeAllotment.room?.roomNumber}.`,
      );
    }

    // 3. Find room and verify capacity
    const room = await this.prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
      include: { beds: true, allotments: { where: { status: 'ACTIVE' } } },
    });
    if (!room) throw new NotFoundException('Hostel room not found.');

    if (room.allotments.length >= room.capacity) {
      throw new BadRequestException(`Room '${room.roomNumber}' has reached maximum capacity of ${room.capacity} beds.`);
    }

    // 4. Resolve or create bed
    let bed = data.bedId ? await this.prisma.hostelBed.findUnique({ where: { id: data.bedId } }) : null;
    if (!bed) {
      bed = room.beds.find((b) => b.status === 'AVAILABLE') || null;
    }
    if (!bed) {
      const nextBedLetter = String.fromCharCode(65 + room.beds.length);
      bed = await this.prisma.hostelBed.create({
        data: {
          roomId: room.id,
          bedNumber: `${room.roomNumber}-${nextBedLetter}`,
          status: 'AVAILABLE',
        },
      });
    }

    if (bed.status !== 'AVAILABLE') {
      throw new BadRequestException(`Bed '${bed.bedNumber}' is currently occupied or under maintenance.`);
    }

    const allotmentNo = this.generateNumber('HST-ALL');

    return this.prisma.$transaction(async (tx) => {
      const allotment = await tx.hostelAllotment.create({
        data: {
          allotmentNo,
          studentId: data.studentId,
          hostelId: data.hostelId,
          roomId: data.roomId,
          bedId: bed!.id,
          academicYear: data.academicYear || '2026-27',
          checkInDate: new Date(),
          expectedCheckout: data.expectedCheckout ? new Date(data.expectedCheckout) : undefined,
          status: 'ACTIVE',
          remarks: data.remarks,
        },
        include: { student: true, hostel: true, room: true, bed: true },
      });

      await tx.hostelBed.update({
        where: { id: bed!.id },
        data: { status: 'OCCUPIED' },
      });

      const newOccupied = room.allotments.length + 1;
      await tx.hostelRoom.update({
        where: { id: room.id },
        data: {
          occupiedBeds: newOccupied,
          status: newOccupied >= room.capacity ? 'FULL' : 'AVAILABLE',
        },
      });

      return allotment;
    });
  }

  async getAllotments(studentId?: string, hostelId?: string) {
    return this.prisma.hostelAllotment.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(hostelId ? { hostelId } : {}),
      },
      include: {
        student: {
          include: { department: true, batch: { include: { program: true } }, institute: true },
        },
        hostel: true,
        room: true,
        bed: true,
      },
      orderBy: { allottedDate: 'desc' },
    });
  }

  async updateAllotment(id: string, data: Partial<{ status: string; remarks: string; vacatedDate: string }>) {
    const allotment = await this.prisma.hostelAllotment.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!allotment) throw new NotFoundException('Hostel allotment not found.');

    if (data.status === 'VACATED' || data.status === 'CANCELLED') {
      return this.prisma.$transaction(async (tx) => {
        await tx.hostelBed.update({
          where: { id: allotment.bedId },
          data: { status: 'AVAILABLE' },
        });

        const activeCount = await tx.hostelAllotment.count({
          where: { roomId: allotment.roomId, status: 'ACTIVE', id: { not: id } },
        });

        await tx.hostelRoom.update({
          where: { id: allotment.roomId },
          data: {
            occupiedBeds: activeCount,
            status: activeCount >= allotment.room.capacity ? 'FULL' : 'AVAILABLE',
          },
        });

        return tx.hostelAllotment.update({
          where: { id },
          data: {
            status: data.status,
            vacatedDate: data.vacatedDate ? new Date(data.vacatedDate) : new Date(),
            remarks: data.remarks || allotment.remarks,
          },
          include: { student: true, hostel: true, room: true, bed: true },
        });
      });
    }

    return this.prisma.hostelAllotment.update({
      where: { id },
      data: {
        status: data.status || allotment.status,
        remarks: data.remarks !== undefined ? data.remarks : allotment.remarks,
      },
      include: { student: true, hostel: true, room: true, bed: true },
    });
  }

  async transferBed(allotmentId: string, toBedId: string, reason: string, approvedBy?: string) {
    const allotment = await this.prisma.hostelAllotment.findUnique({
      where: { id: allotmentId },
      include: { room: true },
    });
    if (!allotment) throw new NotFoundException('Allotment not found.');

    const targetBed = await this.prisma.hostelBed.findUnique({
      where: { id: toBedId },
      include: { room: true },
    });
    if (!targetBed || targetBed.status !== 'AVAILABLE') {
      throw new BadRequestException('Target bed is not available.');
    }

    const transferNo = this.generateNumber('TRF-HST');

    return this.prisma.$transaction(async (tx) => {
      await tx.hostelBed.update({ where: { id: allotment.bedId }, data: { status: 'AVAILABLE' } });
      await tx.hostelBed.update({ where: { id: toBedId }, data: { status: 'OCCUPIED' } });

      await tx.hostelTransfer.create({
        data: {
          transferNo,
          allotmentId,
          fromBedId: allotment.bedId,
          toBedId,
          reason,
          approvedBy,
          status: 'COMPLETED',
        },
      });

      return tx.hostelAllotment.update({
        where: { id: allotmentId },
        data: {
          bedId: toBedId,
          roomId: targetBed.roomId,
          hostelId: targetBed.room.hostelId,
          status: 'TRANSFERRED',
        },
        include: { room: true, bed: true, student: true, hostel: true },
      });
    });
  }

  async vacateBed(allotmentId: string, remarks?: string) {
    return this.updateAllotment(allotmentId, { status: 'VACATED', remarks });
  }

  // ── Hostel Applications & Outpass ──────────────────────────────────────────

  async submitApplication(data: {
    studentId: string;
    academicYear?: string;
    programId?: string;
    preferredHostelId?: string;
    roomPreference?: string;
    reason?: string;
  }) {
    const applicationNo = this.generateNumber('HST-APP');
    return this.prisma.hostelApplication.create({
      data: {
        applicationNo,
        studentId: data.studentId,
        academicYear: data.academicYear || '2026-27',
        programId: data.programId,
        preferredHostelId: data.preferredHostelId,
        roomPreference: data.roomPreference || 'NON_AC',
        reason: data.reason,
        status: 'SUBMITTED',
      },
      include: { student: true },
    });
  }

  async getApplications(studentId?: string, status?: string) {
    return this.prisma.hostelApplication.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(status ? { status } : {}),
      },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveApplication(id: string, reviewerId?: string) {
    const app = await this.prisma.hostelApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Hostel application not found.');

    return this.prisma.hostelApplication.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date() },
    });
  }

  async requestOutpass(data: {
    studentId: string;
    fromDate: string;
    toDate: string;
    purpose: string;
    destination: string;
    contactNumber: string;
    guardianContact?: string;
  }) {
    const outpassNo = this.generateNumber('OUT');
    const verificationCode = `VER-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.outpassRequest.create({
      data: {
        outpassNo,
        studentId: data.studentId,
        fromDate: new Date(data.fromDate),
        toDate: new Date(data.toDate),
        purpose: data.purpose,
        destination: data.destination,
        contactNumber: data.contactNumber,
        guardianContact: data.guardianContact,
        verificationCode,
        status: 'PENDING',
      },
      include: { student: true },
    });
  }

  async getOutpasses(studentId?: string, status?: string) {
    return this.prisma.outpassRequest.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(status ? { status } : {}),
      },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveOutpass(id: string, approvedBy?: string) {
    const outpass = await this.prisma.outpassRequest.findUnique({ where: { id } });
    if (!outpass) throw new NotFoundException('Outpass request not found.');

    return this.prisma.outpassRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
      include: { student: true },
    });
  }

  async batchCheckoutOutpasses(outpassIds: string[], staffId?: string) {
    if (!outpassIds || !outpassIds.length) {
      throw new BadRequestException('At least one outpass ID must be provided.');
    }
    const updated = await this.prisma.outpassRequest.updateMany({
      where: {
        id: { in: outpassIds },
        status: 'APPROVED',
      },
      data: {
        status: 'CHECKED_OUT',
      },
    });
    return {
      success: true,
      count: updated.count,
      message: `Successfully checked out ${updated.count} students.`,
    };
  }

  // ── Hostel Visitors ───────────────────────────────────────────────────────

  async registerVisitor(user: any, dto: CreateVisitorRequestDto) {
    const passNumber = this.generateNumber('VIS');
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException(`Student with ID '${dto.studentId}' not found.`);

    const hostel = await this.prisma.hostel.findUnique({ where: { id: dto.hostelId } });
    if (!hostel) throw new NotFoundException(`Hostel with ID '${dto.hostelId}' not found.`);

    const isGateStaff = user?.role === 'HOSTEL_ADMIN' || user?.role === 'SECURITY' || user?.role === 'SUPER_ADMIN';
    const initialStatus = isGateStaff ? 'CHECKED_IN' : 'REQUESTED';

    return this.prisma.$transaction(async (tx) => {
      const visitor = await tx.hostelVisitor.create({
        data: {
          passNumber,
          visitorName: dto.visitorName,
          studentId: dto.studentId,
          hostelId: dto.hostelId,
          roomId: dto.roomId,
          relation: dto.relation,
          purpose: dto.purpose,
          contactPhone: dto.contactPhone,
          visitorEmail: dto.visitorEmail,
          idProofType: dto.idProofType || 'AADHAAR',
          idProofNumber: dto.idProofNumber,
          idProofDocumentUrl: dto.idProofDocumentUrl,
          visitorPhotoUrl: dto.visitorPhotoUrl,
          vehicleNumber: dto.vehicleNumber,
          expectedCheckInDate: dto.expectedCheckInDate ? new Date(dto.expectedCheckInDate) : new Date(),
          expectedCheckOutDate: dto.expectedCheckOutDate ? new Date(dto.expectedCheckOutDate) : undefined,
          checkInTime: initialStatus === 'CHECKED_IN' ? new Date() : undefined,
          checkedInByUserId: initialStatus === 'CHECKED_IN' ? user?.id : undefined,
          status: initialStatus,
          remarks: dto.remarks,
        },
        include: { student: true, hostel: true, room: true },
      });

      await tx.hostelVisitorLog.create({
        data: {
          visitorId: visitor.id,
          action: initialStatus,
          performedByUserId: user?.id || 'system',
          toStatus: initialStatus,
          remarks: isGateStaff ? 'Gate Security direct Check-In' : 'Student visitor request submitted',
        },
      });

      return visitor;
    });
  }

  async getVisitors(user: any, query: VisitorQueryDto) {
    const where: any = {};

    if (user?.role === 'STUDENT') {
      where.studentId = user.studentId || user.id;
    } else if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.hostelId) where.hostelId = query.hostelId;
    if (query.roomId) where.roomId = query.roomId;
    if (query.status) where.status = query.status.toUpperCase();
    if (query.relation) where.relation = query.relation.toUpperCase();

    if (query.search) {
      where.OR = [
        { visitorName: { contains: query.search, mode: 'insensitive' } },
        { passNumber: { contains: query.search, mode: 'insensitive' } },
        { contactPhone: { contains: query.search, mode: 'insensitive' } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.hostelVisitor.findMany({
      where,
      include: { student: true, hostel: true, room: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVisitorById(id: string, user: any) {
    const visitor = await this.prisma.hostelVisitor.findUnique({
      where: { id },
      include: {
        student: true,
        hostel: true,
        room: true,
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    if (user?.role === 'STUDENT' && visitor.studentId !== (user.studentId || user.id)) {
      throw new ForbiddenException('You are not authorized to view this visitor pass.');
    }

    return visitor;
  }

  async updateVisitor(id: string, user: any, dto: UpdateVisitorDto) {
    const visitor = await this.prisma.hostelVisitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    if (user?.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot modify visitor entries after submission.');
    }

    return this.prisma.hostelVisitor.update({
      where: { id },
      data: dto as any,
      include: { student: true, hostel: true, room: true },
    });
  }

  async approveVisitor(id: string, user: any, dto?: ApproveVisitorDto) {
    const visitor = await this.prisma.hostelVisitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelVisitor.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedByUserId: user?.id,
          approvedAt: new Date(),
          remarks: dto?.remarks || visitor.remarks,
        },
        include: { student: true, hostel: true, room: true },
      });

      await tx.hostelVisitorLog.create({
        data: {
          visitorId: id,
          action: 'APPROVED',
          performedByUserId: user?.id || 'admin',
          fromStatus: visitor.status,
          toStatus: 'APPROVED',
          remarks: dto?.remarks || 'Visitor pre-approved by Warden',
        },
      });

      return updated;
    });
  }

  async rejectVisitor(id: string, user: any, dto: RejectVisitorDto) {
    const visitor = await this.prisma.hostelVisitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelVisitor.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedByUserId: user?.id,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason,
        },
        include: { student: true, hostel: true, room: true },
      });

      await tx.hostelVisitorLog.create({
        data: {
          visitorId: id,
          action: 'REJECTED',
          performedByUserId: user?.id || 'admin',
          fromStatus: visitor.status,
          toStatus: 'REJECTED',
          remarks: dto.rejectionReason,
        },
      });

      return updated;
    });
  }

  async checkInVisitor(id: string, user: any, dto?: CheckInVisitorDto) {
    const visitor = await this.prisma.hostelVisitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelVisitor.update({
        where: { id },
        data: {
          status: 'CHECKED_IN',
          checkInTime: new Date(),
          checkedInByUserId: user?.id,
          vehicleNumber: dto?.vehicleNumber || visitor.vehicleNumber,
          remarks: dto?.remarks || visitor.remarks,
        },
        include: { student: true, hostel: true, room: true },
      });

      await tx.hostelVisitorLog.create({
        data: {
          visitorId: id,
          action: 'CHECKED_IN',
          performedByUserId: user?.id || 'security',
          fromStatus: visitor.status,
          toStatus: 'CHECKED_IN',
          remarks: dto?.remarks || 'Visitor checked in at hostel security gate',
        },
      });

      return updated;
    });
  }

  async checkOutVisitor(id: string, user: any, dto?: CheckOutVisitorDto) {
    const visitor = await this.prisma.hostelVisitor.findUnique({ where: { id } });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelVisitor.update({
        where: { id },
        data: {
          status: 'CHECKED_OUT',
          checkOutTime: new Date(),
          checkedOutByUserId: user?.id,
          remarks: dto?.remarks || visitor.remarks,
        },
        include: { student: true, hostel: true, room: true },
      });

      await tx.hostelVisitorLog.create({
        data: {
          visitorId: id,
          action: 'CHECKED_OUT',
          performedByUserId: user?.id || 'security',
          fromStatus: visitor.status,
          toStatus: 'CHECKED_OUT',
          remarks: dto?.remarks || 'Visitor checked out and exited premises',
        },
      });

      return updated;
    });
  }

  async getVisitorHistory(id: string, user: any) {
    const visitor = await this.getVisitorById(id, user);
    return visitor.logs;
  }

  async getVisitorDashboardMetrics(user: any) {
    const totalEntries = await this.prisma.hostelVisitor.count();
    const currentlyInside = await this.prisma.hostelVisitor.count({ where: { status: 'CHECKED_IN' } });
    const pendingApproval = await this.prisma.hostelVisitor.count({ where: { status: 'REQUESTED' } });
    const approvedExpected = await this.prisma.hostelVisitor.count({ where: { status: 'APPROVED' } });

    return {
      totalEntries,
      currentlyInside,
      pendingApproval,
      approvedExpected,
    };
  }

  // ── Hostel Maintenance Request Workflow ────────────────────────────────────

  private calculateSla(priority: string): { slaHours: number; slaDueDate: Date } {
    const prio = (priority || 'MEDIUM').toUpperCase();
    let hours = 48;
    if (prio === 'URGENT') hours = 4;
    else if (prio === 'HIGH') hours = 24;
    else if (prio === 'MEDIUM') hours = 48;
    else if (prio === 'LOW') hours = 72;

    const dueDate = new Date(Date.now() + hours * 3600 * 1000);
    return { slaHours: hours, slaDueDate: dueDate };
  }

  async createMaintenanceRequest(user: any, dto: CreateMaintenanceRequestDto) {
    const studentId = dto.studentId || user?.studentId || user?.id;
    if (!studentId) {
      throw new BadRequestException('Student ID is required to create a maintenance request.');
    }

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException(`Student '${studentId}' not found.`);

    const hostel = await this.prisma.hostel.findUnique({ where: { id: dto.hostelId } });
    if (!hostel) throw new NotFoundException(`Hostel '${dto.hostelId}' not found.`);

    const requestNo = this.generateNumber('HOST-MNT');
    const priority = (dto.priority || 'MEDIUM').toUpperCase();
    const { slaHours, slaDueDate } = this.calculateSla(priority);

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.hostelMaintenanceRequest.create({
        data: {
          requestNo,
          studentId,
          hostelId: dto.hostelId,
          roomId: dto.roomId,
          category: dto.category.toUpperCase(),
          title: dto.title,
          description: dto.description,
          priority,
          status: 'SUBMITTED',
          photoUrl: dto.photoUrl,
          slaHours,
          slaDueDate,
        },
        include: {
          student: true,
          hostel: true,
          room: true,
          history: true,
          attachments: true,
        },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: request.id,
          action: 'CREATED',
          fromStatus: null,
          toStatus: 'SUBMITTED',
          performedByUserId: user?.id || studentId,
          performedByName: user?.name || `${student.firstName} ${student.lastName}`,
          performedByRole: user?.role || 'STUDENT',
          remarks: `Maintenance ticket lodged under category ${dto.category}`,
        },
      });

      if (dto.photoUrl) {
        await tx.hostelMaintenanceAttachment.create({
          data: {
            requestId: request.id,
            fileName: 'problem_evidence.jpg',
            fileUrl: dto.photoUrl,
            attachmentType: 'PROBLEM_PHOTO',
            uploadedByUserId: user?.id || studentId,
            uploadedByName: user?.name || `${student.firstName} ${student.lastName}`,
            uploadedByRole: user?.role || 'STUDENT',
          },
        });
      }

      return request;
    });
  }

  async getMaintenanceRequests(user: any, query: MaintenanceQueryDto) {
    const where: any = {};

    // Role-based security scoping
    if (user?.role === 'STUDENT') {
      where.studentId = user.studentId || user.id;
    } else if (user?.role === 'MAINTENANCE_STAFF') {
      where.assignedToStaffId = user.id;
    } else if (user?.role === 'HOSTEL_ADMIN' || user?.role === 'WARDEN') {
      if (user?.hostelId) {
        where.hostelId = user.hostelId;
      }
    }

    if (query.hostelId) where.hostelId = query.hostelId;
    if (query.category) where.category = query.category.toUpperCase();
    if (query.priority) where.priority = query.priority.toUpperCase();
    if (query.status) where.status = query.status.toUpperCase();
    if (query.assignedStaffId) where.assignedToStaffId = query.assignedStaffId;
    if (query.studentId && user?.role !== 'STUDENT') where.studentId = query.studentId;

    if (query.search) {
      where.OR = [
        { requestNo: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { student: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { student: { enrollmentNo: { contains: query.search, mode: 'insensitive' } } },
        { room: { roomNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.isOverdue === true || query.isOverdue === 'true') {
      where.status = { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] };
      where.slaDueDate = { lt: new Date() };
    }

    return this.prisma.hostelMaintenanceRequest.findMany({
      where,
      include: {
        student: { select: { id: true, enrollmentNo: true, firstName: true, lastName: true, email: true, phone: true } },
        hostel: { select: { id: true, code: true, name: true, building: true } },
        room: { select: { id: true, roomNumber: true, block: true, floor: true } },
        history: { orderBy: { timestamp: 'asc' } },
        attachments: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getMaintenanceRequestById(id: string, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, enrollmentNo: true, firstName: true, lastName: true, email: true, phone: true } },
        hostel: true,
        room: true,
        history: { orderBy: { timestamp: 'asc' } },
        attachments: true,
      },
    });
    if (!req) throw new NotFoundException('Hostel maintenance request not found.');

    // Security Scoping
    if (user?.role === 'STUDENT' && req.studentId !== (user.studentId || user.id)) {
      throw new ForbiddenException('You are not authorized to view another student\'s maintenance request.');
    }
    if (user?.role === 'MAINTENANCE_STAFF' && req.assignedToStaffId && req.assignedToStaffId !== user.id) {
      throw new ForbiddenException('You can only access maintenance requests assigned to you.');
    }

    return req;
  }

  async assignMaintenanceRequest(id: string, dto: AssignMaintenanceDto, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    const newPriority = (dto.priority || req.priority).toUpperCase();
    const { slaHours, slaDueDate } = this.calculateSla(newPriority);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          assignedToStaffId: dto.staffId,
          assignedToStaffName: dto.staffName || `Staff (${dto.staffId})`,
          assignedByUserId: user?.id,
          assignedByName: user?.name || user?.username || 'Maintenance Head',
          assignedAt: new Date(),
          expectedCompletionDate: dto.expectedCompletionDate ? new Date(dto.expectedCompletionDate) : undefined,
          priority: newPriority,
          slaHours,
          slaDueDate,
          status: 'ASSIGNED',
        },
        include: { student: true, hostel: true, room: true, history: true, attachments: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'ASSIGNED',
          fromStatus: req.status,
          toStatus: 'ASSIGNED',
          performedByUserId: user?.id || 'admin',
          performedByName: user?.name || 'Maintenance Head',
          performedByRole: user?.role || 'MAINTENANCE_HEAD',
          remarks: dto.remarks || `Assigned to maintenance technician ${dto.staffName || dto.staffId}`,
        },
      });

      return updated;
    });
  }

  async startMaintenanceWork(id: string, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    if (user?.role === 'MAINTENANCE_STAFF' && req.assignedToStaffId && req.assignedToStaffId !== user.id) {
      throw new ForbiddenException('Only the assigned maintenance staff can start work on this request.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
        include: { student: true, hostel: true, room: true, history: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'STARTED',
          fromStatus: req.status,
          toStatus: 'IN_PROGRESS',
          performedByUserId: user?.id || 'staff',
          performedByName: user?.name || 'Technician',
          performedByRole: user?.role || 'MAINTENANCE_STAFF',
          remarks: 'Technician has commenced repair work on site',
        },
      });

      return updated;
    });
  }

  async holdMaintenanceRequest(id: string, dto: HoldMaintenanceDto, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'ON_HOLD',
          holdReason: dto.holdReason,
        },
        include: { student: true, hostel: true, room: true, history: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'ON_HOLD',
          fromStatus: req.status,
          toStatus: 'ON_HOLD',
          performedByUserId: user?.id || 'staff',
          performedByName: user?.name || 'Technician',
          performedByRole: user?.role || 'MAINTENANCE_STAFF',
          remarks: `Placed on hold: ${dto.holdReason}`,
        },
      });

      return updated;
    });
  }

  async resolveMaintenanceRequest(id: string, dto: ResolveMaintenanceDto, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolutionDetails: dto.resolutionDetails,
          resolvedAt: new Date(),
          resolvedPhotoUrl: dto.resolvedPhotoUrl,
        },
        include: { student: true, hostel: true, room: true, history: true, attachments: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'RESOLVED',
          fromStatus: req.status,
          toStatus: 'RESOLVED',
          performedByUserId: user?.id || 'staff',
          performedByName: user?.name || 'Technician',
          performedByRole: user?.role || 'MAINTENANCE_STAFF',
          remarks: dto.resolutionDetails,
        },
      });

      if (dto.resolvedPhotoUrl) {
        await tx.hostelMaintenanceAttachment.create({
          data: {
            requestId: id,
            fileName: 'resolution_proof.jpg',
            fileUrl: dto.resolvedPhotoUrl,
            attachmentType: 'COMPLETION_PHOTO',
            uploadedByUserId: user?.id || 'staff',
            uploadedByName: user?.name || 'Technician',
            uploadedByRole: user?.role || 'MAINTENANCE_STAFF',
          },
        });
      }

      return updated;
    });
  }

  async confirmResolution(id: string, dto: ConfirmResolutionDto, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    if (user?.role === 'STUDENT' && req.studentId !== (user.studentId || user.id)) {
      throw new ForbiddenException('Only the student who raised the ticket can confirm resolution.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedByUserId: user?.id,
          studentConfirmedAt: new Date(),
          studentRating: dto.rating || 5,
          studentFeedback: dto.feedback || 'Resolution confirmed by student',
        },
        include: { student: true, hostel: true, room: true, history: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'CONFIRMED',
          fromStatus: req.status,
          toStatus: 'CLOSED',
          performedByUserId: user?.id || req.studentId,
          performedByName: user?.name || 'Student',
          performedByRole: 'STUDENT',
          remarks: `Student confirmed resolution (Rating: ${dto.rating || 5}/5). Feedback: ${dto.feedback || 'Issue resolved satisfactory.'}`,
        },
      });

      return updated;
    });
  }

  async reopenMaintenanceRequest(id: string, dto: ReopenMaintenanceDto, user: any) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    if (user?.role === 'STUDENT' && req.studentId !== (user.studentId || user.id)) {
      throw new ForbiddenException('Only the student who raised the ticket can reopen this request.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'REOPENED',
          reopenedReason: dto.reopenedReason,
          reopenedAt: new Date(),
        },
        include: { student: true, hostel: true, room: true, history: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'REOPENED',
          fromStatus: req.status,
          toStatus: 'REOPENED',
          performedByUserId: user?.id || req.studentId,
          performedByName: user?.name || 'Student',
          performedByRole: 'STUDENT',
          remarks: `Student reopened ticket: ${dto.reopenedReason}`,
        },
      });

      return updated;
    });
  }

  async closeMaintenanceRequest(id: string, user: any, remarks?: string) {
    const req = await this.prisma.hostelMaintenanceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Maintenance request not found.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hostelMaintenanceRequest.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedByUserId: user?.id,
        },
        include: { student: true, hostel: true, room: true, history: true },
      });

      await tx.hostelMaintenanceHistory.create({
        data: {
          requestId: id,
          action: 'CLOSED',
          fromStatus: req.status,
          toStatus: 'CLOSED',
          performedByUserId: user?.id || 'admin',
          performedByName: user?.name || 'Hostel Admin',
          performedByRole: user?.role || 'HOSTEL_ADMIN',
          remarks: remarks || 'Ticket closed by Hostel Administrator',
        },
      });

      return updated;
    });
  }

  // ── Hostel Reports ────────────────────────────────────────────────────────

  async getHostelReports(reportType: string, filter?: any, user?: any) {
    const type = (reportType || 'HOSTEL_OCCUPANCY').toUpperCase();

    switch (type) {
      case 'HOSTEL_OCCUPANCY': {
        const hostels = await this.prisma.hostel.findMany({
          include: {
            rooms: true,
            allotments: { where: { status: 'ACTIVE' } },
          },
        });
        return hostels.map((h) => ({
          hostelId: h.id,
          code: h.code,
          name: h.name,
          building: h.building,
          gender: h.gender,
          totalRooms: h.rooms.length,
          totalCapacity: h.capacity,
          occupiedStudents: h.allotments.length,
          availableCapacity: Math.max(0, h.capacity - h.allotments.length),
          occupancyRate: h.capacity > 0 ? ((h.allotments.length / h.capacity) * 100).toFixed(1) + '%' : '0%',
          warden: h.wardenName,
          status: h.status,
        }));
      }

      case 'ROOM_OCCUPANCY': {
        const rooms = await this.prisma.hostelRoom.findMany({
          include: {
            hostel: true,
            beds: true,
            allotments: { where: { status: 'ACTIVE' }, include: { student: true } },
          },
          orderBy: [{ hostelId: 'asc' }, { roomNumber: 'asc' }],
        });
        return rooms.map((r) => ({
          roomId: r.id,
          hostelName: r.hostel.name,
          block: r.block,
          floor: r.floor,
          roomNumber: r.roomNumber,
          roomType: r.roomType,
          capacity: r.capacity,
          occupiedBeds: r.allotments.length,
          availableBeds: Math.max(0, r.capacity - r.allotments.length),
          occupants: r.allotments.map((a) => `${a.student?.firstName} ${a.student?.lastName} (${a.student?.enrollmentNo})`).join(', '),
          status: r.status,
        }));
      }

      case 'STUDENT_ALLOCATION': {
        const allotments = await this.prisma.hostelAllotment.findMany({
          where: { status: 'ACTIVE' },
          include: {
            student: { include: { department: true, batch: { include: { program: true } } } },
            hostel: true,
            room: true,
            bed: true,
          },
          orderBy: { allottedDate: 'desc' },
        });
        return allotments.map((a: any) => ({
          allotmentNo: a.allotmentNo,
          studentName: `${a.student?.firstName || ''} ${a.student?.lastName || ''}`,
          enrollmentNo: a.student?.enrollmentNo || '',
          department: a.student?.department?.name || '',
          program: a.student?.batch?.program?.name || '',
          hostelName: a.hostel?.name || '',
          roomNumber: a.room?.roomNumber || '',
          bedNumber: a.bed?.bedNumber || '',
          allottedDate: a.allottedDate,
          status: a.status,
        }));
      }

      case 'MAINTENANCE_REQUEST_REPORT':
      case 'PENDING_MAINTENANCE':
      case 'OVERDUE_REQUESTS': {
        const where: any = {};
        if (type === 'PENDING_MAINTENANCE') {
          where.status = { in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'] };
        } else if (type === 'OVERDUE_REQUESTS') {
          where.status = { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] };
          where.slaDueDate = { lt: new Date() };
        }

        const requests = await this.prisma.hostelMaintenanceRequest.findMany({
          where,
          include: { student: true, hostel: true, room: true },
          orderBy: { createdAt: 'desc' },
        });

        return requests.map((r) => ({
          requestNo: r.requestNo,
          student: `${r.student.firstName} ${r.student.lastName} (${r.student.enrollmentNo})`,
          hostel: r.hostel.name,
          room: r.room?.roomNumber || 'N/A',
          category: r.category,
          title: r.title,
          priority: r.priority,
          status: r.status,
          assignedTo: r.assignedToStaffName || 'Unassigned',
          slaHours: r.slaHours,
          slaDueDate: r.slaDueDate,
          isOverdue: r.slaDueDate && new Date(r.slaDueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(r.status),
          createdAt: r.createdAt,
        }));
      }

      case 'VISITOR_REPORT': {
        const visitors = await this.prisma.hostelVisitor.findMany({
          include: { student: true, hostel: true, room: true },
          orderBy: { createdAt: 'desc' },
        });
        return visitors.map((v) => ({
          passNumber: v.passNumber,
          visitorName: v.visitorName,
          phone: v.contactPhone,
          relation: v.relation,
          student: `${v.student.firstName} ${v.student.lastName} (${v.student.enrollmentNo})`,
          hostel: v.hostel.name,
          room: v.room?.roomNumber,
          purpose: v.purpose,
          checkIn: v.checkInTime,
          checkOut: v.checkOutTime,
          status: v.status,
        }));
      }

      default:
        return [];
    }
  }

  // ── Mess & Dashboard ──────────────────────────────────────────────────────

  async getMesses() {
    return this.prisma.mess.findMany({
      include: { menus: true, _count: { select: { enrollments: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async enrollInMess(data: { studentId: string; messId: string; planType?: string; dietType?: string }) {
    return this.prisma.messEnrollment.create({
      data: {
        studentId: data.studentId,
        messId: data.messId,
        planType: data.planType || 'MONTHLY',
        dietType: data.dietType || 'VEG',
        status: 'ACTIVE',
      },
      include: { mess: true, student: true },
    });
  }

  async getHostelDashboardMetrics() {
    const now = new Date();
    const [
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      pendingApplications,
      activeOutpasses,
      activeVisitors,
      pendingMaintenance,
      urgentMaintenance,
      overdueMaintenance,
    ] = await Promise.all([
      this.prisma.hostel.count(),
      this.prisma.hostelRoom.count(),
      this.prisma.hostelBed.count(),
      this.prisma.hostelBed.count({ where: { status: 'OCCUPIED' } }),
      this.prisma.hostelApplication.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.outpassRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.hostelVisitor.count({ where: { status: 'CHECKED_IN' } }),
      this.prisma.hostelMaintenanceRequest.count({
        where: { status: { in: ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'] } },
      }),
      this.prisma.hostelMaintenanceRequest.count({
        where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } },
      }),
      this.prisma.hostelMaintenanceRequest.count({
        where: { slaDueDate: { lt: now }, status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } },
      }),
    ]);

    return {
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds),
      occupancyRate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) + '%' : '0%',
      pendingApplications,
      activeOutpasses,
      activeVisitors,
      pendingMaintenance,
      urgentMaintenance,
      overdueMaintenance,
    };
  }
}
