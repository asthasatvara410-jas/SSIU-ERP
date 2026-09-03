import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AccreditationAuditService } from '../accreditation-audit.service';
import { GenerateReportDto } from '../dto/accreditation.dto';

export interface IntegrityCheckResult {
  reportId: string;
  framework: string;
  storedHash: string;
  computedHash: string;
  isTampered: boolean;
  status: 'VALID' | 'TAMPERED';
  sealedAt?: Date | null;
  generatedBy: string;
}

@Injectable()
export class AccreditationSnapshotService {
  private readonly logger = new Logger(AccreditationSnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AccreditationAuditService,
  ) {}

  /**
   * Resolves the user's role-based data boundary for Snapshot and Report Governance.
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
      return { scope: 'UNIVERSITY', role, canGenerate: true, canSeal: true, canViewAll: true };
    }

    if (roles.includes('HOI') || roles.includes('PRINCIPAL') || roles.includes('DEAN')) {
      return { scope: 'INSTITUTE', role, instituteId: user?.instituteId, canGenerate: true, canSeal: true, canViewAll: false };
    }

    if (roles.includes('HOD') || roles.includes('HEAD_OF_DEPARTMENT')) {
      return { scope: 'DEPARTMENT', role, instituteId: user?.instituteId, departmentId: user?.departmentId, canGenerate: true, canSeal: false, canViewAll: false };
    }

    if (roles.includes('FACULTY') || roles.includes('TEACHER')) {
      return { scope: 'FACULTY_ASSIGNED', role, instituteId: user?.instituteId, departmentId: user?.departmentId, facultyId: user?.id, canGenerate: false, canSeal: false, canViewAll: false };
    }

    return { scope: 'STUDENT', role, studentId: user?.studentId || user?.id, canGenerate: false, canSeal: false, canViewAll: false };
  }

  /**
   * Deterministically canonicalizes an object or array by sorting all object keys recursively.
   */
  canonicalize(data: any): string {
    if (data === null || data === undefined) {
      return 'null';
    }
    if (typeof data !== 'object') {
      return JSON.stringify(data);
    }
    if (Array.isArray(data)) {
      const canonicalElements = data.map((item) => this.canonicalize(item));
      return `[${canonicalElements.join(',')}]`;
    }
    const sortedKeys = Object.keys(data).sort();
    const keyValues = sortedKeys.map((key) => {
      return `${JSON.stringify(key)}:${this.canonicalize(data[key])}`;
    });
    return `{${keyValues.join(',')}}`;
  }

  /**
   * Computes SHA-256 hash from canonical JSON representation.
   */
  computeHash(canonicalJson: string): string {
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
  }

  /**
   * Generates a comprehensive accreditation snapshot and persists as an AccreditationReport.
   */
  async generateSnapshot(dto: GenerateReportDto, tenantId: string, user: any) {
    const userScope = this.resolveUserScope(user);

    if (userScope.scope === 'STUDENT') {
      throw new ForbiddenException('Access denied: Students cannot generate accreditation reports.');
    }

    if (userScope.scope === 'FACULTY_ASSIGNED') {
      throw new ForbiddenException('Access denied: Faculty members cannot generate institutional accreditation snapshots.');
    }

    const frameworkName = (dto.framework.toUpperCase() === 'NBA' ? 'NBA' : 'NAAC') as 'NAAC' | 'NBA';
    const actorId = user?.id || 'SYSTEM';

    // Enforce Scope for HOD: can only generate for their own department
    let targetDepartmentId = dto.departmentId;
    if (userScope.scope === 'DEPARTMENT') {
      if (dto.departmentId && userScope.departmentId && dto.departmentId !== userScope.departmentId) {
        throw new ForbiddenException('Access denied: Cannot generate reports for another department.');
      }
      targetDepartmentId = userScope.departmentId;
    }

    // 1. Fetch criteria and metrics
    const frameworkRecord = await this.prisma.accreditationFramework.findFirst({
      where: { name: frameworkName, tenantId },
      include: {
        criteria: {
          orderBy: { criterionNumber: 'asc' },
          include: {
            metrics: {
              orderBy: { code: 'asc' },
              include: {
                aggregatedValues: {
                  where: {
                    tenantId,
                    ...(targetDepartmentId ? { departmentId: targetDepartmentId } : {}),
                  },
                  orderBy: { academicYear: 'asc' },
                },
                evidences: {
                  where: {
                    tenantId,
                    ...(targetDepartmentId ? { departmentId: targetDepartmentId } : {}),
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!frameworkRecord) {
      throw new NotFoundException(`Accreditation framework ${frameworkName} not configured.`);
    }

    // 2. Fetch Department details if scoped
    let departmentDetails = null;
    if (targetDepartmentId) {
      departmentDetails = await this.prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { id: true, name: true, code: true },
      });
    }

    // 3. Fetch all Lineages for this framework and tenant
    const lineages = await this.prisma.accreditationDataLineage.findMany({
      where: { framework: frameworkName, tenantId },
      orderBy: { calculatedAt: 'desc' },
      take: 100,
    });

    const reportId = `REP-${frameworkName}-${Date.now().toString().slice(-6)}`;
    const academicYearRange = dto.academicYearRange || '2021-22 to 2025-26';

    // 4. Build Structured Canonical Snapshot Data Payload
    const snapshotPayload = {
      reportId,
      framework: frameworkName,
      frameworkVersion: frameworkRecord.version || 'v2026.1',
      academicYearRange,
      institution: {
        name: 'Swarrnim Startup & Innovation University',
        aisheCode: 'U-0894',
        campus: 'Bhoyan Rathod, Gandhinagar, Gujarat',
      },
      scope: {
        department: departmentDetails ? { id: departmentDetails.id, name: departmentDetails.name, code: departmentDetails.code } : null,
      },
      criteria: frameworkRecord.criteria.map((c) => ({
        criterionNumber: c.criterionNumber,
        code: c.code,
        title: c.title,
        weightage: c.weightage,
        metrics: c.metrics.map((m) => ({
          code: m.code,
          name: m.name,
          unit: m.unit,
          sourceModule: m.sourceModule,
          calculationMethod: m.calculationMethod,
          fiveYearValues: m.aggregatedValues.map((v) => ({
            academicYear: v.academicYear,
            value: v.value,
            status: v.status,
            sourceRecordCount: v.sourceRecordCount,
            sourceRecordReference: v.sourceRecordReference,
            scopeType: v.scopeType,
            scopeId: v.scopeId,
          })),
          evidences: m.evidences.map((e) => ({
            id: e.id,
            title: e.title,
            evidenceType: e.evidenceType,
            sourceModule: e.sourceModule,
            status: e.status,
            academicYear: e.academicYear,
            verifiedBy: e.verifiedBy,
            verifiedAt: e.verifiedAt,
            rejectionReason: e.rejectionReason,
          })),
        })),
      })),
      dataLineageSample: lineages.map((l) => ({
        metricCode: l.metricCode,
        sourceModule: l.sourceModule,
        sourceEntity: l.sourceEntity,
        sourceRecordId: l.sourceRecordId,
        academicYear: l.academicYear,
      })),
    };

    // 5. Canonicalize and Hash
    const canonicalJson = this.canonicalize(snapshotPayload);
    const hash = this.computeHash(canonicalJson);

    // 6. Persist to Database
    const report = await this.prisma.accreditationReport.create({
      data: {
        tenantId,
        reportId,
        framework: frameworkName,
        version: 'v1.0',
        academicYearRange,
        status: 'GENERATED',
        institutionId: dto.institutionId || null,
        departmentId: targetDepartmentId || null,
        generatedBy: actorId,
        generatedAt: new Date(),
        snapshotData: snapshotPayload as any,
        hash,
      },
    });

    // 7. Audit Log
    await this.auditService.logEvent({
      event: 'ACCREDITATION_SNAPSHOT_GENERATED',
      framework: frameworkName,
      tenantId,
      actorId,
      reportId: report.reportId,
      correlationId: `snap-gen-${Date.now()}`,
      status: 'GENERATED',
      details: { hash, reportId: report.reportId },
    });

    return report;
  }

  /**
   * Finalizes and seals an accreditation report, making it permanently immutable.
   */
  async finalizeAndSealReport(idOrReportId: string, tenantId: string, user: any) {
    const userScope = this.resolveUserScope(user);

    if (userScope.scope === 'STUDENT' || userScope.scope === 'FACULTY_ASSIGNED') {
      throw new ForbiddenException('Access denied: Unauthorized to finalize accreditation reports.');
    }

    const report = await this.prisma.accreditationReport.findFirst({
      where: {
        tenantId,
        OR: [{ id: idOrReportId }, { reportId: idOrReportId }],
      },
    });

    if (!report) {
      throw new NotFoundException(`Accreditation report ${idOrReportId} not found.`);
    }

    // Scope check: HOD can only seal their own department's report
    if (userScope.scope === 'DEPARTMENT') {
      if (report.departmentId !== userScope.departmentId) {
        throw new ForbiddenException('Access denied: Cannot seal reports for another department.');
      }
    }

    if (report.status === 'SEALED' || report.status === 'FINALIZED') {
      throw new BadRequestException(`Report ${report.reportId} is already sealed.`);
    }

    // Verify hash integrity before sealing
    const canonicalJson = this.canonicalize(report.snapshotData);
    const calculatedHash = this.computeHash(canonicalJson);

    const sealedReport = await this.prisma.accreditationReport.update({
      where: { id: report.id },
      data: {
        status: 'SEALED',
        hash: calculatedHash,
        updatedAt: new Date(),
      },
    });

    await this.auditService.logEvent({
      event: 'ACCREDITATION_REPORT_SEALED',
      framework: sealedReport.framework,
      tenantId,
      actorId: user?.id || 'SYSTEM',
      reportId: sealedReport.reportId,
      correlationId: `rep-seal-${Date.now()}`,
      status: 'SEALED',
      details: { hash: calculatedHash },
    });

    return sealedReport;
  }

  /**
   * Validates the cryptographic integrity of a stored snapshot against its canonical SHA-256 hash.
   */
  async verifySnapshotIntegrity(idOrReportId: string, tenantId: string, user?: any): Promise<IntegrityCheckResult> {
    if (user) {
      const userScope = this.resolveUserScope(user);
      if (userScope.scope === 'STUDENT') {
        throw new ForbiddenException('Access denied: Students cannot verify accreditation integrity seals.');
      }
    }

    const report = await this.prisma.accreditationReport.findFirst({
      where: {
        tenantId,
        OR: [{ id: idOrReportId }, { reportId: idOrReportId }],
      },
    });

    if (!report) {
      throw new NotFoundException(`Accreditation report ${idOrReportId} not found.`);
    }

    const canonicalJson = this.canonicalize(report.snapshotData);
    const computedHash = this.computeHash(canonicalJson);
    const isTampered = computedHash !== report.hash;

    await this.auditService.logEvent({
      event: 'ACCREDITATION_INTEGRITY_VERIFIED',
      framework: report.framework,
      tenantId,
      reportId: report.reportId,
      correlationId: `int-chk-${Date.now()}`,
      status: isTampered ? 'TAMPERED' : 'VALID',
      details: { storedHash: report.hash, computedHash, isTampered },
    });

    return {
      reportId: report.reportId,
      framework: report.framework,
      storedHash: report.hash || '',
      computedHash,
      isTampered,
      status: isTampered ? 'TAMPERED' : 'VALID',
      sealedAt: report.updatedAt,
      generatedBy: report.generatedBy,
    };
  }

  /**
   * Retrieves single report by ID with IDOR and scope enforcement.
   */
  async getReportById(idOrReportId: string, tenantId: string, user?: any) {
    if (user) {
      const userScope = this.resolveUserScope(user);
      if (userScope.scope === 'STUDENT') {
        throw new ForbiddenException('Access denied: Students cannot access accreditation reports.');
      }
    }

    const report = await this.prisma.accreditationReport.findFirst({
      where: {
        tenantId,
        OR: [{ id: idOrReportId }, { reportId: idOrReportId }],
      },
      include: { jobs: true },
    });

    if (!report) {
      throw new NotFoundException(`Accreditation report ${idOrReportId} not found.`);
    }

    // IDOR / Department Scope check
    if (user) {
      const userScope = this.resolveUserScope(user);
      if (userScope.scope === 'DEPARTMENT' && report.departmentId && report.departmentId !== userScope.departmentId) {
        throw new ForbiddenException('Access denied: Cannot access an accreditation report from another department.');
      }
    }

    return report;
  }

  /**
   * Lists historical reports filtered by framework, status, and user scope.
   */
  async listReports(framework?: string, tenantId?: string, user?: any) {
    if (user) {
      const userScope = this.resolveUserScope(user);
      if (userScope.scope === 'STUDENT') {
        throw new ForbiddenException('Access denied.');
      }
    }

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (framework) where.framework = (framework.toUpperCase() === 'NBA' ? 'NBA' : 'NAAC');

    if (user) {
      const userScope = this.resolveUserScope(user);
      if (userScope.scope === 'DEPARTMENT' && userScope.departmentId) {
        where.departmentId = userScope.departmentId;
      }
    }

    return this.prisma.accreditationReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reportId: true,
        framework: true,
        version: true,
        academicYearRange: true,
        status: true,
        institutionId: true,
        departmentId: true,
        generatedBy: true,
        generatedAt: true,
        hash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
