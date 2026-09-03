import { Module } from '@nestjs/common';
import { WorkManagementController } from './work-management.controller';
import { WorkManagementService } from './work-management.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkManagementController],
  providers: [WorkManagementService],
  exports: [WorkManagementService],
})
export class WorkManagementModule {}
