import { Module } from '@nestjs/common';
import { StudentServicesController } from './student-services.controller';
import { StudentServicesService } from './student-services.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [StudentServicesController],
  providers: [StudentServicesService],
  exports: [StudentServicesService],
})
export class StudentServicesModule {}
