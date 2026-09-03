import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OBEController } from './obe.controller';
import { OBEService } from './obe.service';
import { CourseOutcomeService } from './course-outcome.service';
import { ProgramOutcomeService } from './program-outcome.service';
import { ProgramSpecificOutcomeService } from './program-specific-outcome.service';
import { COMappingService } from './co-mapping.service';
import { AssessmentMappingService } from './assessment-mapping.service';
import { AttainmentEngine } from './attainment-engine.service';
import { OBEValidationService } from './obe-validation.service';
import { OBEReportService } from './obe-report.service';
import { OBEAuditService } from './obe-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [OBEController],
  providers: [
    OBEService,
    CourseOutcomeService,
    ProgramOutcomeService,
    ProgramSpecificOutcomeService,
    COMappingService,
    AssessmentMappingService,
    AttainmentEngine,
    OBEValidationService,
    OBEReportService,
    OBEAuditService,
  ],
  exports: [
    OBEService,
    CourseOutcomeService,
    ProgramOutcomeService,
    ProgramSpecificOutcomeService,
    COMappingService,
    AssessmentMappingService,
    AttainmentEngine,
    OBEValidationService,
    OBEReportService,
    OBEAuditService,
  ],
})
export class OBEModule {}
