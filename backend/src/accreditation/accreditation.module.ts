import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccreditationController } from './accreditation.controller';
import { AccreditationService } from './accreditation.service';
import { AccreditationCriteriaService } from './accreditation-criteria.service';
import { AccreditationDataAggregator } from './accreditation-data-aggregator.service';
import { AccreditationMetricService } from './accreditation-metric.service';
import { AccreditationEvidenceService } from './accreditation-evidence.service';
import { AccreditationReportService } from './accreditation-report.service';
import { AccreditationExportService } from './accreditation-export.service';
import { AccreditationSnapshotService } from './services/accreditation-snapshot.service';
import { AccreditationAuditService } from './accreditation-audit.service';
import { NaacEngineService } from './services/naac-engine.service';
import { NbaEngineService } from './services/nba-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [AccreditationController],
  providers: [
    AccreditationService,
    AccreditationCriteriaService,
    AccreditationDataAggregator,
    AccreditationMetricService,
    AccreditationEvidenceService,
    AccreditationReportService,
    AccreditationSnapshotService,
    AccreditationExportService,
    AccreditationAuditService,
    NaacEngineService,
    NbaEngineService,
  ],
  exports: [
    AccreditationService,
    AccreditationCriteriaService,
    AccreditationDataAggregator,
    AccreditationMetricService,
    AccreditationEvidenceService,
    AccreditationReportService,
    AccreditationSnapshotService,
    AccreditationExportService,
    AccreditationAuditService,
    NaacEngineService,
    NbaEngineService,
  ],
})
export class AccreditationModule {}
