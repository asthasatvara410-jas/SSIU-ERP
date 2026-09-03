import { Module } from '@nestjs/common';
import { MentorAssignmentService } from './mentor-assignment.service';
import { MentorAssignmentController } from './mentor-assignment.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MentorAssignmentController],
  providers: [MentorAssignmentService],
  exports: [MentorAssignmentService],
})
export class MentorAssignmentModule {}
