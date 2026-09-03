import { Module } from '@nestjs/common';
import { StudentDataChangeController } from './student-data-change.controller';
import { StudentDataChangeService } from './student-data-change.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentDataChangeController],
  providers: [StudentDataChangeService],
  exports: [StudentDataChangeService],
})
export class StudentDataChangeModule {}
