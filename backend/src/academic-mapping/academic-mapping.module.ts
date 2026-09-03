import { Global, Module } from '@nestjs/common';
import { AcademicMappingService } from './academic-mapping.service';
import { AcademicMappingController } from './academic-mapping.controller';

@Global()
@Module({
  controllers: [AcademicMappingController],
  providers: [AcademicMappingService],
  exports: [AcademicMappingService],
})
export class AcademicMappingModule {}
