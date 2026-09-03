import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ResearchProjectService } from './research-project.service';
import { PublicationService } from './publication.service';
import { PatentService } from './patent.service';
import { ResearchValidationService } from './research-validation.service';
import { ResearchApprovalService } from './research-approval.service';
import { ResearchAuditService } from './research-audit.service';
import { DOIValidationService } from './adapters/doi-validation.service';
import { CrossrefValidationService } from './adapters/crossref-validation.service';
import { OpenAlexValidationService } from './adapters/openalex-validation.service';
import { ORCIDValidationService } from './adapters/orcid-validation.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResearchController],
  providers: [
    ResearchService,
    ResearchProjectService,
    PublicationService,
    PatentService,
    ResearchValidationService,
    ResearchApprovalService,
    ResearchAuditService,
    DOIValidationService,
    CrossrefValidationService,
    OpenAlexValidationService,
    ORCIDValidationService,
  ],
  exports: [
    ResearchService,
    ResearchProjectService,
    PublicationService,
    PatentService,
    ResearchValidationService,
    ResearchApprovalService,
    ResearchAuditService,
  ],
})
export class ResearchModule {}
