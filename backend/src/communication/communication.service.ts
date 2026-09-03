import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Generate unique reference numbers
  private generateRefNo(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── 1. Communication Types ──────────────────────────────────────────────────

  async getCommunicationTypes() {
    let types = await this.prisma.communicationType.findMany({ where: { status: 'ACTIVE' } });
    if (types.length === 0) {
      // Seed default types if empty
      const defaultTypes = [
        { code: 'OFFICIAL_LETTER', name: 'Official Letter' },
        { code: 'CIRCULAR', name: 'Circular' },
        { code: 'NOTICE', name: 'Notice' },
        { code: 'OFFICE_ORDER', name: 'Office Order' },
        { code: 'MEMO', name: 'Memo' },
        { code: 'INVITATION', name: 'Invitation' },
        { code: 'APPOINTMENT_LETTER', name: 'Appointment Letter' },
        { code: 'PERMISSION_LETTER', name: 'Permission Letter' },
        { code: 'APPROVAL_LETTER', name: 'Approval Letter' },
        { code: 'WARNING_LETTER', name: 'Warning Letter' },
        { code: 'CERTIFICATE', name: 'Certificate' },
        { code: 'REPLY_LETTER', name: 'Reply Letter' },
        { code: 'REQUEST_LETTER', name: 'Request Letter' },
        { code: 'INTERNAL', name: 'Internal Communication' },
      ];
      for (const t of defaultTypes) {
        await this.prisma.communicationType.upsert({
          where: { code: t.code },
          create: t,
          update: {},
        });
      }
      types = await this.prisma.communicationType.findMany({ where: { status: 'ACTIVE' } });
    }
    return types;
  }

  async createCommunicationType(data: { code: string; name: string; description?: string }) {
    return this.prisma.communicationType.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        status: 'ACTIVE',
      },
    });
  }

  // ── 2. Inward & Outward Communication Registration ───────────────────────

  async registerInwardCommunication(creatorUserId: string, data: {
    subject: string;
    communicationTypeCode: string;
    senderName: string;
    senderOrganization?: string;
    senderEmail?: string;
    receivedThrough?: string;
    receivedDate?: string;
    priority?: string;
    instituteId?: string;
    departmentId?: string;
    assignedUserId?: string;
    dueDate?: string;
    remarks?: string;
    documentUrl?: string;
  }) {
    const commType = await this.prisma.communicationType.findFirst({
      where: { OR: [{ code: data.communicationTypeCode.toUpperCase() }, { id: data.communicationTypeCode }] },
    });
    if (!commType) throw new NotFoundException('Communication Type not found.');

    const refNo = this.generateRefNo('COMM');
    const inwNo = this.generateRefNo('INW');

    return this.prisma.$transaction(async (tx) => {
      const comm = await tx.communication.create({
        data: {
          referenceNo: refNo,
          inwardNo: inwNo,
          direction: 'INWARD',
          communicationTypeId: commType.id,
          subject: data.subject,
          priority: data.priority || 'NORMAL',
          status: data.assignedUserId ? 'ASSIGNED' : 'RECEIVED',
          senderName: data.senderName,
          senderOrganization: data.senderOrganization,
          senderEmail: data.senderEmail,
          receivedThrough: data.receivedThrough || 'POST',
          receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          creatorUserId,
          assignedUserId: data.assignedUserId,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          remarks: data.remarks,
          documentUrl: data.documentUrl,
        },
      });

      // Track movement history
      await tx.communicationMovement.create({
        data: {
          communicationId: comm.id,
          movedByUserId: creatorUserId,
          fromOffice: 'EXTERNAL_SENDER',
          toOffice: data.departmentId || 'UNIVERSITY_DESK',
          actionTaken: 'REGISTERED',
          remarks: `Inward registered via ${data.receivedThrough || 'POST'}`,
        },
      });

      return comm;
    });
  }

  async createOutwardCommunication(creatorUserId: string, data: {
    subject: string;
    content?: string;
    communicationTypeCode: string;
    priority?: string;
    recipientName: string;
    recipientEmail?: string;
    instituteId?: string;
    departmentId?: string;
    remarks?: string;
    documentUrl?: string;
  }) {
    const commType = await this.prisma.communicationType.findFirst({
      where: { OR: [{ code: data.communicationTypeCode.toUpperCase() }, { id: data.communicationTypeCode }] },
    });
    if (!commType) throw new NotFoundException('Communication Type not found.');

    const refNo = this.generateRefNo('COMM');
    const outNo = this.generateRefNo('OUT');

    return this.prisma.$transaction(async (tx) => {
      const comm = await tx.communication.create({
        data: {
          referenceNo: refNo,
          outwardNo: outNo,
          direction: 'OUTWARD',
          communicationTypeId: commType.id,
          subject: data.subject,
          content: data.content,
          priority: data.priority || 'NORMAL',
          status: 'DRAFT',
          instituteId: data.instituteId,
          departmentId: data.departmentId,
          creatorUserId,
          remarks: data.remarks,
          documentUrl: data.documentUrl,
          recipients: {
            create: [
              {
                recipientType: 'TO',
                recipientName: data.recipientName,
                recipientEmail: data.recipientEmail,
              },
            ],
          },
        },
        include: { recipients: true },
      });

      await tx.communicationMovement.create({
        data: {
          communicationId: comm.id,
          movedByUserId: creatorUserId,
          fromOffice: data.departmentId || 'CREATOR_DESK',
          toOffice: 'APPROVAL_DESK',
          actionTaken: 'CREATED',
          remarks: 'Outward draft created',
        },
      });

      return comm;
    });
  }

  // ── 3. Communication Movement & Forwarding ──────────────────────────────────

  async forwardCommunication(userId: string, id: string, toOffice: string, remarks?: string, newAssignedUserId?: string) {
    const comm = await this.prisma.communication.findUnique({ where: { id } });
    if (!comm) throw new NotFoundException('Communication record not found.');

    return this.prisma.$transaction(async (tx) => {
      await tx.communicationMovement.create({
        data: {
          communicationId: id,
          movedByUserId: userId,
          fromOffice: comm.departmentId || 'CURRENT_DESK',
          toOffice,
          actionTaken: 'FORWARDED',
          remarks,
        },
      });

      return tx.communication.update({
        where: { id },
        data: {
          status: 'FORWARDED',
          ...(newAssignedUserId ? { assignedUserId: newAssignedUserId } : {}),
        },
      });
    });
  }

  // ── 4. Task & Meeting Spawning ──────────────────────────────────────────────

  async createTaskFromCommunication(userId: string, communicationId: string, title: string, dueDate: string, assignedToUserId?: string) {
    const comm = await this.prisma.communication.findUnique({ where: { id: communicationId } });
    if (!comm) throw new NotFoundException('Communication not found.');

    const task = await this.prisma.workTask.create({
      data: {
        userId,
        title: `Task from Ref ${comm.referenceNo}: ${title}`,
        description: comm.subject,
        priority: comm.priority,
        dueDate: new Date(dueDate),
        status: 'TODO',
        assignedByUserId: userId,
        assignedToUserId: assignedToUserId || userId,
        relatedModule: 'COMMUNICATION',
        relatedRecord: comm.referenceNo,
      },
    });

    await this.prisma.communication.update({
      where: { id: communicationId },
      data: { status: 'IN_PROCESS' },
    });

    return task;
  }

  async scheduleMeetingFromCommunication(userId: string, communicationId: string, data: {
    title: string;
    meetingDate: string;
    startTime: string;
    endTime: string;
    location?: string;
  }) {
    const comm = await this.prisma.communication.findUnique({ where: { id: communicationId } });
    if (!comm) throw new NotFoundException('Communication not found.');

    return this.prisma.personalMeeting.create({
      data: {
        organizerUserId: userId,
        title: `Meeting for Ref ${comm.referenceNo}: ${data.title}`,
        meetingDate: new Date(data.meetingDate),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        agenda: comm.subject,
        status: 'SCHEDULED',
      },
    });
  }

  // ── 5. Dispatch Management ─────────────────────────────────────────────────

  async createDispatchRecord(userId: string, data: {
    communicationId: string;
    recipientName: string;
    recipientAddress?: string;
    dispatchMethod?: string;
    trackingNo?: string;
    courierAgency?: string;
    remarks?: string;
  }) {
    const comm = await this.prisma.communication.findUnique({ where: { id: data.communicationId } });
    if (!comm) throw new NotFoundException('Communication record not found.');

    const dispatchNo = this.generateRefNo('DSP');

    return this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatchRecord.create({
        data: {
          communicationId: data.communicationId,
          dispatchNo,
          recipientName: data.recipientName,
          recipientAddress: data.recipientAddress,
          dispatchMethod: data.dispatchMethod || 'COURIER',
          trackingNo: data.trackingNo,
          courierAgency: data.courierAgency,
          deliveryStatus: 'DISPATCHED',
          remarks: data.remarks,
        },
      });

      await tx.communication.update({
        where: { id: data.communicationId },
        data: { status: 'SENT' },
      });

      return dispatch;
    });
  }

  async getDispatchRecords() {
    return this.prisma.dispatchRecord.findMany({
      include: { communication: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 6. Query Communications ─────────────────────────────────────────────────

  async getCommunications(userId: string, folder?: string, search?: string) {
    const folderUpper = folder ? folder.toUpperCase() : 'INBOX';

    return this.prisma.communication.findMany({
      where: {
        ...(folderUpper === 'INBOX' ? { OR: [{ assignedUserId: userId }, { recipients: { some: { recipientUserId: userId } } }] } : {}),
        ...(folderUpper === 'OUTBOX' || folderUpper === 'SENT' ? { creatorUserId: userId } : {}),
        ...(folderUpper === 'DRAFTS' ? { creatorUserId: userId, status: 'DRAFT' } : {}),
        ...(folderUpper === 'PENDING' ? { status: 'APPROVAL_PENDING' } : {}),
        ...(folderUpper === 'ARCHIVE' ? { status: 'ARCHIVED' } : {}),
        ...(search
          ? {
              OR: [
                { referenceNo: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { senderName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { communicationType: true, recipients: true, dispatchRecords: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCommunicationById(id: string) {
    const comm = await this.prisma.communication.findUnique({
      where: { id },
      include: {
        communicationType: true,
        creator: { select: { id: true, username: true, erpId: true } },
        recipients: true,
        assignments: true,
        movements: true,
        approvals: true,
        dispatchRecords: true,
      },
    });
    if (!comm) throw new NotFoundException('Communication not found.');
    return comm;
  }
}
