import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteSheetDto } from './dto/create-notesheet.dto';
import { UpdateNoteSheetDto } from './dto/update-notesheet.dto';
import {
  SubmitNoteSheetDto,
  ApproveNoteSheetDto,
  RejectNoteSheetDto,
  ReturnNoteSheetDto,
  CloseNoteSheetDto,
} from './dto/notesheet-action.dto';
import { NoteSheetQueryDto } from './dto/notesheet-query.dto';
import { AddNoteSheetAttachmentDto } from './dto/add-attachment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NoteSheetService {
  private readonly logger = new Logger(NoteSheetService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DEPARTMENT & ROLE ACCESS HELPER
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Determine the department code corresponding to a user's role/context.
   */
  resolveUserDepartment(user: any): string {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);

    if (roles.includes('EXAM_CELL') || roles.includes('EXAM_CONTROLLER') || roles.includes('CONTROLLER_OF_EXAMINATION')) return 'EXAM';
    if (roles.includes('HOSTEL_ADMIN')) return 'HOSTEL';
    if (roles.includes('ACCOUNT_OFFICER') || roles.includes('ACCOUNTS_ADMIN') || roles.includes('FINANCE')) return 'ACCOUNTS';
    if (roles.includes('LIBRARY_ADMIN')) return 'LIBRARY';
    if (roles.includes('TRANSPORT_ADMIN')) return 'TRANSPORT';
    if (roles.includes('STUDENT_SECTION')) return 'STUDENT_SECTION';
    if (roles.includes('MAINTENANCE_ADMIN')) return 'MAINTENANCE';
    if (roles.includes('IQAC')) return 'IQAC';
    if (roles.includes('REGISTRAR')) return 'REGISTRAR';

    // Faculty / HOD academic department
    if (user?.faculty?.department?.code) return user.faculty.department.code.toUpperCase();
    if (user?.departmentCode) return user.departmentCode.toUpperCase();
    if (user?.department) return user.department.toUpperCase();

    return 'ADMIN';
  }

  /**
   * Check if user has global university-wide access across all departments.
   */
  hasUniversityWideAccess(user: any): boolean {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    return roles.some((r) =>
      ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'VICE_PRESIDENT', 'PRINCIPAL'].includes(r),
    );
  }

  /**
   * Validate that the user is authorized to view or mutate a notesheet in a specific department.
   */
  validateDepartmentAccess(user: any, targetDepartment: string): void {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);

    // Students have NO access to Notesheet system
    if (roles.includes('STUDENT') && !this.hasUniversityWideAccess(user)) {
      throw new ForbiddenException('Students are not authorized to access the University Notesheet System.');
    }

    // University Admin / Super Admin / Registrar have full access
    if (this.hasUniversityWideAccess(user)) {
      return;
    }

    const userDept = this.resolveUserDepartment(user);
    const targetDeptNorm = targetDepartment.trim().toUpperCase();

    if (userDept !== targetDeptNorm) {
      throw new ForbiddenException(
        `Department Access Denied: Your role (${roles.join(', ')}) is scoped to department '${userDept}', and cannot access '${targetDeptNorm}' Notesheets.`,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SEQUENTIAL NUMBER GENERATOR
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generates a unique, sequential department-aware notesheet number.
   * Format: NS/{DEPT}/{YEAR}/{SEQUENTIAL_4_DIGITS}
   * e.g., NS/EXAM/2026/0001, NS/HOSTEL/2026/0002
   */
  async generateNotesheetNumber(department: string): Promise<string> {
    const deptNorm = department.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const year = new Date().getFullYear();
    const prefix = `NS/${deptNorm}/${year}/`;

    const count = await this.prisma.noteSheet.count({
      where: {
        notesheetNumber: { startsWith: prefix },
      },
    });

    let seq = count + 1;
    let number = `${prefix}${seq.toString().padStart(4, '0')}`;

    // Collison check
    let exists = await this.prisma.noteSheet.findUnique({ where: { notesheetNumber: number } });
    while (exists) {
      seq++;
      number = `${prefix}${seq.toString().padStart(4, '0')}`;
      exists = await this.prisma.noteSheet.findUnique({ where: { notesheetNumber: number } });
    }

    return number;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CREATE NOTESHEET
  // ──────────────────────────────────────────────────────────────────────────

  async createNoteSheet(dto: CreateNoteSheetDto, user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    if (roles.includes('STUDENT') && !this.hasUniversityWideAccess(user)) {
      throw new ForbiddenException('Students are not authorized to create Notesheets.');
    }

    const targetDept = (dto.department || this.resolveUserDepartment(user)).trim().toUpperCase();

    // Verify creator has permission for this department
    this.validateDepartmentAccess(user, targetDept);

    const notesheetNumber = await this.generateNotesheetNumber(targetDept);
    const isDraft = Boolean(dto.isDraft);

    // Initial workflow office routing based on department
    let initialOffice = 'CREATOR';
    if (!isDraft) {
      if (['EXAM', 'HOSTEL', 'ACCOUNTS', 'TRANSPORT', 'LIBRARY', 'STUDENT_SECTION', 'MAINTENANCE', 'IQAC'].includes(targetDept)) {
        initialOffice = 'REGISTRAR';
      } else {
        initialOffice = 'HOD';
      }
    }

    const title = dto.title.trim();
    const subject = (dto.subject || dto.title).trim();
    const priority = (dto.priority || 'MEDIUM').toUpperCase();

    const estimatedCost = dto.estimatedCost != null ? new Prisma.Decimal(dto.estimatedCost) : new Prisma.Decimal(0);

    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.noteSheet.create({
        data: {
          notesheetNumber,
          title,
          subject,
          department: targetDept,
          section: dto.section?.trim() || null,
          referenceNumber: dto.referenceNumber?.trim() || null,
          priority,
          description: dto.description?.trim() || null,
          proposal: dto.proposal.trim(),
          purposeJustification: dto.purposeJustification.trim(),
          budgetRequired: dto.budgetRequired ?? false,
          estimatedCost,
          amountInWords: dto.amountInWords?.trim() || null,
          financialImpact: dto.financialImpact?.trim() || null,
          vendorQuotation: dto.vendorQuotation?.trim() || null,
          requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : null,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          currentOffice: initialOffice,
          createdByUserId: user.id,
          createdByName: user.username || user.name || 'User',
          createdByRole: roles[0] || 'USER',
          contactNumber: dto.contactNumber || user.phone || null,
          instituteId: dto.instituteId || user.instituteId || null,
          departmentId: dto.departmentId || user.departmentId || null,
          version: 1,
          items: dto.items && dto.items.length > 0
            ? {
                create: dto.items.map((item, idx) => ({
                  itemName: item.itemName.trim(),
                  description: item.description?.trim() || null,
                  quantity: new Prisma.Decimal(item.quantity),
                  unit: item.unit || 'Nos',
                  rate: new Prisma.Decimal(item.rate),
                  amount: new Prisma.Decimal(item.amount ?? (item.quantity * item.rate)),
                  sequence: idx + 1,
                })),
              }
            : undefined,
          attachments: dto.attachments && dto.attachments.length > 0
            ? {
                create: dto.attachments.map((att) => ({
                  fileName: att.fileName.trim(),
                  fileType: att.fileType.toUpperCase(),
                  fileSize: att.fileSize || 0,
                  fileUrl: att.fileUrl.trim(),
                  uploadedByUserId: user.id,
                  uploadedByName: user.username || user.name || 'User',
                })),
              }
            : undefined,
        },
        include: {
          items: true,
          attachments: true,
        },
      });

      // Write initial history
      await tx.noteSheetHistory.create({
        data: {
          notesheetId: created.id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'User',
          fromUserRole: roles[0] || 'USER',
          toOffice: isDraft ? 'CREATOR' : initialOffice,
          action: isDraft ? 'CREATED' : 'SUBMITTED',
          remarks: isDraft ? 'Draft Notesheet saved.' : `Submitted for review to ${initialOffice}.`,
        },
      });

      return created;
    });

    this.logger.log(`Notesheet '${result.notesheetNumber}' created in department '${targetDept}' by ${user.username} (Draft: ${isDraft})`);
    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. GET NOTESHEETS (WITH RBAC & FILTERS)
  // ──────────────────────────────────────────────────────────────────────────

  async getNoteSheets(query: NoteSheetQueryDto, user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    if (roles.includes('STUDENT') && !this.hasUniversityWideAccess(user)) {
      throw new ForbiddenException('Students are not authorized to view Notesheets.');
    }

    const where: Prisma.NoteSheetWhereInput = {};

    // Apply department scoping if not university-wide
    if (!this.hasUniversityWideAccess(user)) {
      const userDept = this.resolveUserDepartment(user);
      where.department = userDept;
    } else if (query.department) {
      where.department = query.department.trim().toUpperCase();
    }

    if (query.section) where.section = { contains: query.section, mode: 'insensitive' };
    if (query.status) where.status = query.status.trim().toUpperCase();
    if (query.priority) where.priority = query.priority.trim().toUpperCase();
    if (query.currentOffice) where.currentOffice = query.currentOffice.trim().toUpperCase();
    if (query.createdByUserId) where.createdByUserId = query.createdByUserId;

    if (query.isPendingWithMe) {
      where.status = { notIn: ['DRAFT', 'APPROVED', 'CLOSED', 'REJECTED', 'CANCELLED'] };
      const mainRole = roles[0] || '';
      if (!this.hasUniversityWideAccess(user) && mainRole !== 'SUPER_ADMIN') {
        where.currentOffice = mainRole;
      }
    }

    if (query.fromDate || query.toDate) {
      where.date = {};
      if (query.fromDate) where.date.gte = new Date(query.fromDate);
      if (query.toDate) where.date.lte = new Date(query.toDate);
    }

    if (query.search) {
      where.OR = [
        { notesheetNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { proposal: { contains: query.search, mode: 'insensitive' } },
        { createdByName: { contains: query.search, mode: 'insensitive' } },
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [total, notesheets] = await Promise.all([
      this.prisma.noteSheet.count({ where }),
      this.prisma.noteSheet.findMany({
        where,
        include: {
          items: true,
          attachments: true,
          history: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notesheets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4b. GET PENDING WITH ME (RBAC & JURISDICTION ENFORCED)
  // ──────────────────────────────────────────────────────────────────────────

  async getPendingWithMe(queryOrUser: NoteSheetQueryDto | any, possibleUser?: any) {
    const user = possibleUser || queryOrUser;
    const query: NoteSheetQueryDto | undefined = possibleUser ? queryOrUser : undefined;

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    if (roles.includes('STUDENT')) {
      throw new ForbiddenException('Students are not authorized to view Pending Notesheets.');
    }

    const workflowRoles = [
      'HOD', 'PRINCIPAL', 'REGISTRAR', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN',
      'ACCOUNTS_ADMIN', 'EXAM_CELL', 'HOSTEL_ADMIN', 'STUDENT_SECTION', 'IQAC'
    ];
    const hasWorkflowRole = roles.some(r => workflowRoles.includes(r)) || this.hasUniversityWideAccess(user);
    if (!hasWorkflowRole) {
      throw new ForbiddenException('403 Forbidden: You do not have workflow review/approval permissions.');
    }

    const mergedQuery: NoteSheetQueryDto = {
      ...(query || {}),
      isPendingWithMe: true,
    };
    return this.getNoteSheets(mergedQuery, user);
  }

  async getPendingWithMeCount(queryOrUser: NoteSheetQueryDto | any, possibleUser?: any) {
    const result = await this.getPendingWithMe(queryOrUser, possibleUser);
    return { count: result.meta.total };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. GET NOTESHEET BY ID
  // ──────────────────────────────────────────────────────────────────────────

  async getNoteSheetById(id: string, user: any) {
    const notesheet = await this.prisma.noteSheet.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sequence: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!notesheet) {
      throw new NotFoundException(`Notesheet '${id}' was not found.`);
    }

    this.validateDepartmentAccess(user, notesheet.department);
    return notesheet;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. UPDATE NOTESHEET (EDIT DRAFT / RETURNED)
  // ──────────────────────────────────────────────────────────────────────────

  async updateNoteSheet(id: string, dto: UpdateNoteSheetDto, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status !== 'DRAFT' && notesheet.status !== 'RETURNED') {
      throw new BadRequestException(`Cannot edit Notesheet in '${notesheet.status}' status. Only DRAFT or RETURNED notesheets can be modified.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isCreator = notesheet.createdByUserId === user.id;

    if (!isCreator && !this.hasUniversityWideAccess(user)) {
      throw new ForbiddenException('Only the Notesheet creator or University Admin can edit this draft.');
    }

    const data: Prisma.NoteSheetUpdateInput = {};
    if (dto.title) data.title = dto.title.trim();
    if (dto.subject || dto.title) data.subject = (dto.subject || dto.title)!.trim();
    if (dto.section !== undefined) data.section = dto.section?.trim() || null;
    if (dto.referenceNumber !== undefined) data.referenceNumber = dto.referenceNumber?.trim() || null;
    if (dto.priority) data.priority = dto.priority.toUpperCase();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.proposal) data.proposal = dto.proposal.trim();
    if (dto.purposeJustification) data.purposeJustification = dto.purposeJustification.trim();
    if (dto.budgetRequired !== undefined) data.budgetRequired = dto.budgetRequired;
    if (dto.estimatedCost != null) data.estimatedCost = new Prisma.Decimal(dto.estimatedCost);
    if (dto.amountInWords !== undefined) data.amountInWords = dto.amountInWords?.trim() || null;
    if (dto.financialImpact !== undefined) data.financialImpact = dto.financialImpact?.trim() || null;
    if (dto.vendorQuotation !== undefined) data.vendorQuotation = dto.vendorQuotation?.trim() || null;
    if (dto.requiredDate !== undefined) data.requiredDate = dto.requiredDate ? new Date(dto.requiredDate) : null;
    if (dto.contactNumber !== undefined) data.contactNumber = dto.contactNumber;

    return this.prisma.$transaction(async (tx) => {
      // Re-create items if provided
      if (dto.items) {
        await tx.noteSheetEstimateItem.deleteMany({ where: { notesheetId: id } });
        if (dto.items.length > 0) {
          await tx.noteSheetEstimateItem.createMany({
            data: dto.items.map((item, idx) => ({
              notesheetId: id,
              itemName: item.itemName.trim(),
              description: item.description?.trim() || null,
              quantity: new Prisma.Decimal(item.quantity),
              unit: item.unit || 'Nos',
              rate: new Prisma.Decimal(item.rate),
              amount: new Prisma.Decimal(item.amount ?? (item.quantity * item.rate)),
              sequence: idx + 1,
            })),
          });
        }
      }

      const updated = await tx.noteSheet.update({
        where: { id },
        data,
        include: { items: true, attachments: true },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'User',
          fromUserRole: roles[0] || 'USER',
          toOffice: notesheet.currentOffice,
          action: 'EDITED',
          remarks: 'Notesheet proposal details updated.',
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SUBMIT NOTESHEET
  // ──────────────────────────────────────────────────────────────────────────

  async submitNoteSheet(id: string, dto: SubmitNoteSheetDto, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status !== 'DRAFT' && notesheet.status !== 'RETURNED') {
      throw new BadRequestException(`Cannot submit Notesheet with status '${notesheet.status}'.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isCreator = notesheet.createdByUserId === user.id;

    if (!isCreator && !this.hasUniversityWideAccess(user)) {
      throw new ForbiddenException('Only the Notesheet creator can submit it.');
    }

    let targetOffice = dto.forwardToOffice || 'REGISTRAR';
    if (['EXAM', 'HOSTEL', 'ACCOUNTS', 'TRANSPORT', 'LIBRARY', 'STUDENT_SECTION', 'MAINTENANCE', 'IQAC'].includes(notesheet.department)) {
      targetOffice = dto.forwardToOffice || 'REGISTRAR';
    } else {
      targetOffice = dto.forwardToOffice || 'HOD';
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.noteSheet.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          currentOffice: targetOffice,
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'User',
          fromUserRole: roles[0] || 'USER',
          toOffice: targetOffice,
          action: 'SUBMITTED',
          remarks: dto.remarks || `Submitted to ${targetOffice} for review.`,
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. APPROVE NOTESHEET
  // ──────────────────────────────────────────────────────────────────────────

  async approveNoteSheet(id: string, dto: ApproveNoteSheetDto, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status === 'APPROVED' || notesheet.status === 'CLOSED' || notesheet.status === 'REJECTED') {
      throw new BadRequestException(`Cannot approve Notesheet already in '${notesheet.status}' status.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isFinalApproval = !dto.forwardToOffice || dto.forwardToOffice === 'COMPLETED';

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.noteSheet.update({
        where: { id },
        data: {
          status: isFinalApproval ? 'APPROVED' : 'UNDER_REVIEW',
          currentOffice: isFinalApproval ? 'COMPLETED' : dto.forwardToOffice,
          decision: isFinalApproval ? 'APPROVED' : undefined,
          decisionDate: isFinalApproval ? now : undefined,
          approvedByUserId: user.id,
          approvedByName: user.username || user.name || 'Approver',
          approvedAt: now,
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'Approver',
          fromUserRole: roles[0] || 'OFFICER',
          toOffice: isFinalApproval ? 'COMPLETED' : dto.forwardToOffice!,
          action: isFinalApproval ? 'APPROVED' : 'FORWARDED',
          remarks: dto.remarks || (isFinalApproval ? 'Sanctioned and Approved.' : `Forwarded to ${dto.forwardToOffice}`),
          attachmentUrl: dto.attachmentUrl || null,
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 9. REJECT NOTESHEET (MANDATORY REASON)
  // ──────────────────────────────────────────────────────────────────────────

  async rejectNoteSheet(id: string, dto: RejectNoteSheetDto, user: any) {
    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('Rejection reason is mandatory.');
    }

    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status === 'REJECTED' || notesheet.status === 'CLOSED') {
      throw new BadRequestException(`Notesheet is already '${notesheet.status}'.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.noteSheet.update({
        where: { id },
        data: {
          status: 'REJECTED',
          currentOffice: 'CREATOR',
          decision: 'REJECTED',
          decisionDate: now,
          decisionReason: dto.reason.trim(),
          rejectedByUserId: user.id,
          rejectedByName: user.username || user.name || 'Reviewer',
          rejectedAt: now,
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'Reviewer',
          fromUserRole: roles[0] || 'OFFICER',
          toOffice: 'CREATOR',
          action: 'REJECTED',
          remarks: dto.reason.trim(),
          attachmentUrl: dto.attachmentUrl || null,
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 10. RETURN NOTESHEET (MANDATORY REASON)
  // ──────────────────────────────────────────────────────────────────────────

  async returnNoteSheet(id: string, dto: ReturnNoteSheetDto, user: any) {
    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('Return reason is mandatory.');
    }

    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status === 'RETURNED' || notesheet.status === 'CLOSED' || notesheet.status === 'REJECTED') {
      throw new BadRequestException(`Cannot return Notesheet in '${notesheet.status}' status.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const now = new Date();
    const returnTarget = dto.returnToOffice || 'CREATOR';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.noteSheet.update({
        where: { id },
        data: {
          status: 'RETURNED',
          currentOffice: returnTarget,
          decision: 'RETURNED',
          decisionDate: now,
          decisionReason: dto.reason.trim(),
          returnedByUserId: user.id,
          returnedByName: user.username || user.name || 'Reviewer',
          returnedAt: now,
          version: notesheet.version + 1,
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'Reviewer',
          fromUserRole: roles[0] || 'OFFICER',
          toOffice: returnTarget,
          action: 'RETURNED',
          remarks: dto.reason.trim(),
          attachmentUrl: dto.attachmentUrl || null,
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 11. CLOSE NOTESHEET
  // ──────────────────────────────────────────────────────────────────────────

  async closeNoteSheet(id: string, dto: CloseNoteSheetDto, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);

    if (notesheet.status !== 'APPROVED') {
      throw new BadRequestException(`Only APPROVED Notesheets can be CLOSED. Current status: '${notesheet.status}'.`);
    }

    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.noteSheet.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedByUserId: user.id,
          closedByName: user.username || user.name || 'Closer',
          closedAt: now,
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'Closer',
          fromUserRole: roles[0] || 'OFFICER',
          toOffice: 'CLOSED',
          action: 'CLOSED',
          remarks: dto.remarks || 'Notesheet requirements completed and archived.',
        },
      });

      return updated;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 12. GET NOTESHEET HISTORY
  // ──────────────────────────────────────────────────────────────────────────

  async getNoteSheetHistory(id: string, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);
    return this.prisma.noteSheetHistory.findMany({
      where: { notesheetId: notesheet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 13. ADD ATTACHMENT
  // ──────────────────────────────────────────────────────────────────────────

  async addAttachment(id: string, dto: AddNoteSheetAttachmentDto, user: any) {
    const notesheet = await this.getNoteSheetById(id, user);
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);

    const allowedTypes = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'JPG', 'JPEG', 'PNG'];
    const fileTypeNorm = dto.fileType.trim().toUpperCase();

    if (!allowedTypes.includes(fileTypeNorm)) {
      throw new BadRequestException(`Invalid file type '${dto.fileType}'. Allowed types: ${allowedTypes.join(', ')}.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.noteSheetAttachment.create({
        data: {
          notesheetId: notesheet.id,
          fileName: dto.fileName.trim(),
          fileType: fileTypeNorm,
          fileSize: dto.fileSize || 0,
          fileUrl: dto.fileUrl.trim(),
          documentCategory: dto.documentCategory ? dto.documentCategory.trim() : null,
          uploadedByUserId: user.id,
          uploadedByName: user.username || user.name || 'User',
        },
      });

      await tx.noteSheetHistory.create({
        data: {
          notesheetId: notesheet.id,
          fromUserId: user.id,
          fromUserName: user.username || user.name || 'User',
          fromUserRole: roles[0] || 'USER',
          toOffice: notesheet.currentOffice,
          action: 'ATTACHMENT_ADDED',
          remarks: `Uploaded document: ${dto.fileName} (${fileTypeNorm})`,
          attachmentUrl: dto.fileUrl.trim(),
        },
      });

      return attachment;
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 14. DASHBOARD STATISTICS & ROLE-BASED PENDING COUNTS
  // ──────────────────────────────────────────────────────────────────────────

  async getDashboardStats(user: any) {
    const roles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isGlobal = this.hasUniversityWideAccess(user);
    const userDept = this.resolveUserDepartment(user);

    // Department base filter
    const baseWhere: Prisma.NoteSheetWhereInput = isGlobal ? {} : { department: userDept };

    const [total, approved, rejected, returned, pendingWithMe, financial, overdue] = await Promise.all([
      this.prisma.noteSheet.count({ where: baseWhere }),
      this.prisma.noteSheet.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      this.prisma.noteSheet.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      this.prisma.noteSheet.count({ where: { ...baseWhere, status: 'RETURNED' } }),
      this.prisma.noteSheet.count({
        where: {
          ...baseWhere,
          status: { in: ['SUBMITTED', 'PENDING_APPROVAL', 'UNDER_REVIEW', 'FORWARDED'] },
          OR: [
            { currentHandlerId: user.id },
            { currentOffice: { in: roles } },
          ],
        },
      }),
      this.prisma.noteSheet.count({
        where: {
          ...baseWhere,
          requestedAmount: { gt: 0 },
        },
      }),
      this.prisma.noteSheet.count({
        where: {
          ...baseWhere,
          isOverdue: true,
        },
      }),
    ]);

    return {
      total,
      approved,
      rejected,
      returned,
      pendingWithMe,
      financial,
      overdue,
      department: isGlobal ? 'ALL' : userDept,
      generatedAt: new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 15. PUBLIC QR CODE VERIFICATION
  // ──────────────────────────────────────────────────────────────────────────

  async verifyNotesheet(tokenOrId: string) {
    const trimmed = (tokenOrId || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Verification token or Notesheet number is required.');
    }

    const notesheet = await this.prisma.noteSheet.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { notesheetNumber: trimmed },
        ],
      },
      select: {
        id: true,
        notesheetNumber: true,
        date: true,
        subject: true,
        department: true,
        departmentName: true,
        status: true,
        currentOffice: true,
        decision: true,
        decisionDate: true,
        approvedByName: true,
        approvedAt: true,
        approvedAmount: true,
        version: true,
      },
    });

    if (!notesheet) {
      return {
        verified: false,
        status: 'INVALID_DOCUMENT',
        message: 'No official university notesheet record matches the provided verification token.',
      };
    }

    return {
      verified: true,
      status: 'VERIFIED_AUTHENTIC',
      notesheetNumber: notesheet.notesheetNumber,
      subject: notesheet.subject,
      department: notesheet.departmentName || notesheet.department,
      notesheetStatus: notesheet.status,
      decision: notesheet.decision || (notesheet.status === 'APPROVED' ? 'APPROVED' : notesheet.status),
      decisionDate: notesheet.decisionDate || notesheet.approvedAt || notesheet.date,
      approvedByName: notesheet.approvedByName || (notesheet.status === 'APPROVED' ? 'Competent Authority' : null),
      approvedAmount: notesheet.approvedAmount,
      version: notesheet.version,
      verifiedAt: new Date().toISOString(),
      institution: 'Swarrnim Startup & Innovation University',
      message: 'Authentic and verified official electronic administrative record of Swarrnim University.',
    };
  }
}
