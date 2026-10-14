import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
  WorkflowTransition,
  InstanceStatus,
} from './entities';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly definitionRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowInstance)
    private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private readonly stepRepo: Repository<WorkflowStep>,
    @InjectRepository(WorkflowTransition)
    private readonly transitionRepo: Repository<WorkflowTransition>,
    @InjectQueue('workflow')
    private readonly workflowQueue: Queue,
  ) {}

  // ========================
  // Workflow Definition
  // ========================
  async createDefinition(data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const definition = this.definitionRepo.create(data);
    return this.definitionRepo.save(definition);
  }

  async updateDefinition(id: string, data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { workflowId: id } });
    if (!definition) throw new NotFoundException('Workflow definition not found');

    Object.assign(definition, data);
    return this.definitionRepo.save(definition);
  }

  async getDefinitions(entityType?: string): Promise<WorkflowDefinition[]> {
    const where = { isActive: true };
    if (entityType) {
      where['entityType'] = entityType;
    }
    return this.definitionRepo.find({
      where,
      relations: ['steps'],
      order: { createdAt: 'DESC' },
    });
  }

  // ========================
  // Workflow Instance
  // ========================
  async startWorkflow(
    definitionId: string,
    entityType: string,
    entityId: string,
    context: Record<string, any>,
    initiatedById: string,
  ): Promise<WorkflowInstance> {
    const definition = await this.definitionRepo.findOne({
      where: { workflowId: definitionId },
      relations: ['steps'],
    });

    if (!definition) throw new NotFoundException('Workflow definition not found');
    if (!definition.isActive) throw new BadRequestException('Workflow is not active');
    if (!definition.steps?.length) throw new BadRequestException('Workflow has no steps');

    // Sort steps by order
    const sortedSteps = definition.steps.sort((a, b) => a.stepOrder - b.stepOrder);
    const firstStep = sortedSteps[0];

    const instance = this.instanceRepo.create({
      workflowId: definitionId,
      entityType,
      entityId,
      status: 'in_progress',
      currentStepId: firstStep.stepId,
      initiatedBy: initiatedById,
      initiatedAt: new Date(),
    });

    const savedInstance = await this.instanceRepo.save(instance);

    // Queue notification job
    await this.workflowQueue.add('notify-step', {
      instanceId: savedInstance.instanceId,
      stepId: firstStep.stepId,
      action: 'started',
    });

    return savedInstance;
  }

  async executeTransition(
    instanceId: string,
    action: string,
    performedById: string,
    options: {
      comment?: string;
      delegatedToUserId?: string;
      delegatedToRoleId?: string;
    } = {},
  ): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({
      where: { instanceId },
      relations: ['workflow', 'workflow.steps'],
    });

    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status === 'completed' || instance.status === 'rejected') {
      throw new BadRequestException('Workflow is already terminated');
    }

    const currentStep = instance.workflow.steps.find(s => s.stepId === instance.currentStepId);
    if (!currentStep) throw new NotFoundException('Current step not found');

    // Create transition record
    const transition = this.transitionRepo.create({
      instanceId,
      fromStepId: currentStep.stepId,
      action,
      actionBy: performedById,
      actionAt: new Date(),
      remarks: options.comment,
      delegatedToUserId: options.delegatedToUserId,
      delegatedToRoleId: options.delegatedToRoleId,
    });

    await this.transitionRepo.save(transition);

    // Process action
    if (action === 'reject') {
      instance.status = 'rejected';
      instance.completedAt = new Date();
      await this.instanceRepo.save(instance);

      await this.workflowQueue.add('notify-completed', {
        instanceId,
        status: 'rejected',
      });

      return instance;
    }

    if (action === 'approve') {
      const sortedSteps = instance.workflow.steps.sort((a, b) => a.stepOrder - b.stepOrder);
      const currentIndex = sortedSteps.findIndex(s => s.stepId === currentStep.stepId);
      const nextStep = sortedSteps[currentIndex + 1];

      if (!nextStep) {
        // Workflow completed
        instance.status = 'completed';
        instance.completedAt = new Date();
        instance.currentStepId = null;
        await this.instanceRepo.save(instance);

        await this.workflowQueue.add('notify-completed', {
          instanceId,
          status: 'completed',
        });

        return instance;
      }

      // Move to next step
      instance.currentStepId = nextStep.stepId;

      await this.instanceRepo.save(instance);

      await this.workflowQueue.add('notify-step', {
        instanceId,
        stepId: nextStep.stepId,
        action: 'approved',
      });

      return instance;
    }

    if (action === 'delegate' && (options.delegatedToUserId || options.delegatedToRoleId)) {
      await this.workflowQueue.add('notify-delegation', {
        instanceId,
        delegatedToUserId: options.delegatedToUserId,
        delegatedToRoleId: options.delegatedToRoleId,
      });
    }

    return instance;
  }

  async getInstance(id: string): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({
      where: { instanceId: id },
      relations: ['workflow', 'workflow.steps', 'transitions'],
    });

    if (!instance) throw new NotFoundException('Workflow instance not found');
    return instance;
  }

  async getInstancesByEntity(entityType: string, entityId: string): Promise<WorkflowInstance[]> {
    return this.instanceRepo.find({
      where: { entityType, entityId },
      relations: ['workflow', 'transitions'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingApprovals(userId: string, roleId: string): Promise<WorkflowInstance[]> {
    // Find instances where current step allows this user/role to approve
    const instances = await this.instanceRepo.find({
      where: { status: 'in_progress' },
      relations: ['workflow', 'workflow.steps'],
    });

    return instances.filter(instance => {
      const currentStep = instance.workflow.steps.find(
        s => s.stepId === instance.currentStepId,
      );
      return (
        currentStep?.approverUserId === userId ||
        currentStep?.approverRoleId === roleId ||
        (!currentStep?.approverUserId && !currentStep?.approverRoleId)
      );
    });
  }
}
