import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GovernmentIntegrationController } from './government-integration.controller';
import { GovernmentIntegrationService } from './government-integration.service';
import { ABCIntegrationService } from './abc-integration.service';
import { DigiLockerIntegrationService } from './digilocker-integration.service';
import { CredentialIntegrationService } from './credential-integration.service';
import { AcademicRecordSyncService } from './academic-record-sync.service';
import { ABCProviderAdapter } from './adapters/abc-provider.adapter';
import { DigiLockerProviderAdapter } from './adapters/digilocker-provider.adapter';
import { IntegrationAuditService } from './integration-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [GovernmentIntegrationController],
  providers: [
    GovernmentIntegrationService,
    ABCIntegrationService,
    DigiLockerIntegrationService,
    CredentialIntegrationService,
    AcademicRecordSyncService,
    ABCProviderAdapter,
    DigiLockerProviderAdapter,
    IntegrationAuditService,
  ],
  exports: [
    GovernmentIntegrationService,
    ABCIntegrationService,
    DigiLockerIntegrationService,
    CredentialIntegrationService,
    AcademicRecordSyncService,
    IntegrationAuditService,
  ],
})
export class GovernmentIntegrationModule {}
