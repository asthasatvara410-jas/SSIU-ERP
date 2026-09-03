import { Module } from '@nestjs/common';
import { InnovationController } from './innovation.controller';
import { InnovationService } from './innovation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [InnovationController],
  providers: [InnovationService],
  exports: [InnovationService],
})
export class InnovationModule {}
