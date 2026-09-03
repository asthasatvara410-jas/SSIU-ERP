import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentHandler, AgentKey, AgentStatus, AgentMode, AutonomyLevel } from '../types/agent.types';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegisteredAgentMetadata {
  key: AgentKey;
  code: string;
  name: string;
  description: string;
  category: string;
  version: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  mode: AgentMode;
  isImplemented: boolean;
  enabled: boolean;
}

@Injectable()
export class AgentRegistryService implements OnModuleInit {
  private readonly logger = new Logger('AgentRegistryService');
  private readonly handlers = new Map<AgentKey, AgentHandler>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPlannedAgents();
  }

  /**
   * Seeds the initial planned agents into database with DRAFT status and APPROVAL_REQUIRED autonomy.
   */
  async seedPlannedAgents(): Promise<void> {
    const plannedAgents = [
      {
        code: 'TIMETABLE_SUBSTITUTION_AGENT',
        name: 'Autonomous Timetable & Faculty Substitution Agent',
        description: 'Autonomous resolution of faculty absence, peer workload ranking, and lecture schedule substitution.',
        category: 'TIMETABLE_SUBSTITUTION',
        version: '1.0.0',
        status: 'DRAFT',
        autonomyLevel: 'APPROVAL_REQUIRED' as AutonomyLevel,
      },
      {
        code: 'DOCUMENT_VERIFICATION_AGENT',
        name: 'Smart Document Verifier & Processor',
        description: 'Autonomous OCR extraction, student entity cross-matching, and verification confidence evaluation.',
        category: 'DOCUMENT_VERIFICATION',
        version: '1.0.0',
        status: 'DRAFT',
        autonomyLevel: 'APPROVAL_REQUIRED' as AutonomyLevel,
      },
      {
        code: 'FEE_RECOVERY_AGENT',
        name: 'Proactive Fee Recovery Agent',
        description: 'Autonomous fee recovery monitoring, conversational payment negotiation, and compliant installment plan management.',
        category: 'FEE_RECOVERY',
        version: '1.0.0',
        status: 'DRAFT',
        autonomyLevel: 'APPROVAL_REQUIRED' as AutonomyLevel,
      },
    ];

    for (const agent of plannedAgents) {
      try {
        await this.prisma.agent.upsert({
          where: { code: agent.code },
          create: {
            code: agent.code,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            version: agent.version,
            status: agent.status,
            tenantId: 'DEFAULT',
          },
          update: {
            name: agent.name,
            description: agent.description,
            category: agent.category,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not seed agent record '${agent.code}': ${err.message}`);
      }
    }
  }

  register(key: AgentKey, handler: AgentHandler): void {
    this.handlers.set(key, handler);
    this.logger.log(`Registered agent handler for key: '${key}' (version: ${handler.version})`);
  }

  get(key: AgentKey): AgentHandler | undefined {
    return this.handlers.get(key);
  }

  has(key: AgentKey): boolean {
    return this.handlers.has(key);
  }

  unregister(key: AgentKey): boolean {
    return this.handlers.delete(key);
  }

  listRegisteredKeys(): AgentKey[] {
    return Array.from(this.handlers.keys());
  }

  async getAllAgents(tenantId: string = 'DEFAULT'): Promise<RegisteredAgentMetadata[]> {
    const dbAgents = await this.prisma.agent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return dbAgents.map((a) => ({
      key: a.code,
      code: a.code,
      name: a.name,
      description: a.description || '',
      category: a.category,
      version: a.version,
      status: a.status as AgentStatus,
      autonomyLevel: 'APPROVAL_REQUIRED' as AutonomyLevel,
      mode: 'DRY_RUN' as AgentMode,
      isImplemented: this.handlers.has(a.code),
      enabled: a.status === 'ACTIVE',
    }));
  }

  async updateAgentStatus(key: AgentKey, status: AgentStatus, tenantId: string = 'DEFAULT') {
    return this.prisma.agent.update({
      where: { code: key },
      data: { status },
    });
  }
}
