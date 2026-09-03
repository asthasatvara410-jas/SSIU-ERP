import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { NEPIndicatorService } from './nep-indicator.service';
import { OBEComplianceService } from './obe-compliance.service';
import { AccreditationSnapshotService } from './accreditation-snapshot.service';
import { NBAComplianceService } from './nba-compliance.service';
import { ComplianceAuditService } from './compliance-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    NEPIndicatorService,
    OBEComplianceService,
    AccreditationSnapshotService,
    NBAComplianceService,
    ComplianceAuditService,
  ],
  exports: [
    ComplianceService,
    NEPIndicatorService,
    OBEComplianceService,
    AccreditationSnapshotService,
    NBAComplianceService,
    ComplianceAuditService,
  ],
})
export class ComplianceModule {}
