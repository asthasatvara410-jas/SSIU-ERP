import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DigiLockerController } from './digilocker.controller';
import { DigiLockerService } from './digilocker.service';
import { DigiLockerConfig } from './digilocker.config';
import { DigiLockerAuthService } from './digilocker-auth.service';
import { DigiLockerDocumentService } from './digilocker-document.service';
import { DigiLockerWebhookService } from './digilocker-webhook.service';
import { DigiLockerAuditService } from './digilocker-audit.service';
import { OfficialDigiLockerAdapter } from './adapters/official-digilocker.adapter';
import { MockDigiLockerAdapter } from './adapters/mock-digilocker.adapter';
import { ProductionDigiLockerProvider } from './adapters/production-digilocker.provider';
import { DemoDigiLockerProvider } from './adapters/demo-digilocker.provider';

@Module({
  imports: [PrismaModule],
  controllers: [DigiLockerController],
  providers: [
    DigiLockerService,
    DigiLockerConfig,
    DigiLockerAuthService,
    DigiLockerDocumentService,
    DigiLockerWebhookService,
    DigiLockerAuditService,
    OfficialDigiLockerAdapter,
    MockDigiLockerAdapter,
    ProductionDigiLockerProvider,
    DemoDigiLockerProvider,
  ],
  exports: [
    DigiLockerService,
    DigiLockerConfig,
    DigiLockerAuthService,
    DigiLockerDocumentService,
    DigiLockerWebhookService,
    DigiLockerAuditService,
    OfficialDigiLockerAdapter,
    MockDigiLockerAdapter,
    ProductionDigiLockerProvider,
    DemoDigiLockerProvider,
  ],
})
export class DigiLockerModule {}
