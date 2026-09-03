import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDefinitionDto } from './dto/create-workflow-definition.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { CreateDelegationDto } from './dto/create-delegation.dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. Workflow Definition Management
  async createDefinition(dto: CreateWorkflowDefinitionDto, createdByUserId?: string) {
    const existing = await this.prisma.workflowDefinition.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) throw new BadRequestException(`Workflow Definition with code '${dto.code}' already exists.`);

    return this.prisma.workflowDefinition.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        module: dto.module.trim().toUpperCase(),
        requestType: dto.requestType.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description,
        createdBy: createdByUserId,
        steps: {
          create: dto.steps.map((step) => ({
            stepNumber: step.stepNumber,
            stepName: step.stepName,
            requiredRoleCode: step.requiredRoleCode.toUpperCase(),
            minAuthorityLevel: step.minAuthorityLevel ?? 10,
            actionsAllowed: Array.isArray(step.actionsAllowed) ? step.actionsAllowed.join(',') : step.actionsAllowed,
            slaHours: step.slaHours ?? 24,
            isRequired: step.isRequired ?? true,
          })),
        },
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async getDefinitions() {
    return this.prisma.workflowDefinition.findMany({
      include: { steps: { orderBy: { stepNumber: 'asc' } }, _count: { select: { instances: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDefinitionByCode(code: string) {
    const def = await this.prisma.workflowDefinition.findUnique({
      where: { code: code.toUpperCase() },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!def) throw new NotFoundException(`Workflow Definition '${code}' not found.`);
    return def;
  }

  // 2. Workflow Instance Lifecycle
  async startInstance(dto: StartWorkflowDto, requestedByUserId: string) {
    const definition = await this.prisma.workflowDefinition.findUnique({
      where: { code: dto.definitionCode.toUpperCase() },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!definition || definition.status !== 'ACTIVE') {
      throw new BadRequestException(`Workflow Definition '${dto.definitionCode}' is not active or does not exist.`);
    }

    const firstStep = definition.steps.find((s) => s.stepNumber === 1);
    const dueDate = firstStep?.slaHours
      ? new Date(Date.now() + firstStep.slaHours * 60 * 60 * 1000)
      : undefined;

    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          workflowDefinitionId: definition.id,
          entityId: dto.entityId,
          module: definition.module,
          currentStatus: 'SUBMITTED',
          currentStepNumber: 1,
          currentAssigneeRoleId: firstStep?.requiredRoleCode,
          requestedByUserId,
          dueDate,
          priority: dto.priority || 'NORMAL',
        },
      });

      // Record initial history
      const requesterUser = await tx.user.findUnique({
        where: { id: requestedByUserId },
        include: { userRoles: { include: { role: true } } },
      });

      const primaryRole = requesterUser?.userRoles[0]?.role;

      await tx.workflowHistory.create({
        data: {
          instanceId: instance.id,
          action: 'SUBMIT',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          performedByUserId: requestedByUserId,
          performedByRoleId: primaryRole?.code || 'USER',
          performedByAuthorityLevel: primaryRole?.authorityLevel || 10,
          stepNumber: 1,
          comments: dto.initialComments || 'Workflow request submitted.',
        },
      });

      return instance;
    });
  }

  async executeAction(instanceId: string, dto: WorkflowActionDto, userId: string) {
    const action = dto.action.toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.findUnique({
        where: { id: instanceId },
        include: {
          workflowDefinition: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
          requestedByUser: true,
        },
      });

      if (!instance) throw new NotFoundException('Workflow instance not found.');

      if (['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'LOCKED'].includes(instance.currentStatus)) {
        throw new BadRequestException(`Cannot execute action on workflow instance in final state '${instance.currentStatus}'.`);
      }

      // Fetch user profile and roles
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: { include: { role: true } },
          student: true,
          faculty: true,
        },
      });

      if (!user || user.accountStatus !== 'ACTIVE') {
        throw new ForbiddenException('Authenticated user is inactive or not found.');
      }

      // Check active delegations
      const activeDelegations = await tx.workflowDelegation.findMany({
        where: {
          delegateeUserId: userId,
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
        },
      });

      const activeRoles = user.userRoles.map((ur) => ur.role);
      let userMaxAuthority = Math.max(
        0,
        ...activeRoles.map((r) => r.authorityLevel),
        ...activeDelegations.map((d) => d.minAuthorityLevel)
      );

      const currentStep = instance.workflowDefinition.steps.find((s) => s.stepNumber === instance.currentStepNumber);
      const totalSteps = instance.workflowDefinition.steps.length;

      if (!currentStep) throw new BadRequestException(`Workflow step ${instance.currentStepNumber} configuration missing.`);

      const isSysAdmin = activeRoles.some((r) => r.code === 'SYSTEM_ADMIN');

      // Validate allowed actions for current step
      const allowedActionsForStep = currentStep.actionsAllowed.split(',').map((a) => a.trim().toUpperCase());
      if (!isSysAdmin && !allowedActionsForStep.includes(action)) {
        throw new ForbiddenException(`Action '${action}' is not permitted at step ${currentStep.stepNumber} (${currentStep.stepName}). Allowed: ${currentStep.actionsAllowed}`);
      }

      // Validate minimum authority level
      if (!isSysAdmin && userMaxAuthority < currentStep.minAuthorityLevel) {
        throw new ForbiddenException(
          `Authority Violation: Required authority level ${currentStep.minAuthorityLevel} for step '${currentStep.stepName}'. Your effective level is ${userMaxAuthority}.`
        );
      }

      // Determine next status and step
      let nextStatus = instance.currentStatus;
      let nextStepNumber = instance.currentStepNumber;
      let isCompleted = false;

      if (action === 'REJECT') {
        if (!dto.comments || dto.comments.trim().length === 0) {
          throw new BadRequestException('Rejection requires a mandatory comment/reason.');
        }
        nextStatus = 'REJECTED';
        isCompleted = true;
      } else if (action === 'RETURN') {
        if (!dto.comments || dto.comments.trim().length === 0) {
          throw new BadRequestException('Return action requires a mandatory comment/reason.');
        }
        nextStatus = 'RETURNED';
        nextStepNumber = Math.max(1, instance.currentStepNumber - 1);
      } else if (action === 'APPROVE') {
        if (instance.currentStepNumber >= totalSteps) {
          nextStatus = 'APPROVED';
          isCompleted = true;
        } else {
          nextStatus = 'APPROVAL_PENDING';
          nextStepNumber = instance.currentStepNumber + 1;
        }
      } else if (action === 'FORWARD') {
        nextStatus = 'FORWARDED';
        nextStepNumber = Math.min(totalSteps, instance.currentStepNumber + 1);
      } else if (action === 'RECOMMEND') {
        nextStatus = 'RECOMMENDED';
      } else if (action === 'VERIFY') {
        nextStatus = 'VERIFIED';
      }

      const nextAssigneeRole = instance.workflowDefinition.steps.find((s) => s.stepNumber === nextStepNumber)?.requiredRoleCode;

      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentStatus: nextStatus,
          currentStepNumber: nextStepNumber,
          currentAssigneeRoleId: nextAssigneeRole,
          completedAt: isCompleted ? new Date() : undefined,
        },
      });

      // Record History
      await tx.workflowHistory.create({
        data: {
          instanceId,
          action,
          fromStatus: instance.currentStatus,
          toStatus: nextStatus,
          performedByUserId: userId,
          performedByRoleId: activeRoles[0]?.code || 'USER',
          performedByAuthorityLevel: userMaxAuthority,
          stepNumber: instance.currentStepNumber,
          comments: dto.comments || `Executed ${action} action.`,
          attachmentUrl: dto.attachmentUrl,
        },
      });

      this.logger.log(`Workflow Instance ${instanceId} transitioned from ${instance.currentStatus} to ${nextStatus} by user ${user.erpId}`);
      return updatedInstance;
    });
  }

  // 3. Queries & Auditing
  async getPendingForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found.');

    const activeRoles = user.userRoles.map((ur) => ur.role.code);

    return this.prisma.workflowInstance.findMany({
      where: {
        currentStatus: { in: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'RECOMMENDED', 'FORWARDED', 'APPROVAL_PENDING', 'RETURNED'] },
        currentAssigneeRoleId: { in: activeRoles },
      },
      include: {
        workflowDefinition: { select: { code: true, name: true, module: true } },
        requestedByUser: { select: { erpId: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRequests(userId: string) {
    return this.prisma.workflowInstance.findMany({
      where: { requestedByUserId: userId },
      include: {
        workflowDefinition: { select: { code: true, name: true, module: true } },
        histories: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInstanceHistory(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflowDefinition: { include: { steps: true } },
        requestedByUser: { select: { id: true, erpId: true, username: true } },
        histories: {
          include: {
            performedByUser: { select: { erpId: true, username: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) throw new NotFoundException('Workflow instance not found.');
    return instance;
  }

  // 4. Delegation Subsystem
  async createDelegation(delegatorUserId: string, dto: CreateDelegationDto) {
    const delegator = await this.prisma.user.findUnique({
      where: { id: delegatorUserId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!delegator) throw new NotFoundException('Delegator user not found.');

    const isSysAdmin = delegator.userRoles.some((ur) => ur.role.code === 'SYSTEM_ADMIN');
    const maxAuthority = Math.max(0, ...delegator.userRoles.map((ur) => ur.role.authorityLevel));

    if (!isSysAdmin && maxAuthority < dto.minAuthorityLevel) {
      throw new ForbiddenException(
        `Delegation Ceiling Violation: Cannot delegate authority level (${dto.minAuthorityLevel}) exceeding your own level (${maxAuthority}).`
      );
    }

    return this.prisma.workflowDelegation.create({
      data: {
        delegatorUserId,
        delegateeUserId: dto.delegateeUserId,
        minAuthorityLevel: dto.minAuthorityLevel,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: 'ACTIVE',
      },
    });
  }

  async getDelegations() {
    return this.prisma.workflowDelegation.findMany({
      where: { status: 'ACTIVE' },
      include: {
        delegatorUser: { select: { erpId: true, username: true } },
        delegateeUser: { select: { erpId: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
