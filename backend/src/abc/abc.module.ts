import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AbcController } from './abc.controller';
import { AbcService } from './abc.service';
import { AbcValidatorService } from './abc-validator.service';
import { AcademicCreditCalculationService } from './academic-credit-calculation.service';
import { AbcSyncService } from './abc-sync.service';
import { SafePlaceholderABCAdapter } from './adapters/safe-placeholder-abc.adapter';

@Module({
  imports: [PrismaModule],
  controllers: [AbcController],
  providers: [
    AbcService,
    AbcValidatorService,
    AcademicCreditCalculationService,
    AbcSyncService,
    SafePlaceholderABCAdapter,
  ],
  exports: [
    AbcService,
    AbcValidatorService,
    AcademicCreditCalculationService,
    AbcSyncService,
    SafePlaceholderABCAdapter,
  ],
})
export class AbcModule {}
