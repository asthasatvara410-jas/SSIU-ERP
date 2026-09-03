import { Module } from '@nestjs/common';
import { OrganogramController } from './organogram.controller';
import { OrganogramService } from './organogram.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [OrganogramController],
  providers: [OrganogramService],
  exports: [OrganogramService],
})
export class OrganogramModule {}
