import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccreditationAuditService } from '../accreditation-audit.service';
import { EvidenceCreateDto, EvidenceVerifyDto, EvidenceRejectDto } from '../dto/accreditation.dto';

export interface EvidenceListQuery {
  framework?: string;
  criterionCode?: string;
  metricId?: string;
  academicYear?: string;
  status?: string;
  departmentId?: string;
  programId?: string;
}

@Injectable()
export class AccreditationEvidenceService {
  private readonly logger = new Logger(AccreditationEvidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AccreditationAuditService,
  ) {}

  /**
   * Resolves the user's role-based data boundary for Evidence Management.
   */
  resolveUserScope(user: any) {
    const role = user?.role || 'USER';
    const roles: string[] = user?.roles || [role];

    const universityRoles = [
      'SYSTEM_ADMIN', 'SUPER_ADMIN', 'UNIVERSITY_ADMIN',
      'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST',
      'REGISTRAR', 'DEPUTY_REGISTRAR', 'IQAC', 'EXAM_CELL', 'STUDENT_SECTION'
    ];
    if (roles.some((r) => universityRoles.includes(r))) {
      return { scope: 'UNIVERSITY', role, canVerify: true };
    }

    if (roles.includes('HOI') || roles.includes('PRINCIPAL') || roles.includes('DEAN')) {
      return { scope: 'INSTITUTE', role, instituteId: user?.instituteId, canVerify: true };
    }

    if (roles.includes('HOD') || roles.includes('HEAD_OF_DEPARTMENT')) {
      return { scope: 'DEPARTMENT', role, instituteId: user?.instituteId, departmentId: user?.departmentId, canVerify: true };
    }

    if (roles.includes('FACULTY') || roles.includes('TEACHER')) {
      return { scope: 'FACULTY_ASSIGNED', role, instituteId: user?.instituteId, departmentId: user?.departmentId, facultyId: user?.id, canVerify: false };
    }

    return { scope: 'STUDENT', role, studentId: user?.studentId || user?.id, canVerify: false };
  }

  /**
   * Attaches evidence (DMS document, DigiLocker verified document, or ERP/OBE record)
   * to a NAAC or NBA accreditation criterion/metric.
   */
  async attachEvidence(dto: EvidenceCreateDto, tenantId: string, user: any) {
    const userScope = this.resolveUserScope(user);
    if (userScope.scope === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot attach accreditation evidence.');
    }

    const frameworkName = (dto.framework.toUpperCase() === 'NBA' ? 'NBA' : 'NAAC') as 'NAAC' | 'NBA';

    // 1. Metric Validation (if metricId is provided)
    let metricCode = dto.criterionCode;
    let sourceModule = dto.sourceModule || 'DMS';

    if (dto.metricId) {
      const metric = await this.prisma.accreditationMetric.findUnique({
        where: { id: dto.metricId },
        include: { criterion: { include: { framework: true } } },
      });

      if (!metric) {
        throw new NotFoundException(`Accreditation metric with ID ${dto.metricId} not found.`);
      }

      if (metric.criterion.framework.name !== frameworkName) {
        throw new BadRequestException(
          `Metric ${metric.code} belongs to framework ${metric.criterion.framework.name}, not ${frameworkName}.`,
        );
      }

      metricCode = metric.code;
      sourceModule = dto.sourceModule || metric.sourceModule || 'DMS';
    }

    // 2. DMS Document Verification
    if (dto.sourceModule === 'DMS' && dto.documentId) {
      const dmsDoc = await this.prisma.documentMaster.findFirst({
        where: { id: dto.documentId },
      });
      if (!dmsDoc) {
        throw new BadRequestException(`Referenced DMS Document with ID ${dto.documentId} does not exist in repository.`);
      }
    }

    // 3. DigiLocker Document Verification
    if ((dto.sourceModule === 'DIGILOCKER' || dto.evidenceType === 'DIGILOCKER_DOCUMENT') && dto.documentId) {
      const digiDoc = await this.prisma.digiLockerDocument.findFirst({
        where: { id: dto.documentId, tenantId },
      });
      if (!digiDoc) {
        throw new BadRequestException(`Referenced DigiLocker document with ID ${dto.documentId} does not exist in tenant.`);
      }
    }

    // 4. Scoping Enforcement
    const effectiveDepartmentId = dto.departmentId || userScope.departmentId || undefined;
    const effectiveProgramId = dto.programId || undefined;

    if (userScope.scope === 'DEPARTMENT' && dto.departmentId && dto.departmentId !== userScope.departmentId) {
      throw new ForbiddenException('Access denied: Cannot attach evidence for another department.');
    }

    // 5. Create Evidence Record (Initial status PENDING, or VERIFIED if IQAC/Admin attached)
    const initialStatus = userScope.canVerify ? 'VERIFIED' : 'PENDING';
    const verifiedBy = userScope.canVerify ? user.id : null;
    const verifiedAt = userScope.canVerify ? new Date() : null;

    const evidence = await this.prisma.accreditationEvidence.create({
      data: {
        tenantId,
        framework: frameworkName,
        criterionCode: dto.criterionCode,
        metricId: dto.metricId || null,
        title: dto.title,
        description: dto.description || null,
        documentId: dto.documentId || null,
        sourceRecordId: dto.sourceRecordId || null,
        sourceModule,
        academicYear: dto.academicYear || '2025-26',
        evidenceType: dto.evidenceType || 'PDF',
        status: initialStatus,
        submittedBy: user?.id || 'SYSTEM',
        verifiedBy,
        verifiedAt,
        departmentId: effectiveDepartmentId || null,
        programId: effectiveProgramId || null,
        fileUrl: dto.fileUrl || null,
      },
    });

    // 6. Record Traceable Data Lineage
    await this.prisma.accreditationDataLineage.create({
      data: {
        tenantId,
        framework: frameworkName,
        metricCode,
        sourceModule,
        sourceEntity: `AccreditationEvidence#${evidence.id} (${dto.title})`,
        sourceRecordId: dto.sourceRecordId || dto.documentId || evidence.id,
        academicYear: dto.academicYear || '2025-26',
        evidenceId: evidence.id,
      },
    });

    // 7. Audit Logging
    await this.auditService.logEvent({
      event: 'ACCREDITATION_EVIDENCE_ATTACHED',
      framework: frameworkName,
      criterion: dto.criterionCode,
      tenantId,
      actorId: user?.id,
      correlationId: `ev-att-${Date.now()}`,
      status: initialStatus,
      details: {
        evidenceId: evidence.id,
        title: dto.title,
        sourceModule,
        evidenceType: dto.evidenceType,
      },
    });

    return evidence;
  }

  /**
   * Verifies pending accreditation evidence by an authorized HOD / HOI / IQAC / Admin.
   */
  async verifyEvidence(id: string, tenantId: string, user: any, dto?: EvidenceVerifyDto) {
    const userScope = this.resolveUserScope(user);
    if (!userScope.canVerify) {
      throw new ForbiddenException('Access denied: Insufficient permissions to verify accreditation evidence.');
    }

    const evidence = await this.prisma.accreditationEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException(`Accreditation evidence with ID ${id} not found.`);
    }

    if (userScope.scope !== 'UNIVERSITY') {
      if (userScope.scope === 'INSTITUTE' && evidence.tenantId !== tenantId && userScope.instituteId && evidence.tenantId !== userScope.instituteId) {
        throw new NotFoundException(`Accreditation evidence with ID ${id} not found.`);
      }
      if (userScope.scope === 'DEPARTMENT' && evidence.departmentId && evidence.departmentId !== userScope.departmentId) {
        throw new ForbiddenException('Access denied: Cannot verify evidence for another department.');
      }
    }

    const updated = await this.prisma.accreditationEvidence.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedBy: user?.id || 'IQAC Coordinator',
        verifiedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await this.auditService.logEvent({
      event: 'ACCREDITATION_EVIDENCE_VERIFIED',
      framework: updated.framework,
      criterion: updated.criterionCode || undefined,
      tenantId: updated.tenantId,
      actorId: user?.id || 'system',
      correlationId: `ev-ver-${Date.now()}`,
      status: 'VERIFIED',
      details: {
        evidenceId: id,
        remarks: dto?.remarks || 'Evidence verified by authorized coordinator',
      },
    });

    return updated;
  }

  /**
   * Rejects invalid or non-compliant accreditation evidence with audit trail and reason.
   */
  async rejectEvidence(id: string, tenantId: string, user: any, dto: EvidenceRejectDto) {
    const userScope = this.resolveUserScope(user);
    if (!userScope.canVerify) {
      throw new ForbiddenException('Access denied: Insufficient permissions to reject accreditation evidence.');
    }

    const evidence = await this.prisma.accreditationEvidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      throw new NotFoundException(`Accreditation evidence with ID ${id} not found.`);
    }

    if (userScope.scope !== 'UNIVERSITY') {
      if (userScope.scope === 'INSTITUTE' && evidence.tenantId !== tenantId && userScope.instituteId && evidence.tenantId !== userScope.instituteId) {
        throw new NotFoundException(`Accreditation evidence with ID ${id} not found.`);
      }
      if (userScope.scope === 'DEPARTMENT' && evidence.departmentId && evidence.departmentId !== userScope.departmentId) {
        throw new ForbiddenException('Access denied: Cannot reject evidence for another department.');
      }
    }

    const updated = await this.prisma.accreditationEvidence.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: user?.id || 'IQAC Coordinator',
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    await this.auditService.logEvent({
      event: 'ACCREDITATION_EVIDENCE_REJECTED',
      framework: updated.framework,
      criterion: updated.criterionCode || undefined,
      tenantId,
      actorId: user?.id,
      correlationId: `ev-rej-${Date.now()}`,
      status: 'REJECTED',
      details: {
        evidenceId: id,
        rejectionReason: dto.rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Lists accreditation evidence filtered safely by framework, criterion, metric, status, and scope.
   */
  async listEvidence(query: EvidenceListQuery, tenantId: string, userScope?: any) {
    const where: any = {};
    if (userScope?.scope !== 'UNIVERSITY') {
      where.tenantId = tenantId;
    }

    if (query.framework) where.framework = (query.framework.toUpperCase() === 'NBA' ? 'NBA' : 'NAAC');
    if (query.criterionCode) where.criterionCode = query.criterionCode;
    if (query.metricId) where.metricId = query.metricId;
    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.status) where.status = query.status;

    // Scoping enforcement
    if (query.departmentId || userScope?.departmentId) {
      where.departmentId = query.departmentId || userScope.departmentId;
    }
    if (query.programId) {
      where.programId = query.programId;
    }

    const items = await this.prisma.accreditationEvidence.findMany({
      where,
      include: {
        metric: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
            sourceModule: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask/sanitize sensitive references
    return items.map((item) => ({
      id: item.id,
      framework: item.framework,
      criterionCode: item.criterionCode,
      metricId: item.metricId,
      metricCode: item.metric?.code || null,
      metricName: item.metric?.name || null,
      title: item.title,
      description: item.description,
      sourceModule: item.sourceModule,
      academicYear: item.academicYear,
      evidenceType: item.evidenceType,
      status: item.status,
      submittedBy: item.submittedBy,
      verifiedBy: item.verifiedBy,
      verifiedAt: item.verifiedAt,
      rejectedBy: item.rejectedBy,
      rejectedAt: item.rejectedAt,
      rejectionReason: item.rejectionReason,
      departmentId: item.departmentId,
      programId: item.programId,
      fileUrl: item.fileUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  /**
   * Retrieves single evidence record by ID with data lineage history.
   */
  async getEvidenceById(id: string, tenantId: string) {
    const item = await this.prisma.accreditationEvidence.findUnique({
      where: { id },
      include: {
        metric: {
          include: { criterion: true },
        },
      },
    });

    if (!item || item.tenantId !== tenantId) {
      throw new NotFoundException(`Accreditation evidence with ID ${id} not found.`);
    }

    const lineage = await this.prisma.accreditationDataLineage.findMany({
      where: { evidenceId: id, tenantId },
      orderBy: { calculatedAt: 'desc' },
    });

    return {
      evidence: {
        id: item.id,
        framework: item.framework,
        criterionCode: item.criterionCode,
        criterionTitle: item.metric?.criterion?.title || null,
        metricId: item.metricId,
        metricCode: item.metric?.code || null,
        metricName: item.metric?.name || null,
        title: item.title,
        description: item.description,
        sourceModule: item.sourceModule,
        academicYear: item.academicYear,
        evidenceType: item.evidenceType,
        status: item.status,
        submittedBy: item.submittedBy,
        verifiedBy: item.verifiedBy,
        verifiedAt: item.verifiedAt,
        rejectedBy: item.rejectedBy,
        rejectedAt: item.rejectedAt,
        rejectionReason: item.rejectionReason,
        departmentId: item.departmentId,
        programId: item.programId,
        fileUrl: item.fileUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      dataLineage: lineage,
    };
  }

  /**
   * Calculates evidence completeness percentage and counts across criteria for NAAC/NBA.
   */
  async getEvidenceCompleteness(framework: string, tenantId: string, scope?: any) {
    const fName = (framework.toUpperCase() === 'NBA' ? 'NBA' : 'NAAC') as 'NAAC' | 'NBA';
    const where: any = { framework: fName, tenantId };

    if (scope?.departmentId) where.departmentId = scope.departmentId;
    if (scope?.programId) where.programId = scope.programId;

    const [total, verified, pending, rejected] = await Promise.all([
      this.prisma.accreditationEvidence.count({ where }),
      this.prisma.accreditationEvidence.count({ where: { ...where, status: 'VERIFIED' } }),
      this.prisma.accreditationEvidence.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.accreditationEvidence.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    const completenessPercentage = total > 0 ? parseFloat(((verified / total) * 100).toFixed(1)) : 100.0;

    return {
      framework: fName,
      totalEvidenceItems: total,
      verifiedCount: verified,
      pendingCount: pending,
      rejectedCount: rejected,
      completenessPercentage,
      status: pending > 0 ? 'PENDING_REVIEW' : rejected > 0 ? 'NEEDS_REVISION' : 'COMPLIANT',
    };
  }
}
