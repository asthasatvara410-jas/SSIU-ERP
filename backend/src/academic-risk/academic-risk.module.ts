import { Module } from '@nestjs/common';
import { AcademicRiskController } from './academic-risk.controller';
import { AcademicRiskService } from './academic-risk.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicRiskController],
  providers: [AcademicRiskService],
  exports: [AcademicRiskService],
})
export class AcademicRiskModule {}
