import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NEPIndicatorService } from './nep-indicator.service';
import { OBEComplianceService } from './obe-compliance.service';
import { AccreditationSnapshotService } from './accreditation-snapshot.service';
import { NBAComplianceService } from './nba-compliance.service';
import { ComplianceAuditService } from './compliance-audit.service';
import {
  CreateCOAssessmentMappingDto,
  CalculateCOAttainmentDto,
  AttainmentOverrideDto,
  CreateNEPIndicatorDto,
  CreateSnapshotDto,
} from './dto/compliance.dto';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nepService: NEPIndicatorService,
    private readonly obeComplianceService: OBEComplianceService,
    private readonly snapshotService: AccreditationSnapshotService,
    private readonly nbaService: NBAComplianceService,
    private readonly auditService: ComplianceAuditService,
  ) {}

  async getExecutiveDashboard(tenantId: string) {
    const [nepList, snapshots, overrides] = await Promise.all([
      this.nepService.listIndicators(tenantId),
      this.snapshotService.listSnapshots(tenantId),
      this.prisma.attainmentOverride.findMany({ where: { tenantId } }),
    ]);

    return {
      nepIndicatorsCount: nepList.length,
      nepAchievedCount: nepList.filter(n => n.status === 'ACHIEVED').length,
      snapshotsCount: snapshots.length,
      recentSnapshots: snapshots.slice(0, 5),
      overridesCount: overrides.length,
      accreditationReadiness: {
        naac: 'READY_FOR_INSTITUTIONAL_REVIEW',
        nba: 'CYCLE_1_PREPARED',
        obeAttainment: 'CALCULATED',
        nepIndicators: 'MONITORED',
      },
    };
  }

  // NEP Indicators
  async listNEPIndicators(tenantId: string, category?: string) {
    return this.nepService.listIndicators(tenantId, category);
  }

  async createOrUpdateNEPIndicator(dto: CreateNEPIndicatorDto, tenantId: string) {
    return this.nepService.createOrUpdateIndicator(dto, tenantId);
  }

  // OBE Assessment Mappings & Attainments
  async createCOAssessmentMapping(dto: CreateCOAssessmentMappingDto, tenantId: string) {
    return this.obeComplianceService.createAssessmentMapping(dto, tenantId);
  }

  async calculateCOAttainment(dto: CalculateCOAttainmentDto, tenantId: string) {
    return this.obeComplianceService.calculateCOAttainment(dto, tenantId);
  }

  async calculatePOAttainment(programId: string, academicYear: string, tenantId: string) {
    return this.obeComplianceService.calculatePOAttainment(programId, academicYear, tenantId);
  }

  async overrideAttainment(dto: AttainmentOverrideDto, user: any, tenantId: string) {
    return this.obeComplianceService.overrideAttainment(dto, user, tenantId);
  }

  // NBA
  async getNBAProgramProfile(programId: string, tenantId: string) {
    return this.nbaService.getProgramProfile(programId, tenantId);
  }

  // Snapshots & Reports
  async createSnapshot(dto: CreateSnapshotDto, user: any, tenantId: string) {
    return this.snapshotService.createSnapshot(dto, user, tenantId);
  }

  async listSnapshots(tenantId: string, framework?: string) {
    return this.snapshotService.listSnapshots(tenantId, framework);
  }
}
