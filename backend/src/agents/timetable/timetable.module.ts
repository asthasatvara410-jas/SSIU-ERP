import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AgentPlatformModule } from '../../agent-platform/agent-platform.module';
import { TimetableAgentPolicyEngine } from './timetable.policy';
import { TimetableAgentTools } from './timetable.tools';
import { TimetableAgentService } from './timetable.service';
import { TimetableAgentController } from './timetable.controller';

@Module({
  imports: [PrismaModule, AgentPlatformModule],
  controllers: [TimetableAgentController],
  providers: [
    TimetableAgentPolicyEngine,
    TimetableAgentTools,
    TimetableAgentService,
  ],
  exports: [
    TimetableAgentService,
    TimetableAgentPolicyEngine,
    TimetableAgentTools,
  ],
})
export class TimetableAgentModule {}
