import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentCouncilController } from './student-council.controller';
import { StudentCouncilService } from './student-council.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentCouncilController],
  providers: [StudentCouncilService],
  exports: [StudentCouncilService],
})
export class StudentCouncilModule {}
