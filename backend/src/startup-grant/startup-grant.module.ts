import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StartupGrantController } from './startup-grant.controller';
import { StartupGrantService } from './startup-grant.service';
import { StartupService } from './startup.service';
import { SSIPService } from './ssip.service';
import { HackathonService } from './hackathon.service';
import { GrantService } from './grant.service';
import { GrantBudgetService } from './grant-budget.service';
import { GrantUtilizationService } from './grant-utilization.service';
import { StartupAuditService } from './startup-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [StartupGrantController],
  providers: [
    StartupGrantService,
    StartupService,
    SSIPService,
    HackathonService,
    GrantService,
    GrantBudgetService,
    GrantUtilizationService,
    StartupAuditService,
  ],
  exports: [
    StartupGrantService,
    StartupService,
    SSIPService,
    HackathonService,
    GrantService,
    GrantBudgetService,
    GrantUtilizationService,
    StartupAuditService,
  ],
})
export class StartupGrantModule {}
