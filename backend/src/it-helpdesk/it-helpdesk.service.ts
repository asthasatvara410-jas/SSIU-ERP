import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TicketMessageRecord {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  messageType: 'USER_MESSAGE' | 'STAFF_RESPONSE' | 'INTERNAL_NOTE';
  attachmentUrl?: string;
  createdAt: string;
}

export interface TicketAuditRecord {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

const VALID_CATEGORIES = new Set([
  'ACADEMIC', 'ACADEMICS', 'HOSTEL', 'FEES', 'INFRASTRUCTURE', 'IT', 'EXAMINATION', 'LIBRARY',
  'TRANSPORT', 'TECHNICAL', 'PRINTER', 'INTERNET', 'WIFI', 'NETWORK', 'COMPUTER', 'SOFTWARE',
  'LOGIN', 'ERP', 'OTHER'
]);

const VALID_PRIORITIES = new Set(['URGENT', 'HIGH', 'NORMAL', 'MEDIUM', 'LOW']);
const VALID_STATUSES = new Set(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REOPENED']);

@Injectable()
export class ItHelpdeskService {
  private readonly logger = new Logger(ItHelpdeskService.name);
  private ticketMessages = new Map<string, TicketMessageRecord[]>();
  private ticketAudits = new Map<string, TicketAuditRecord[]>();

  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    let count = (await this.prisma.iTTicket.count()) + 1;
    let ticketNo = `${prefix}-${year}-${String(count).padStart(6, '0')}`;
    while (await this.prisma.iTTicket.findUnique({ where: { ticketNo } })) {
      count++;
      ticketNo = `${prefix}-${year}-${String(count).padStart(6, '0')}`;
    }
    return ticketNo;
  }

  // 1. Create Unified Multi-Category Ticket
  async createTicket(
    userId: string,
    category: string,
    title: string,
    description: string,
    priority: string = 'NORMAL',
    attachmentUrl?: string,
    departmentId?: string,
  ) {
    const catUpper = category ? category.trim().toUpperCase() : '';
    if (!VALID_CATEGORIES.has(catUpper)) {
      throw new BadRequestException(
        `Invalid ticket category '${category}'. Valid categories: ${Array.from(VALID_CATEGORIES).join(', ')}`
      );
    }

    let prioUpper = priority ? priority.trim().toUpperCase() : 'NORMAL';
    if (prioUpper === 'MEDIUM') prioUpper = 'NORMAL';
    if (!VALID_PRIORITIES.has(prioUpper)) {
      throw new BadRequestException(`Invalid ticket priority '${priority}'. Valid: URGENT, HIGH, NORMAL, LOW`);
    }

    if (!title || !title.trim()) {
      throw new BadRequestException('Ticket title is required.');
    }
    if (!description || !description.trim()) {
      throw new BadRequestException('Ticket description is required.');
    }

    const prefix = ['PRINTER', 'INTERNET', 'WIFI', 'NETWORK', 'COMPUTER', 'SOFTWARE', 'LOGIN', 'ERP'].includes(catUpper)
      ? 'IT'
      : 'HD';
    const ticketNo = await this.nextSeq(prefix);

    const ticket = await this.prisma.iTTicket.create({
      data: {
        ticketNo,
        userId,
        category: catUpper,
        priority: prioUpper,
        title: title.trim(),
        description: description.trim(),
        status: 'OPEN',
      },
      include: {
        user: { select: { id: true, erpId: true, username: true } },
      },
    });

    // Record initial thread message
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const initialMsg: TicketMessageRecord = {
      id: msgId,
      ticketId: ticket.id,
      authorId: userId,
      authorName: ticket.user.username || ticket.user.erpId || 'Creator',
      authorRole: 'CREATOR',
      message: description.trim(),
      messageType: 'USER_MESSAGE',
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };
    this.ticketMessages.set(ticket.id, [initialMsg]);

    this.logAudit(ticket.id, userId, ticket.user.username || userId, 'USER', 'TICKET_CREATED', `Ticket ${ticket.ticketNo} created in category ${catUpper}`);

    return {
      ...ticket,
      messages: [initialMsg],
      attachmentUrl,
    };
  }

  // 2. Query Paginated & Filtered Tickets with RBAC / Scope
  async getTickets(
    user?: any,
    category?: string,
    status?: string,
    my?: string,
    query?: any,
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(Number(query?.limit) || 20, 100));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category && category !== 'ALL') where.category = category.toUpperCase();
    if (status && status !== 'ALL') where.status = status.toUpperCase();

    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isStudent = userRoles.includes('STUDENT') || userRoles.includes('PARENT') || Boolean(user?.studentId);

    // Scope Enforcement:
    if (isStudent || my === 'true') {
      if (user?.id) where.userId = user.id;
    } else if (userRoles.includes('FACULTY') || userRoles.includes('STAFF')) {
      if (query?.assignedOnly === 'true') {
        where.assignedTo = user.id;
      }
    }

    if (query?.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { ticketNo: { contains: term, mode: 'insensitive' } },
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.iTTicket.count({ where }),
      this.prisma.iTTicket.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, erpId: true, username: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // 3. Get Ticket Details with IDOR & Internal Note Protection
  async getTicketById(id: string, user?: any) {
    const ticket = await this.prisma.iTTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, erpId: true, username: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isStudent = userRoles.includes('STUDENT') || userRoles.includes('PARENT') || Boolean(user?.studentId);
    const isStaffOrAdmin = userRoles.some((r: string) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'FACULTY', 'STAFF', 'HOD', 'PRINCIPAL'].includes(r)) || (!isStudent && userRoles.length > 0);

    // IDOR Check: Students can only view their own tickets
    if (isStudent && ticket.userId !== user.id) {
      throw new ForbiddenException('Access Denied: You are only authorized to access your OWN tickets.');
    }

    // Retrieve and filter messages
    const allMessages = this.ticketMessages.get(id) || [];

    // Defense-in-depth: Strip INTERNAL_NOTE for students / creators
    const visibleMessages = isStaffOrAdmin
      ? allMessages
      : allMessages.filter((m) => m.messageType !== 'INTERNAL_NOTE');

    const audits = this.ticketAudits.get(id) || [];

    return {
      ...ticket,
      messages: visibleMessages,
      auditTrail: isStaffOrAdmin ? audits : undefined,
    };
  }

  // 4. Add Threaded Message / Comment with Internal Note Support
  async addComment(
    ticketId: string,
    user: any,
    message: string,
    messageType: 'USER_MESSAGE' | 'STAFF_RESPONSE' | 'INTERNAL_NOTE' = 'USER_MESSAGE',
    attachmentUrl?: string,
  ) {
    const ticket = await this.prisma.iTTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    const isStudent = user.role === 'STUDENT' || user.role === 'PARENT';

    // IDOR check: Students cannot comment on someone else's ticket
    if (isStudent && ticket.userId !== user.id) {
      throw new ForbiddenException('Access Denied: Cannot post comment on another user\'s ticket.');
    }

    // Privilege check: Students cannot create internal notes
    if (isStudent && messageType === 'INTERNAL_NOTE') {
      throw new ForbiddenException('Access Denied: Students are not permitted to post internal administrative notes.');
    }

    if (!message || !message.trim()) {
      throw new BadRequestException('Message content cannot be empty.');
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const commentRecord: TicketMessageRecord = {
      id: msgId,
      ticketId,
      authorId: user.id,
      authorName: user.name || user.username || 'User',
      authorRole: user.role || 'USER',
      message: message.trim(),
      messageType,
      attachmentUrl,
      createdAt: new Date().toISOString(),
    };

    const currentMessages = this.ticketMessages.get(ticketId) || [];
    currentMessages.push(commentRecord);
    this.ticketMessages.set(ticketId, currentMessages);

    // Auto update status to IN_PROGRESS if staff responds to OPEN ticket
    if (!isStudent && ticket.status === 'OPEN') {
      await this.prisma.iTTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    this.logAudit(ticketId, user.id, user.username || user.id, user.role, 'COMMENT_ADDED', `Added ${messageType}`);

    return commentRecord;
  }

  // 5. Get Comments for a Ticket with Internal Note Stripping
  async getComments(ticketId: string, user: any) {
    const ticket = await this.prisma.iTTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    const isStudent = user.role === 'STUDENT' || user.role === 'PARENT';
    if (isStudent && ticket.userId !== user.id) {
      throw new ForbiddenException('Access Denied: Cannot view comments on another user\'s ticket.');
    }

    const all = this.ticketMessages.get(ticketId) || [];
    return isStudent ? all.filter((m) => m.messageType !== 'INTERNAL_NOTE') : all;
  }

  // 6. Assign Ticket to Staff / Technician with Scope & Authority Checks
  async assignTechnician(ticketId: string, user: any, assignedToUserId: string, remarks?: string) {
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Access Denied: Students cannot assign tickets.');
    }

    const ticket = await this.prisma.iTTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    const targetStaff = await this.prisma.user.findUnique({ where: { id: assignedToUserId } });
    if (!targetStaff) throw new NotFoundException('Assigned staff member not found.');

    const updated = await this.prisma.iTTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: assignedToUserId,
        status: 'ASSIGNED',
      },
      include: {
        user: { select: { id: true, erpId: true, username: true } },
      },
    });

    this.logAudit(ticketId, user.id, user.username || user.id, user.role, 'TICKET_ASSIGNED', `Assigned to ${targetStaff.username || targetStaff.erpId}. ${remarks || ''}`.trim());

    return updated;
  }

  // 7. Update Status with Lifecycle Validation
  async updateTicketStatus(
    ticketId: string,
    user: any,
    targetStatus: string,
    remarks?: string,
    resolution?: string,
  ) {
    const statusUpper = targetStatus ? targetStatus.trim().toUpperCase() : '';
    if (!VALID_STATUSES.has(statusUpper)) {
      throw new BadRequestException(`Invalid ticket status '${targetStatus}'. Valid: ${Array.from(VALID_STATUSES).join(', ')}`);
    }

    const ticket = await this.prisma.iTTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    const isStudent = user.role === 'STUDENT' || user.role === 'PARENT';

    // IDOR Check
    if (isStudent && ticket.userId !== user.id) {
      throw new ForbiddenException('Access Denied: Cannot update another user\'s ticket.');
    }

    // Student transition limits: Students can only CLOSE or REOPEN their own ticket
    if (isStudent && !['CLOSED', 'REOPENED'].includes(statusUpper)) {
      throw new ForbiddenException(`Access Denied: Students are not permitted to change status to '${statusUpper}'.`);
    }

    const updateData: any = { status: statusUpper };
    if (statusUpper === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      if (resolution) updateData.resolution = resolution.trim();
    } else if (statusUpper === 'REOPENED') {
      updateData.resolvedAt = null;
    }

    const updated = await this.prisma.iTTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: { select: { id: true, erpId: true, username: true } },
      },
    });

    this.logAudit(ticketId, user.id, user.username || user.id, user.role, 'STATUS_CHANGED', `Status changed to ${statusUpper}. ${remarks || ''}`.trim());

    return updated;
  }

  // 8. Resolve Ticket
  async resolveTicket(id: string, user: any, resolution: string) {
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Access Denied: Students cannot resolve tickets.');
    }
    return this.updateTicketStatus(id, user, 'RESOLVED', undefined, resolution);
  }

  // 9. Close Ticket
  async closeTicket(id: string, user: any, remarks?: string) {
    return this.updateTicketStatus(id, user, 'CLOSED', remarks);
  }

  // 10. Reopen Ticket
  async reopenTicket(id: string, user: any, remarks?: string) {
    const ticket = await this.prisma.iTTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found.');

    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException(`Only RESOLVED or CLOSED tickets can be reopened. Current status: ${ticket.status}`);
    }

    return this.updateTicketStatus(id, user, 'REOPENED', remarks);
  }

  private logAudit(ticketId: string, actorId: string, actorName: string, actorRole: string, action: string, details: string) {
    const entry: TicketAuditRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      actorId,
      actorName,
      actorRole,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    const current = this.ticketAudits.get(ticketId) || [];
    current.push(entry);
    this.ticketAudits.set(ticketId, current);
  }
}
