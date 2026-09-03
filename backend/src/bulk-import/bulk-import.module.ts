import { Module } from '@nestjs/common';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';
import { TemplateGeneratorService } from './template-generator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BulkImportController],
  providers: [BulkImportService, TemplateGeneratorService],
  exports: [BulkImportService, TemplateGeneratorService],
})
export class BulkImportModule {}
