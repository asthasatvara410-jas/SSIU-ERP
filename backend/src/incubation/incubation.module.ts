import { Module } from '@nestjs/common';
import { IncubationController } from './incubation.controller';
import { IncubationService } from './incubation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [IncubationController],
  providers: [IncubationService],
  exports: [IncubationService],
})
export class IncubationModule {}
