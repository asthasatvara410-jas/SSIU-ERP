import { Module } from '@nestjs/common';
import { CampusServicesController } from './campus-services.controller';
import { CampusServicesService } from './campus-services.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [CampusServicesController],
  providers: [CampusServicesService],
  exports: [CampusServicesService],
})
export class CampusServicesModule {}
