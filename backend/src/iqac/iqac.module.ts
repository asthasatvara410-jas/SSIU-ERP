import { Module } from '@nestjs/common';
import { IqacController } from './iqac.controller';
import { IqacService } from './iqac.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [IqacController],
  providers: [IqacService],
  exports: [IqacService],
})
export class IqacModule {}
