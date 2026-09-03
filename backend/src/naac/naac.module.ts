import { Module } from '@nestjs/common';
import { NaacController } from './naac.controller';
import { NaacService } from './naac.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [NaacController],
  providers: [NaacService],
  exports: [NaacService],
})
export class NaacModule {}
