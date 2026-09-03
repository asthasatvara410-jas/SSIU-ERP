import { Module } from '@nestjs/common';
import { EdpController } from './edp.controller';
import { EdpService } from './edp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EdpController],
  providers: [EdpService],
  exports: [EdpService],
})
export class EdpModule {}
