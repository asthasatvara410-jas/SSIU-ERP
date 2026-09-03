import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

export interface NoticeAuditRecord {
  id: string;
  noticeId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
}

const VALID_CATEGORIES = new Set([
  'ACADEMIC', 'EXAM', 'HOLIDAY', 'FEES', 'EVENT', 'ADMINISTRATIVE', 'GENERAL', 'CIRCULAR'
]);

const VALID_PRIORITIES = new Set(['URGENT', 'HIGH', 'NORMAL', 'LOW']);
const VALID_SCOPES = new Set(['UNIVERSITY_WIDE', 'INSTITUTE_WIDE', 'DEPARTMENT_WIDE', 'ROLE_BASED', 'TARGETED']);
const VALID_ROLES = new Set(['ALL', 'STUDENT', 'FACULTY', 'STAFF', 'HOD', 'PRINCIPAL']);

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);
  private noticeAudits = new Map<string, NoticeAuditRecord[]>();

  constructor(private readonly prisma: PrismaService) {}

  private async nextSeq(): Promise<string> {
    const year = new Date().getFullYear();
    let count = (await this.prisma.notification.count({ where: { module: 'NOTICE' } })) + 1;
    let ref = `NOT-${year}-${String(count).padStart(6, '0')}`;
    while (await this.prisma.notification.findFirst({ where: { referenceId: ref } })) {
      count++;
      ref = `NOT-${year}-${String(count).padStart(6, '0')}`;
    }
    return ref;
  }

  // 1. Create Targeted Notice
  async createNotice(user: any, dto: CreateNoticeDto) {
    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isStudent = userRoles.includes('STUDENT') || userRoles.includes('PARENT') || Boolean(user?.studentId);

    if (isStudent) {
      throw new ForbiddenException('Access Denied: Students are not permitted to publish official university notices.');
    }

    const catUpper = dto.category ? dto.category.trim().toUpperCase() : 'GENERAL';
    if (!VALID_CATEGORIES.has(catUpper)) {
      throw new BadRequestException(`Invalid notice category '${dto.category}'. Valid: ${Array.from(VALID_CATEGORIES).join(', ')}`);
    }

    const prioUpper = dto.priority ? dto.priority.trim().toUpperCase() : 'NORMAL';
    if (!VALID_PRIORITIES.has(prioUpper)) {
      throw new BadRequestException(`Invalid notice priority '${dto.priority}'. Valid: URGENT, HIGH, NORMAL, LOW`);
    }

    const scopeUpper = dto.scopeType ? dto.scopeType.trim().toUpperCase() : 'UNIVERSITY_WIDE';
    if (!VALID_SCOPES.has(scopeUpper)) {
      throw new BadRequestException(`Invalid audience scope '${dto.scopeType}'. Valid: ${Array.from(VALID_SCOPES).join(', ')}`);
    }

    // Privilege & Scope Boundaries
    const isUnivAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR', 'PRO_VC', 'VC', 'PROVOST'].includes(r));
    const isPrincipal = userRoles.includes('PRINCIPAL') || userRoles.includes('HOI');
    const isHod = userRoles.includes('HOD');

    if (scopeUpper === 'UNIVERSITY_WIDE' && !isUnivAdmin && !isPrincipal) {
      throw new ForbiddenException('Privilege Escalation Blocked: Only University Administrators or Principals can issue University-Wide notices.');
    }

    if (scopeUpper === 'DEPARTMENT_WIDE') {
      if (isHod && user.departmentId && dto.targetDepartmentId && dto.targetDepartmentId !== user.departmentId) {
        throw new ForbiddenException('Scope Boundary Blocked: You can only publish notices for your assigned department.');
      }
    }

    // Date Validation
    const now = new Date();
    let pubDate = dto.publishAt ? new Date(dto.publishAt) : now;
    let expDate = dto.expiresAt ? new Date(dto.expiresAt) : null;

    if (expDate && expDate <= pubDate) {
      throw new BadRequestException('Invalid Dates: Notice expiry date must be strictly after the publication date.');
    }

    // Determine initial lifecycle status
    let status = dto.status ? dto.status.trim().toUpperCase() : 'PUBLISHED';
    if (status !== 'DRAFT') {
      if (pubDate > now) {
        status = 'SCHEDULED';
      } else if (expDate && expDate < now) {
        status = 'EXPIRED';
      } else {
        status = 'PUBLISHED';
      }
    }

    const noticeNo = await this.nextSeq();

    // Store metadata in linkTab as JSON
    const metadata = {
      isPinned: Boolean(dto.isPinned),
      publishAt: pubDate.toISOString(),
      expiresAt: expDate ? expDate.toISOString() : null,
      publishedBy: dto.publishedBy || user.username || 'University Authority',
    };

    const record = await this.prisma.notification.create({
      data: {
        type: status,
        title: dto.title.trim(),
        message: dto.content.trim(),
        module: 'NOTICE',
        referenceId: noticeNo,
        referenceType: catUpper,
        priority: prioUpper,
        scopeType: scopeUpper,
        targetRole: dto.targetRole ? dto.targetRole.toUpperCase() : 'ALL',
        targetInstituteId: dto.targetInstituteId || (scopeUpper === 'INSTITUTE_WIDE' ? user.instituteId : null),
        targetDepartmentId: dto.targetDepartmentId || (scopeUpper === 'DEPARTMENT_WIDE' ? user.departmentId : null),
        actionUrl: dto.attachmentUrl,
        actionLabel: metadata.publishedBy,
        linkTab: JSON.stringify(metadata),
        createdBy: user.id,
      },
    });

    this.logAudit(record.id, user.id, user.username || user.id, userRoles[0] || 'ADMIN', 'NOTICE_CREATED', `Notice ${noticeNo} created with status ${status}`);

    return this.formatNotice(record);
  }

  // 2. Query Notices with Targeted Audience & Role Enforcement
  async getNotices(user: any, query?: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(Number(query?.limit) || 20, 100));
    const skip = (page - 1) * limit;

    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isUnivAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(r));
    const isStudent = userRoles.includes('STUDENT') || userRoles.includes('PARENT') || Boolean(user?.studentId);

    const where: any = { module: 'NOTICE' };

    // Category filter
    if (query?.category && query.category !== 'ALL') {
      where.referenceType = query.category.toUpperCase();
    }

    // Priority filter
    if (query?.priority && query.priority !== 'ALL') {
      where.priority = query.priority.toUpperCase();
    }

    // Search term
    if (query?.search) {
      const term = query.search.trim();
      if (term) {
        where.OR = [
          { title: { contains: term, mode: 'insensitive' } },
          { message: { contains: term, mode: 'insensitive' } },
          { referenceId: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    // Audience & Lifecycle Filter
    if (!isUnivAdmin) {
      // Normal users: NEVER see DRAFT or ARCHIVED unless authorized
      // Only see PUBLISHED notices that are currently active
      where.type = 'PUBLISHED';

      // Scope Isolation:
      const audienceConditions: any[] = [{ scopeType: 'UNIVERSITY_WIDE' }];

      if (user?.instituteId) {
        audienceConditions.push({
          scopeType: 'INSTITUTE_WIDE',
          targetInstituteId: user.instituteId,
        });
      }

      if (user?.departmentId) {
        audienceConditions.push({
          scopeType: 'DEPARTMENT_WIDE',
          targetDepartmentId: user.departmentId,
        });
      }

      // Role conditions
      audienceConditions.push(
        { targetRole: { in: ['ALL', ...userRoles] } },
        { targetRole: null },
      );

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: audienceConditions }];
        delete where.OR;
      } else {
        where.OR = audienceConditions;
      }
    } else {
      // Admin filter on status
      if (query?.status && query.status !== 'ALL') {
        where.type = query.status.toUpperCase();
      }
    }

    const [total, rawList] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Format notices and evaluate scheduled/expired states
    const now = new Date();
    const formatted = rawList
      .map((r) => this.formatNotice(r))
      .filter((n) => {
        // If not admin, omit expired notices
        if (!isUnivAdmin && n.expiresAt) {
          const exp = new Date(n.expiresAt);
          if (exp < now) return false;
        }
        return true;
      });

    return {
      data: formatted,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // 3. Get Notice Details by ID with Scope & Audience Guard
  async getNoticeById(id: string, user: any) {
    const record = await this.prisma.notification.findFirst({
      where: { id, module: 'NOTICE' },
    });
    if (!record) throw new NotFoundException('Notice not found.');

    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isUnivAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(r));

    if (!isUnivAdmin) {
      if (record.type === 'DRAFT') {
        throw new ForbiddenException('Access Denied: Draft notice is not publicly visible.');
      }

      // Scope Guard
      if (record.scopeType === 'INSTITUTE_WIDE' && record.targetInstituteId && record.targetInstituteId !== user.instituteId) {
        throw new ForbiddenException('Access Denied: Notice is restricted to another Institute.');
      }

      if (record.scopeType === 'DEPARTMENT_WIDE' && record.targetDepartmentId && record.targetDepartmentId !== user.departmentId) {
        throw new ForbiddenException('Access Denied: Notice is restricted to another Department.');
      }

      if (record.targetRole && record.targetRole !== 'ALL' && !userRoles.includes(record.targetRole)) {
        throw new ForbiddenException(`Access Denied: Notice is restricted to role '${record.targetRole}'.`);
      }
    }

    const audits = this.noticeAudits.get(id) || [];
    const formatted = this.formatNotice(record);

    return {
      ...formatted,
      auditTrail: isUnivAdmin ? audits : undefined,
    };
  }

  // 4. Update Notice
  async updateNotice(id: string, user: any, dto: UpdateNoticeDto) {
    const record = await this.prisma.notification.findFirst({
      where: { id, module: 'NOTICE' },
    });
    if (!record) throw new NotFoundException('Notice not found.');

    const userRoles: string[] = user?.roles || (user?.role ? [user.role] : []);
    const isUnivAdmin = userRoles.some((r) => ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'UNIVERSITY_ADMIN', 'REGISTRAR'].includes(r));
    const isCreator = record.createdBy === user.id;

    if (!isUnivAdmin && !isCreator) {
      throw new ForbiddenException('Access Denied: You do not have authority to edit this notice.');
    }

    // Check audience tampering
    if (dto.scopeType === 'UNIVERSITY_WIDE' && !isUnivAdmin) {
      throw new ForbiddenException('Audience Tampering Blocked: Only University Administrators can set University-Wide scope.');
    }

    const updateData: any = {};
    if (dto.title) updateData.title = dto.title.trim();
    if (dto.content) updateData.message = dto.content.trim();
    if (dto.category) updateData.referenceType = dto.category.toUpperCase();
    if (dto.priority) updateData.priority = dto.priority.toUpperCase();
    if (dto.scopeType) updateData.scopeType = dto.scopeType.toUpperCase();
    if (dto.targetInstituteId !== undefined) updateData.targetInstituteId = dto.targetInstituteId;
    if (dto.targetDepartmentId !== undefined) updateData.targetDepartmentId = dto.targetDepartmentId;
    if (dto.targetRole !== undefined) updateData.targetRole = dto.targetRole;
    if (dto.attachmentUrl !== undefined) updateData.actionUrl = dto.attachmentUrl;
    if (dto.status) updateData.type = dto.status.toUpperCase();

    // Parse existing metadata
    let existingMeta: any = {};
    try {
      if (record.linkTab) existingMeta = JSON.parse(record.linkTab);
    } catch {}

    if (dto.isPinned !== undefined) existingMeta.isPinned = Boolean(dto.isPinned);
    if (dto.publishAt !== undefined) existingMeta.publishAt = dto.publishAt;
    if (dto.expiresAt !== undefined) existingMeta.expiresAt = dto.expiresAt;
    if (dto.publishedBy !== undefined) {
      existingMeta.publishedBy = dto.publishedBy;
      updateData.actionLabel = dto.publishedBy;
    }

    updateData.linkTab = JSON.stringify(existingMeta);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });

    this.logAudit(id, user.id, user.username || user.id, userRoles[0] || 'ADMIN', 'NOTICE_EDITED', `Notice ${record.referenceId} edited.`);

    return this.formatNotice(updated);
  }

  // 5. Publish Notice
  async publishNotice(id: string, user: any) {
    return this.updateNotice(id, user, { status: 'PUBLISHED' });
  }

  // 6. Archive Notice
  async archiveNotice(id: string, user: any) {
    return this.updateNotice(id, user, { status: 'ARCHIVED' });
  }

  private formatNotice(r: any) {
    let meta: any = {};
    try {
      if (r.linkTab) meta = JSON.parse(r.linkTab);
    } catch {}

    return {
      id: r.id,
      noticeNo: r.referenceId,
      title: r.title,
      content: r.message,
      category: r.referenceType || 'GENERAL',
      priority: r.priority || 'NORMAL',
      status: r.type || 'PUBLISHED',
      scopeType: r.scopeType || 'UNIVERSITY_WIDE',
      targetRole: r.targetRole || 'ALL',
      targetInstituteId: r.targetInstituteId,
      targetDepartmentId: r.targetDepartmentId,
      publishedBy: r.actionLabel || meta.publishedBy || 'University Administration',
      isPinned: Boolean(meta.isPinned),
      publishAt: meta.publishAt || r.createdAt.toISOString(),
      expiresAt: meta.expiresAt || null,
      attachmentUrl: r.actionUrl,
      publishedDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '',
      createdAt: r.createdAt ? r.createdAt.toISOString() : '',
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : '',
    };
  }

  private logAudit(noticeId: string, actorId: string, actorName: string, actorRole: string, action: string, details: string) {
    const entry: NoticeAuditRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      noticeId,
      actorId,
      actorName,
      actorRole,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    const current = this.noticeAudits.get(noticeId) || [];
    current.push(entry);
    this.noticeAudits.set(noticeId, current);
  }
}
