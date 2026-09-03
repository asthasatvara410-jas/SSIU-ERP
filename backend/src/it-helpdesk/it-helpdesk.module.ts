import { Module } from '@nestjs/common';
import { ItHelpdeskController } from './it-helpdesk.controller';
import { ItHelpdeskService } from './it-helpdesk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [ItHelpdeskController],
  providers: [ItHelpdeskService],
  exports: [ItHelpdeskService],
})
export class ItHelpdeskModule {}
