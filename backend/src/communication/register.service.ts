import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInwardRegisterDto,
  UpdateInwardRegisterDto,
  InwardForwardDto,
  InwardActionDto,
  InwardStatusUpdateDto,
  InwardQueryDto,
  CreateOutwardRegisterDto,
  UpdateOutwardRegisterDto,
  OutwardDispatchDto,
  OutwardDeliveryDto,
  OutwardReturnDto,
  OutwardStatusUpdateDto,
  OutwardQueryDto,
  InwardStatusEnum,
  OutwardStatusEnum,
} from './dto/register.dto';

@Injectable()
export class RegisterService {
  constructor(private readonly prisma: PrismaService) {}

  public async generateInwardNumber(year: number = new Date().getFullYear()): Promise<string> {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const count = await this.prisma.inwardRegister.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const seq = String(count + 1).padStart(6, '0');
    return `INW/${year}/${seq}`;
  }

  public async generateOutwardNumber(year: number = new Date().getFullYear()): Promise<string> {
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const count = await this.prisma.outwardRegister.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const seq = String(count + 1).padStart(6, '0');
    return `OUT/${year}/${seq}`;
  }

  // Helper: check if user has access to a department
  private checkDepartmentAccess(user: any, departmentId?: string | null) {
    if (!user) return;
    const isSuper =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'REGISTRAR_ADMIN' ||
      user.role === 'ADMIN' ||
      user.role === 'UNIVERSITY_ADMIN' ||
      (user.authorityLevel !== undefined && user.authorityLevel <= 3);

    if (isSuper) return;

    const userDeptId = user.faculty?.departmentId || user.departmentId;
    if (departmentId && userDeptId && departmentId !== userDeptId) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view or modify records from another department.',
      );
    }
  }

  // ── 1. Inward Register ────────────────────────────────────────────────────

  async createInward(creatorUserId: string, dto: CreateInwardRegisterDto) {
    const registerNo = dto.inwardNumber || dto.registerNo || (await this.generateInwardNumber());

    // Auto resolve department if not provided
    let departmentId = dto.departmentId;
    if (!departmentId) {
      const user = await this.prisma.user.findUnique({
        where: { id: creatorUserId },
        include: { faculty: true },
      });
      if (user?.faculty?.departmentId) departmentId = user.faculty.departmentId;
    }

    const senderName = dto.senderName || dto.receivedFrom || 'Unknown Sender';
    const senderOrganization = dto.senderOrganization || dto.organizationOrPerson;
    const receivedThrough = dto.receivedThrough || dto.modeOfReceipt || 'POST';

    return this.prisma.$transaction(async (tx) => {
      const inward = await tx.inwardRegister.create({
        data: {
          registerNo,
          receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : new Date(),
          receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
          senderName,
          senderOrganization,
          senderEmail: dto.senderEmail,
          senderPhone: dto.senderPhone,
          letterNumber: dto.letterNumber,
          letterDate: dto.letterDate ? new Date(dto.letterDate) : undefined,
          subject: dto.subject,
          description: dto.description,
          documentType: dto.documentType || 'LETTER',
          departmentId,
          receivedByUserId: creatorUserId,
          receivedThrough,
          priority: dto.priority || 'NORMAL',
          status: dto.assignedToUserId ? InwardStatusEnum.ACTION_REQUIRED : InwardStatusEnum.RECEIVED,
          assignedToUserId: dto.assignedToUserId,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          documentUrl: dto.documentUrl,
          attachmentName: dto.attachmentName,
          documentSize: dto.documentSize,
          documentTypeMime: dto.documentTypeMime,
          remarks: dto.remarks,
          notesheetId: dto.notesheetId,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: inward.id,
          fromStatus: null,
          toStatus: inward.status,
          changedByUserId: creatorUserId,
          remarks: `Initial registration with Inward No: ${registerNo}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: inward.id,
          action: 'CREATED',
          performedByUserId: creatorUserId,
          toStatus: inward.status,
          remarks: `Inward registered with No. ${registerNo} from ${senderName}`,
        },
      });

      return inward;
    });
  }

  async getInwards(user: any, query?: InwardQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC: Department scoping for departmental staff
    const isSuper =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'REGISTRAR_ADMIN' ||
      user.role === 'ADMIN' ||
      user.role === 'UNIVERSITY_ADMIN' ||
      (user.authorityLevel !== undefined && user.authorityLevel <= 3);

    if (!isSuper) {
      const userDeptId = user.faculty?.departmentId || user.departmentId;
      if (userDeptId) where.departmentId = userDeptId;
      else where.assignedToUserId = user.id;
    } else if (query?.departmentId && query.departmentId !== 'ALL') {
      where.departmentId = query.departmentId;
    }

    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();
    if (query?.priority && query.priority !== 'ALL') where.priority = query.priority.toUpperCase();
    if (query?.receivedThrough && query.receivedThrough !== 'ALL')
      where.receivedThrough = query.receivedThrough.toUpperCase();

    if (query?.startDate || query?.endDate) {
      where.receivedDate = {};
      if (query.startDate) where.receivedDate.gte = new Date(query.startDate);
      if (query.endDate) where.receivedDate.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { registerNo: { contains: q, mode: 'insensitive' } },
        { senderName: { contains: q, mode: 'insensitive' } },
        { senderOrganization: { contains: q, mode: 'insensitive' } },
        { letterNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { remarks: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.inwardRegister.count({ where }),
      this.prisma.inwardRegister.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
          forwardings: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { receivedDate: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getInwardById(id: string, user?: any) {
    const inward = await this.prisma.inwardRegister.findUnique({
      where: { id },
      include: {
        department: true,
        receivedBy: { select: { id: true, username: true, erpId: true } },
        assignedTo: { select: { id: true, username: true, erpId: true } },
        forwardings: {
          include: {
            forwardedBy: { select: { id: true, username: true, erpId: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          include: { performedBy: { select: { id: true, username: true, erpId: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!inward) throw new NotFoundException('Inward Register entry not found.');
    this.checkDepartmentAccess(user, inward.departmentId);
    return inward;
  }

  async updateInward(id: string, user: any, dto: UpdateInwardRegisterDto) {
    const existing = await this.getInwardById(id, user);

    const updateData: any = {};
    if (dto.receiptDate) updateData.receiptDate = new Date(dto.receiptDate);
    if (dto.receivedDate) updateData.receivedDate = new Date(dto.receivedDate);
    if (dto.senderName !== undefined) updateData.senderName = dto.senderName;
    if (dto.receivedFrom !== undefined) updateData.senderName = dto.receivedFrom;
    if (dto.senderOrganization !== undefined) updateData.senderOrganization = dto.senderOrganization;
    if (dto.organizationOrPerson !== undefined) updateData.senderOrganization = dto.organizationOrPerson;
    if (dto.senderEmail !== undefined) updateData.senderEmail = dto.senderEmail;
    if (dto.senderPhone !== undefined) updateData.senderPhone = dto.senderPhone;
    if (dto.letterNumber !== undefined) updateData.letterNumber = dto.letterNumber;
    if (dto.letterDate) updateData.letterDate = new Date(dto.letterDate);
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.documentType) updateData.documentType = dto.documentType;
    if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId;
    if (dto.receivedThrough) updateData.receivedThrough = dto.receivedThrough.toUpperCase();
    if (dto.modeOfReceipt) updateData.receivedThrough = dto.modeOfReceipt.toUpperCase();
    if (dto.priority) updateData.priority = dto.priority.toUpperCase();
    if (dto.status) updateData.status = dto.status.toUpperCase();
    if (dto.assignedToUserId !== undefined) updateData.assignedToUserId = dto.assignedToUserId;
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.documentUrl !== undefined) updateData.documentUrl = dto.documentUrl;
    if (dto.attachmentName !== undefined) updateData.attachmentName = dto.attachmentName;
    if (dto.documentSize !== undefined) updateData.documentSize = dto.documentSize;
    if (dto.documentTypeMime !== undefined) updateData.documentTypeMime = dto.documentTypeMime;
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
    if (dto.notesheetId !== undefined) updateData.notesheetId = dto.notesheetId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inwardRegister.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
        },
      });

      if (dto.status && dto.status !== existing.status) {
        await tx.inwardStatusHistory.create({
          data: {
            inwardId: id,
            fromStatus: existing.status,
            toStatus: updated.status,
            changedByUserId: user.id,
            remarks: dto.remarks || 'Status updated',
          },
        });
      }

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'UPDATED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          remarks: dto.remarks || 'Inward details updated',
        },
      });

      return updated;
    });
  }

  async forwardInward(id: string, user: any, dto: InwardForwardDto) {
    const existing = await this.getInwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const forwarding = await tx.inwardForwarding.create({
        data: {
          inwardId: id,
          forwardedByUserId: user.id,
          forwardedToOffice: dto.forwardedToOffice,
          forwardedToDepartmentId: dto.forwardedToDepartmentId,
          forwardedToUserId: dto.forwardedToUserId,
          actionRequired: dto.actionRequired,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          remarks: dto.remarks,
          status: 'PENDING',
        },
      });

      const updated = await tx.inwardRegister.update({
        where: { id },
        data: {
          status: InwardStatusEnum.FORWARDED,
          departmentId: dto.forwardedToDepartmentId || existing.departmentId,
          assignedToUserId: dto.forwardedToUserId || existing.assignedToUserId,
          remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Forwarded: ${dto.remarks}` : existing.remarks,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
          forwardings: true,
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.FORWARDED,
          changedByUserId: user.id,
          remarks: `Forwarded to ${dto.forwardedToOffice || dto.forwardedToDepartmentId || 'department'}: ${dto.actionRequired}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'FORWARDED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.FORWARDED,
          remarks: `Inward forwarded: ${dto.actionRequired}`,
        },
      });

      return { inward: updated, forwarding };
    });
  }

  async recordInwardAction(id: string, user: any, dto: InwardActionDto) {
    const existing = await this.getInwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      // Complete any pending forwardings
      const pendingForwardings = await tx.inwardForwarding.findMany({
        where: { inwardId: id, status: 'PENDING' },
      });

      for (const fw of pendingForwardings) {
        await tx.inwardForwarding.update({
          where: { id: fw.id },
          data: {
            status: 'COMPLETED',
            actionTaken: dto.actionTaken,
            actionTakenDate: new Date(),
          },
        });
      }

      const newStatus = dto.status ? dto.status.toUpperCase() : InwardStatusEnum.UNDER_PROCESS;

      const updated = await tx.inwardRegister.update({
        where: { id },
        data: {
          status: newStatus,
          remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Action: ${dto.actionTaken}` : existing.remarks,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
          forwardings: true,
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: id,
          fromStatus: existing.status,
          toStatus: newStatus,
          changedByUserId: user.id,
          remarks: `Action recorded: ${dto.actionTaken}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'ACTION_TAKEN',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: newStatus,
          remarks: `Action logged: ${dto.actionTaken}`,
        },
      });

      return updated;
    });
  }

  async completeInward(id: string, user: any, remarks?: string) {
    const existing = await this.getInwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inwardRegister.update({
        where: { id },
        data: {
          status: InwardStatusEnum.COMPLETED,
          remarks: remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Completed: ${remarks}` : existing.remarks,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.COMPLETED,
          changedByUserId: user.id,
          remarks: remarks || 'Inward communication action completed.',
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'COMPLETED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.COMPLETED,
          remarks: remarks || 'Inward completed',
        },
      });

      return updated;
    });
  }

  async closeInward(id: string, user: any, remarks?: string) {
    const existing = await this.getInwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inwardRegister.update({
        where: { id },
        data: {
          status: InwardStatusEnum.CLOSED,
          remarks: remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Closed: ${remarks}` : existing.remarks,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.CLOSED,
          changedByUserId: user.id,
          remarks: remarks || 'Inward register record archived and closed.',
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'CLOSED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: InwardStatusEnum.CLOSED,
          remarks: remarks || 'Inward closed',
        },
      });

      return updated;
    });
  }

  async updateInwardStatus(id: string, user: any, dto: InwardStatusUpdateDto) {
    const existing = await this.getInwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inwardRegister.update({
        where: { id },
        data: {
          status: dto.status.toUpperCase(),
          assignedToUserId: dto.assignedToUserId !== undefined ? dto.assignedToUserId : existing.assignedToUserId,
          remarks: dto.remarks || existing.remarks,
        },
        include: {
          department: true,
          receivedBy: { select: { id: true, username: true, erpId: true } },
          assignedTo: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.inwardStatusHistory.create({
        data: {
          inwardId: id,
          fromStatus: existing.status,
          toStatus: updated.status,
          changedByUserId: user.id,
          remarks: dto.remarks || `Status transitioned to ${dto.status}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'INWARD',
          inwardId: id,
          action: 'STATUS_CHANGED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          remarks: dto.remarks || `Status transitioned to ${dto.status}`,
        },
      });

      return updated;
    });
  }

  async deleteInward(id: string, user: any) {
    await this.getInwardById(id, user);
    return this.prisma.inwardRegister.delete({ where: { id } });
  }

  // ── 2. Outward Register ───────────────────────────────────────────────────

  async createOutward(creatorUserId: string, dto: CreateOutwardRegisterDto) {
    const dispatchNo = dto.outwardNumber || dto.dispatchNo || (await this.generateOutwardNumber());

    let departmentId = dto.departmentId;
    if (!departmentId) {
      const user = await this.prisma.user.findUnique({
        where: { id: creatorUserId },
        include: { faculty: true },
      });
      if (user?.faculty?.departmentId) departmentId = user.faculty.departmentId;
    }

    const receiverName = dto.receiverName || dto.sentTo || 'Unknown Recipient';
    const receiverOrganization = dto.receiverOrganization || dto.organizationOrPerson;
    const receiverAddress = dto.receiverAddress || dto.address;
    const receiverEmail = dto.receiverEmail || dto.recipientEmail;
    const trackingNo = dto.trackingNo || dto.trackingNumber;
    const courierAgency = dto.courierAgency || dto.courierService;
    const mode = dto.mode || dto.modeOfDispatch || 'COURIER';

    return this.prisma.$transaction(async (tx) => {
      const outward = await tx.outwardRegister.create({
        data: {
          dispatchNo,
          dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : new Date(),
          letterDate: dto.letterDate ? new Date(dto.letterDate) : undefined,
          receiverName,
          receiverOrganization,
          receiverAddress,
          receiverEmail,
          receiverPhone: dto.receiverPhone,
          subject: dto.subject,
          referenceNumber: dto.referenceNumber,
          documentType: dto.documentType || 'LETTER',
          departmentId,
          sentByUserId: creatorUserId,
          mode,
          trackingNo,
          courierService: dto.courierService || (dto as any).courierAgency,
          priority: dto.priority || 'NORMAL',
          status: dto.status || OutwardStatusEnum.DRAFT,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
          deliveredDate: undefined,
          deliveryStatus: trackingNo ? 'IN_TRANSIT' : 'PENDING',
          documentUrl: dto.documentUrl,
          attachmentName: dto.attachmentName,
          remarks: dto.remarks,
          notesheetId: dto.notesheetId,
        },
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.outwardStatusHistory.create({
        data: {
          outwardId: outward.id,
          fromStatus: null,
          toStatus: outward.status,
          changedByUserId: creatorUserId,
          remarks: `Initial registration with Outward No: ${dispatchNo}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: outward.id,
          action: 'CREATED',
          performedByUserId: creatorUserId,
          toStatus: outward.status,
          remarks: `Outward letter registered with Dispatch No. ${dispatchNo} to ${receiverName}`,
        },
      });

      return outward;
    });
  }

  async getOutwards(user: any, query?: OutwardQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    const isSuper =
      user.role === 'SUPER_ADMIN' ||
      user.role === 'REGISTRAR_ADMIN' ||
      user.role === 'ADMIN' ||
      user.role === 'UNIVERSITY_ADMIN' ||
      (user.authorityLevel !== undefined && user.authorityLevel <= 3);

    if (!isSuper) {
      const userDeptId = user.faculty?.departmentId || user.departmentId;
      if (userDeptId) where.departmentId = userDeptId;
      else where.sentByUserId = user.id;
    } else if (query?.departmentId && query.departmentId !== 'ALL') {
      where.departmentId = query.departmentId;
    }

    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();
    if (query?.priority && query.priority !== 'ALL') where.priority = query.priority.toUpperCase();
    if (query?.mode && query.mode !== 'ALL') where.mode = query.mode.toUpperCase();

    if (query?.startDate || query?.endDate) {
      where.dispatchDate = {};
      if (query.startDate) where.dispatchDate.gte = new Date(query.startDate);
      if (query.endDate) where.dispatchDate.lte = new Date(query.endDate);
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { dispatchNo: { contains: q, mode: 'insensitive' } },
        { receiverName: { contains: q, mode: 'insensitive' } },
        { receiverOrganization: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { referenceNumber: { contains: q, mode: 'insensitive' } },
        { trackingNo: { contains: q, mode: 'insensitive' } },
        { remarks: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.outwardRegister.count({ where }),
      this.prisma.outwardRegister.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
          dispatches: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { dispatchDate: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getOutwardById(id: string, user?: any) {
    const outward = await this.prisma.outwardRegister.findUnique({
      where: { id },
      include: {
        department: true,
        sentBy: { select: { id: true, username: true, erpId: true } },
        dispatches: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          include: { performedBy: { select: { id: true, username: true, erpId: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!outward) throw new NotFoundException('Outward Register entry not found.');
    this.checkDepartmentAccess(user, outward.departmentId);
    return outward;
  }

  async updateOutward(id: string, user: any, dto: UpdateOutwardRegisterDto) {
    const existing = await this.getOutwardById(id, user);

    const updateData: any = {};
    if (dto.dispatchDate) updateData.dispatchDate = new Date(dto.dispatchDate);
    if (dto.letterDate) updateData.letterDate = new Date(dto.letterDate);
    if (dto.receiverName !== undefined) updateData.receiverName = dto.receiverName;
    if (dto.sentTo !== undefined) updateData.receiverName = dto.sentTo;
    if (dto.receiverOrganization !== undefined) updateData.receiverOrganization = dto.receiverOrganization;
    if (dto.organizationOrPerson !== undefined) updateData.receiverOrganization = dto.organizationOrPerson;
    if (dto.receiverAddress !== undefined) updateData.receiverAddress = dto.receiverAddress;
    if (dto.address !== undefined) updateData.receiverAddress = dto.address;
    if (dto.receiverEmail !== undefined) updateData.receiverEmail = dto.receiverEmail;
    if (dto.recipientEmail !== undefined) updateData.receiverEmail = dto.recipientEmail;
    if (dto.receiverPhone !== undefined) updateData.receiverPhone = dto.receiverPhone;
    if (dto.subject !== undefined) updateData.subject = dto.subject;
    if (dto.referenceNumber !== undefined) updateData.referenceNumber = dto.referenceNumber;
    if (dto.documentType) updateData.documentType = dto.documentType;
    if (dto.departmentId !== undefined) updateData.departmentId = dto.departmentId;
    if (dto.mode) updateData.mode = dto.mode.toUpperCase();
    if (dto.modeOfDispatch) updateData.mode = dto.modeOfDispatch.toUpperCase();
    if (dto.trackingNo !== undefined) updateData.trackingNo = dto.trackingNo;
    if (dto.trackingNumber !== undefined) updateData.trackingNo = dto.trackingNumber;
    if (dto.courierAgency !== undefined) updateData.courierAgency = dto.courierAgency;
    if (dto.courierService !== undefined) updateData.courierAgency = dto.courierService;
    if (dto.priority) updateData.priority = dto.priority.toUpperCase();
    if (dto.status) updateData.status = dto.status.toUpperCase();
    if (dto.expectedDeliveryDate) updateData.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
    if (dto.deliveredDate) updateData.deliveredDate = new Date(dto.deliveredDate);
    if (dto.deliveryStatus) updateData.deliveryStatus = dto.deliveryStatus;
    if (dto.documentUrl !== undefined) updateData.documentUrl = dto.documentUrl;
    if (dto.attachmentName !== undefined) updateData.attachmentName = dto.attachmentName;
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
    if (dto.notesheetId !== undefined) updateData.notesheetId = dto.notesheetId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.outwardRegister.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
        },
      });

      if (dto.status && dto.status !== existing.status) {
        await tx.outwardStatusHistory.create({
          data: {
            outwardId: id,
            fromStatus: existing.status,
            toStatus: updated.status,
            changedByUserId: user.id,
            remarks: dto.remarks || 'Status updated',
          },
        });
      }

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: id,
          action: 'UPDATED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          remarks: dto.remarks || 'Outward details updated',
        },
      });

      return updated;
    });
  }

  async dispatchOutward(id: string, user: any, dto: OutwardDispatchDto) {
    const existing = await this.getOutwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.outwardDispatch.create({
        data: {
          outwardId: id,
          courierService: dto.courierService,
          trackingNumber: dto.trackingNumber,
          dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
          deliveryStatus: 'IN_TRANSIT',
          dispatchedByUserId: user.id,
          remarks: dto.remarks,
        },
      });

      const updated = await tx.outwardRegister.update({
        where: { id },
        data: {
          status: OutwardStatusEnum.DISPATCHED,
          courierService: dto.courierService,
          trackingNo: dto.trackingNumber,
          dispatchDate: dto.dispatchDate ? new Date(dto.dispatchDate) : existing.dispatchDate,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : existing.expectedDeliveryDate,
          deliveryStatus: 'IN_TRANSIT',
          remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Dispatched: ${dto.remarks}` : existing.remarks,
        },
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
          dispatches: true,
        },
      });

      await tx.outwardStatusHistory.create({
        data: {
          outwardId: id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.DISPATCHED,
          changedByUserId: user.id,
          remarks: `Dispatched via ${dto.courierService}. Tracking No: ${dto.trackingNumber || 'N/A'}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: id,
          action: 'DISPATCHED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.DISPATCHED,
          remarks: `Outward dispatched via ${dto.courierService}. Tracking No: ${dto.trackingNumber || 'N/A'}`,
        },
      });

      return { outward: updated, dispatch };
    });
  }

  async recordOutwardDelivery(id: string, user: any, dto: OutwardDeliveryDto) {
    const existing = await this.getOutwardById(id, user);
    const delDate = dto.deliveryDate ? new Date(dto.deliveryDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Update latest dispatch record
      const latestDispatch = await tx.outwardDispatch.findFirst({
        where: { outwardId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (latestDispatch) {
        await tx.outwardDispatch.update({
          where: { id: latestDispatch.id },
          data: {
            deliveryStatus: 'DELIVERED',
            deliveryDate: delDate,
            remarks: dto.remarks ? `${latestDispatch.remarks ? latestDispatch.remarks + ' | ' : ''}${dto.remarks}` : latestDispatch.remarks,
          },
        });
      }

      const updated = await tx.outwardRegister.update({
        where: { id },
        data: {
          status: OutwardStatusEnum.DELIVERED,
          deliveryStatus: 'DELIVERED',
          deliveredDate: delDate,
          remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Delivered: ${dto.remarks}` : existing.remarks,
        },
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
          dispatches: true,
        },
      });

      await tx.outwardStatusHistory.create({
        data: {
          outwardId: id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.DELIVERED,
          changedByUserId: user.id,
          remarks: dto.remarks || 'Consignment delivered successfully to recipient.',
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: id,
          action: 'DELIVERED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.DELIVERED,
          remarks: dto.remarks || 'Outward marked delivered',
        },
      });

      return updated;
    });
  }

  async recordOutwardReturn(id: string, user: any, dto: OutwardReturnDto) {
    const existing = await this.getOutwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const latestDispatch = await tx.outwardDispatch.findFirst({
        where: { outwardId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (latestDispatch) {
        await tx.outwardDispatch.update({
          where: { id: latestDispatch.id },
          data: {
            deliveryStatus: 'RETURNED',
            remarks: `Returned: ${dto.returnReason}`,
          },
        });
      }

      const updated = await tx.outwardRegister.update({
        where: { id },
        data: {
          status: OutwardStatusEnum.RETURNED,
          deliveryStatus: 'RETURNED',
          remarks: `${existing.remarks ? existing.remarks + ' | ' : ''}Return Reason: ${dto.returnReason}`,
        },
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
          dispatches: true,
        },
      });

      await tx.outwardStatusHistory.create({
        data: {
          outwardId: id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.RETURNED,
          changedByUserId: user.id,
          remarks: `Returned back: ${dto.returnReason}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: id,
          action: 'RETURNED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: OutwardStatusEnum.RETURNED,
          remarks: `Consignment returned: ${dto.returnReason}`,
        },
      });

      return updated;
    });
  }

  async updateOutwardStatus(id: string, user: any, dto: OutwardStatusUpdateDto) {
    const existing = await this.getOutwardById(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.outwardRegister.update({
        where: { id },
        data: {
          status: dto.status.toUpperCase(),
          trackingNo: dto.trackingNo || existing.trackingNo,
          courierService: dto.courierService || existing.courierService,
          deliveredDate: dto.deliveredDate ? new Date(dto.deliveredDate) : existing.deliveredDate,
          remarks: dto.remarks || existing.remarks,
        },
        include: {
          department: true,
          sentBy: { select: { id: true, username: true, erpId: true } },
        },
      });

      await tx.outwardStatusHistory.create({
        data: {
          outwardId: id,
          fromStatus: existing.status,
          toStatus: updated.status,
          changedByUserId: user.id,
          remarks: dto.remarks || `Dispatch status updated to ${dto.status}`,
        },
      });

      await tx.inwardOutwardAuditLog.create({
        data: {
          recordType: 'OUTWARD',
          outwardId: id,
          action: 'STATUS_CHANGED',
          performedByUserId: user.id,
          fromStatus: existing.status,
          toStatus: updated.status,
          remarks: dto.remarks || `Dispatch status updated to ${dto.status}`,
        },
      });

      return updated;
    });
  }

  async deleteOutward(id: string, user: any) {
    await this.getOutwardById(id, user);
    return this.prisma.outwardRegister.delete({ where: { id } });
  }

  // ── 3. Audit History ──────────────────────────────────────────────────────

  async getAuditHistory(recordType: 'INWARD' | 'OUTWARD', recordId: string) {
    return this.prisma.inwardOutwardAuditLog.findMany({
      where: {
        recordType,
        ...(recordType === 'INWARD' ? { inwardId: recordId } : { outwardId: recordId }),
      },
      include: {
        performedBy: { select: { id: true, username: true, erpId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 4. Dashboard Metrics & Reports ────────────────────────────────────────

  async getRegisterDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalInward,
      todayInward,
      pendingInward,
      actionRequiredInward,
      overdueInward,
      totalOutward,
      todayOutward,
      dispatchedOutward,
      deliveredOutward,
      returnedOutward,
    ] = await Promise.all([
      this.prisma.inwardRegister.count(),
      this.prisma.inwardRegister.count({
        where: {
          receivedDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.inwardRegister.count({
        where: {
          status: { in: [InwardStatusEnum.RECEIVED, InwardStatusEnum.UNDER_PROCESS] },
        },
      }),
      this.prisma.inwardRegister.count({
        where: {
          status: { in: [InwardStatusEnum.ACTION_REQUIRED, InwardStatusEnum.FORWARDED] },
        },
      }),
      this.prisma.inwardRegister.count({
        where: {
          dueDate: { lt: today },
          status: { notIn: [InwardStatusEnum.COMPLETED, InwardStatusEnum.CLOSED] },
        },
      }),
      this.prisma.outwardRegister.count(),
      this.prisma.outwardRegister.count({
        where: {
          dispatchDate: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.outwardRegister.count({ where: { status: OutwardStatusEnum.DISPATCHED } }),
      this.prisma.outwardRegister.count({ where: { status: OutwardStatusEnum.DELIVERED } }),
      this.prisma.outwardRegister.count({ where: { status: OutwardStatusEnum.RETURNED } }),
    ]);

    return {
      todayInward,
      pendingInward,
      actionRequired: actionRequiredInward,
      overdueInward,
      totalInward,
      todayOutward,
      dispatchedOutward,
      deliveredOutward,
      returnedOutward,
      totalOutward,
    };
  }

  async getDepartmentRegisterSummary() {
    const departments = await this.prisma.department.findMany();
    const result: any[] = [];

    for (const dept of departments) {
      const [inwardCount, outwardCount] = await Promise.all([
        this.prisma.inwardRegister.count({ where: { departmentId: dept.id } }),
        this.prisma.outwardRegister.count({ where: { departmentId: dept.id } }),
      ]);
      result.push({
        departmentId: dept.id,
        departmentCode: dept.code,
        departmentName: dept.name,
        inwardTotal: inwardCount,
        outwardTotal: outwardCount,
        grandTotal: inwardCount + outwardCount,
      });
    }

    return result;
  }

  async getRegisterReports(reportType: string, query?: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (reportType) {
      case 'INWARD_REGISTER': {
        const data = await this.prisma.inwardRegister.findMany({
          include: { department: true, assignedTo: true },
          orderBy: { receivedDate: 'desc' },
        });
        return {
          title: 'University Inward Register Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          headers: ['Inward No', 'Receipt Date', 'Received From', 'Letter No', 'Subject', 'Department', 'Priority', 'Status'],
          data: data.map((i) => ({
            inwardNo: i.registerNo,
            receiptDate: i.receivedDate ? i.receivedDate.toISOString().slice(0, 10) : 'N/A',
            receivedFrom: i.senderName + (i.senderOrganization ? ` (${i.senderOrganization})` : ''),
            letterNo: i.letterNumber || 'N/A',
            subject: i.subject,
            department: i.department?.name || 'N/A',
            priority: i.priority,
            status: i.status,
          })),
        };
      }

      case 'OUTWARD_REGISTER': {
        const data = await this.prisma.outwardRegister.findMany({
          include: { department: true, sentBy: true },
          orderBy: { dispatchDate: 'desc' },
        });
        return {
          title: 'University Outward Register Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          headers: ['Outward No', 'Dispatch Date', 'Sent To', 'Reference No', 'Subject', 'Department', 'Mode', 'Status'],
          data: data.map((o) => ({
            outwardNo: o.dispatchNo,
            dispatchDate: o.dispatchDate ? o.dispatchDate.toISOString().slice(0, 10) : 'N/A',
            sentTo: o.receiverName + (o.receiverOrganization ? ` (${o.receiverOrganization})` : ''),
            referenceNo: o.referenceNumber || 'N/A',
            subject: o.subject,
            department: o.department?.name || 'N/A',
            mode: o.mode,
            status: o.status,
          })),
        };
      }

      case 'PENDING_INWARD': {
        const data = await this.prisma.inwardRegister.findMany({
          where: {
            status: { in: [InwardStatusEnum.RECEIVED, InwardStatusEnum.UNDER_PROCESS, InwardStatusEnum.FORWARDED, InwardStatusEnum.ACTION_REQUIRED] },
          },
          include: { department: true, assignedTo: true },
          orderBy: { receivedDate: 'desc' },
        });
        return {
          title: 'Pending Inward Communications Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data: data.map((i) => ({
            inwardNo: i.registerNo,
            receivedDate: i.receivedDate ? i.receivedDate.toISOString().slice(0, 10) : 'N/A',
            receivedFrom: i.senderName,
            subject: i.subject,
            department: i.department?.name || 'N/A',
            status: i.status,
            dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : 'N/A',
          })),
        };
      }

      case 'OVERDUE_INWARD': {
        const data = await this.prisma.inwardRegister.findMany({
          where: {
            dueDate: { lt: today },
            status: { notIn: [InwardStatusEnum.COMPLETED, InwardStatusEnum.CLOSED] },
          },
          include: { department: true, assignedTo: true },
          orderBy: { dueDate: 'asc' },
        });
        return {
          title: 'Overdue Inward Action Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data: data.map((i) => ({
            inwardNo: i.registerNo,
            receivedDate: i.receivedDate ? i.receivedDate.toISOString().slice(0, 10) : 'N/A',
            receivedFrom: i.senderName,
            subject: i.subject,
            department: i.department?.name || 'N/A',
            dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : 'N/A',
            overdueDays: Math.ceil((today.getTime() - (i.dueDate ? new Date(i.dueDate).getTime() : today.getTime())) / (1000 * 3600 * 24)),
          })),
        };
      }

      case 'DEPARTMENT_INWARD':
      case 'DEPT_INWARD': {
        const departments = await this.prisma.department.findMany();
        const data: any[] = [];
        for (const dept of departments) {
          const count = await this.prisma.inwardRegister.count({ where: { departmentId: dept.id } });
          const pending = await this.prisma.inwardRegister.count({
            where: {
              departmentId: dept.id,
              status: { notIn: [InwardStatusEnum.COMPLETED, InwardStatusEnum.CLOSED] },
            },
          });
          data.push({
            departmentCode: dept.code,
            departmentName: dept.name,
            totalInward: count,
            pendingInward: pending,
            completedInward: count - pending,
          });
        }
        return {
          title: 'Department-wise Inward Communications Summary',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data,
        };
      }

      case 'DEPARTMENT_OUTWARD':
      case 'DEPT_OUTWARD': {
        const departments = await this.prisma.department.findMany();
        const data: any[] = [];
        for (const dept of departments) {
          const count = await this.prisma.outwardRegister.count({ where: { departmentId: dept.id } });
          const delivered = await this.prisma.outwardRegister.count({
            where: { departmentId: dept.id, status: OutwardStatusEnum.DELIVERED },
          });
          data.push({
            departmentCode: dept.code,
            departmentName: dept.name,
            totalOutward: count,
            deliveredOutward: delivered,
            inTransitOrPending: count - delivered,
          });
        }
        return {
          title: 'Department-wise Outward Communications Summary',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data,
        };
      }

      case 'DISPATCH_REPORT': {
        const data = await this.prisma.outwardRegister.findMany({
          where: { status: { in: [OutwardStatusEnum.DISPATCHED, OutwardStatusEnum.DELIVERED] } },
          include: { department: true },
          orderBy: { dispatchDate: 'desc' },
        });
        return {
          title: 'Postal & Courier Dispatch Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data: data.map((o) => ({
            outwardNo: o.dispatchNo,
            dispatchDate: o.dispatchDate ? o.dispatchDate.toISOString().slice(0, 10) : 'N/A',
            receiverName: o.receiverName,
            courierService: o.courierService || 'N/A',
            trackingNumber: o.trackingNo || 'N/A',
            deliveryStatus: o.deliveryStatus || 'IN_TRANSIT',
          })),
        };
      }

      case 'DELIVERY_REPORT': {
        const data = await this.prisma.outwardRegister.findMany({
          where: { status: OutwardStatusEnum.DELIVERED },
          include: { department: true },
          orderBy: { deliveredDate: 'desc' },
        });
        return {
          title: 'Confirmed Delivery & Acknowledgment Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data: data.map((o) => ({
            outwardNo: o.dispatchNo,
            dispatchDate: o.dispatchDate ? o.dispatchDate.toISOString().slice(0, 10) : 'N/A',
            deliveredDate: o.deliveredDate ? o.deliveredDate.toISOString().slice(0, 10) : 'N/A',
            receiverName: o.receiverName,
            trackingNumber: o.trackingNo || 'N/A',
            status: 'DELIVERED',
          })),
        };
      }

      case 'RETURNED_DISPATCH': {
        const data = await this.prisma.outwardRegister.findMany({
          where: { status: OutwardStatusEnum.RETURNED },
          include: { department: true },
          orderBy: { updatedAt: 'desc' },
        });
        return {
          title: 'Returned / Undelivered Dispatch Report',
          reportType,
          totalRecords: data.length,
          generatedAt: new Date().toISOString(),
          data: data.map((o) => ({
            outwardNo: o.dispatchNo,
            receiverName: o.receiverName,
            receiverAddress: o.receiverAddress || 'N/A',
            trackingNumber: o.trackingNo || 'N/A',
            returnReason: o.remarks || 'Undelivered',
          })),
        };
      }

      case 'DATEWISE_COMMUNICATION':
      default: {
        const [inwards, outwards] = await Promise.all([
          this.prisma.inwardRegister.findMany({ orderBy: { receivedDate: 'desc' }, take: 50 }),
          this.prisma.outwardRegister.findMany({ orderBy: { dispatchDate: 'desc' }, take: 50 }),
        ]);
        return {
          title: 'Date-wise University Communications Traffic Report',
          reportType: 'DATEWISE_COMMUNICATION',
          totalInwards: inwards.length,
          totalOutwards: outwards.length,
          generatedAt: new Date().toISOString(),
          inwards: inwards.map((i) => ({
            no: i.registerNo,
            date: i.receivedDate ? i.receivedDate.toISOString().slice(0, 10) : 'N/A',
            from: i.senderName,
            subject: i.subject,
            status: i.status,
          })),
          outwards: outwards.map((o) => ({
            no: o.dispatchNo,
            date: o.dispatchDate ? o.dispatchDate.toISOString().slice(0, 10) : 'N/A',
            to: o.receiverName,
            subject: o.subject,
            status: o.status,
          })),
        };
      }
    }
  }
}
