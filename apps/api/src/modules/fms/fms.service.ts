import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FmsTask, FmsTaskStatus } from './entities/fms-task.entity';
import { FmsStep } from './entities/fms-step.entity';
import { FMSTaskStep } from './entities/fms-task-step.entity';
import { FmsMailQueue, MailQueueStatus } from './entities/fms-mail-queue.entity';
import { FmsMaster } from './entities/fms-master.entity';
import { QualityFmsTask, QualityStatus } from './entities/quality-fms-task.entity';
import { PoTracking, PoTrackingStatus } from './entities/po-tracking.entity';
import { EventBusService, ERPEventType } from '../events/event-bus.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  companyId?: string;
  status?: FmsTaskStatus;
  assignedTo?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class FmsService {
  private readonly logger = new Logger(FmsService.name);

  constructor(
    @InjectRepository(FmsTask)
    private readonly taskRepository: Repository<FmsTask>,
    @InjectRepository(FmsStep)
    private readonly stepRepository: Repository<FmsStep>,
    @InjectRepository(FMSTaskStep)
    private readonly taskStepRepository: Repository<FMSTaskStep>,
    @InjectRepository(FmsMailQueue)
    private readonly mailQueueRepository: Repository<FmsMailQueue>,
    @InjectRepository(FmsMaster)
    private readonly masterRepository: Repository<FmsMaster>,
    @InjectRepository(QualityFmsTask)
    private readonly qualityTaskRepository: Repository<QualityFmsTask>,
    @InjectRepository(PoTracking)
    private readonly poTrackingRepository: Repository<PoTracking>,
    private readonly eventBusService: EventBusService,
  ) {}

  // ============ WORKFLOW DEFINITIONS ============

  private mapWorkflow(master: FmsMaster, steps: FmsStep[] = []) {
    return {
      ...master,
      id: master.fmsId,
      workflowName: master.fmsName,
      entityType: master.fmsCode,
      steps: steps.map(step => ({
        ...step,
        id: step.stepId,
        stepName: step.stepName,
        assigneeType: step.assignedDepartment ? 'department' : step.assignedRole ? 'role' : 'user',
        assigneeId: step.assignedDepartment || step.assignedRole || '',
        assigneeName: step.assignedDepartment || step.assignedRole || '',
        slaType: 'hours',
        approvalRequired: false,
        canSkip: false,
      })),
    };
  }

  async findAllWorkflows(params: { page?: number; limit?: number; companyId?: string; search?: string } = {}): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, companyId, search } = params;
    const skip = (page - 1) * limit;
    const query = this.masterRepository
      .createQueryBuilder('master')
      .where('master.isActive = :isActive', { isActive: true });

    if (companyId) {
      query.andWhere('(master.companyId = :companyId OR master.companyId IS NULL)', { companyId });
    }
    if (search) {
      query.andWhere('(master.fmsName ILIKE :search OR master.fmsCode ILIKE :search)', { search: `%${search}%` });
    }

    const [masters, total] = await query
      .orderBy('master.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const steps = await this.findAllSteps({ companyId });
    return {
      data: masters.map(master => this.mapWorkflow(master, steps)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWorkflowById(id: string, companyId?: string) {
    const workflow = await this.masterRepository.findOne({ where: { fmsId: id, isActive: true } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    if (companyId && workflow.companyId && workflow.companyId !== companyId) {
      throw new NotFoundException('Workflow not found');
    }
    const steps = await this.findAllSteps({ companyId: workflow.companyId || companyId });
    return this.mapWorkflow(workflow, steps);
  }

  async createWorkflow(data: any, user?: any) {
    const workflowName = data.workflowName || data.fmsName || 'Workflow';
    const entityType = data.entityType || data.fmsCode || workflowName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const workflow = this.masterRepository.create({
      companyId: user?.companyId || data.companyId || null,
      fmsName: workflowName,
      fmsCode: entityType,
      description: data.description || null,
      isActive: data.isActive ?? true,
      createdBy: user?.userId,
    });
    const savedWorkflow = await this.masterRepository.save(workflow);

    if (Array.isArray(data.steps)) {
      for (const [index, step] of data.steps.entries()) {
        if (!step.stepName) continue;
        await this.stepRepository.save(this.stepRepository.create({
          companyId: savedWorkflow.companyId,
          stepCode: `ACT${String(index + 1).padStart(2, '0')}-${Date.now()}`,
          stepName: step.stepName,
          description: step.description || null,
          sequence: index + 1,
          slaHours: Number(step.slaHours || 24),
          assignedRole: step.assigneeType === 'role' ? step.assigneeName || step.assigneeId : null,
          assignedDepartment: step.assigneeType === 'department' ? step.assigneeName || step.assigneeId : null,
          isActive: step.isActive ?? true,
          createdBy: user?.userId,
        }));
      }
    }

    return this.findWorkflowById(savedWorkflow.fmsId, savedWorkflow.companyId);
  }

  async updateWorkflow(id: string, data: any, user?: any) {
    const workflow = await this.masterRepository.findOne({ where: { fmsId: id } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    if (user?.companyId && workflow.companyId && workflow.companyId !== user.companyId) {
      throw new NotFoundException('Workflow not found');
    }
    if (data.workflowName !== undefined || data.fmsName !== undefined) workflow.fmsName = data.workflowName || data.fmsName;
    if (data.entityType !== undefined || data.fmsCode !== undefined) workflow.fmsCode = data.entityType || data.fmsCode;
    if (data.description !== undefined) workflow.description = data.description || null;
    if (data.isActive !== undefined) workflow.isActive = data.isActive;
    workflow.updatedBy = user?.userId;
    const saved = await this.masterRepository.save(workflow);
    return this.findWorkflowById(saved.fmsId, saved.companyId || user?.companyId);
  }

  async deleteWorkflow(id: string, user?: any) {
    const workflow = await this.masterRepository.findOne({ where: { fmsId: id } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    if (user?.companyId && workflow.companyId && workflow.companyId !== user.companyId) {
      throw new NotFoundException('Workflow not found');
    }
    workflow.isActive = false;
    workflow.updatedBy = user?.userId;
    await this.masterRepository.save(workflow);
    return { deleted: true };
  }

  // ============ TASK OPERATIONS ============

  async createTask(data: Partial<FmsTask>): Promise<FmsTask> {
    const task = this.taskRepository.create(data);
    return this.taskRepository.save(task);
  }

  async findAllTasks(params: PaginationOptions = {}): Promise<PaginatedResult<FmsTask>> {
    const { page = 1, limit = 20, companyId, status, assignedTo, fromDate, toDate, search } = params;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<FmsTask> = { isActive: true };

    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    if (fromDate && toDate) {
      where.plannedStartDate = Between(fromDate, toDate);
    }

    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (companyId) queryBuilder.andWhere('task.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('task.status = :status', { status });
    if (assignedTo) queryBuilder.andWhere('task.assignedTo = :assignedTo', { assignedTo });
    if (search) {
      queryBuilder.andWhere(
        '(task.enquiryOrderNo ILIKE :search OR task.sku ILIKE :search OR task.productName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTaskById(id: string): Promise<FmsTask | null> {
    return this.taskRepository.findOne({ where: { taskId: id, isActive: true } });
  }

  async updateTask(id: string, data: Partial<FmsTask>): Promise<FmsTask | null> {
    await this.taskRepository.update(id, data);
    return this.findTaskById(id);
  }

  async assignTask(id: string, assignedTo: string, assignedBy: string): Promise<FmsTask | null> {
    const task = await this.findTaskById(id);
    if (!task) return null;

    task.assignedTo = assignedTo;
    task.assignedBy = assignedBy;
    if (!task.actualStartDate) {
      task.actualStartDate = new Date();
      task.status = FmsTaskStatus.IN_PROGRESS;
    }

    const saved = await this.taskRepository.save(task);

    // Emit FMS task created/assigned event
    this.eventBusService.emit(
      ERPEventType.FMS_TASK_CREATED,
      saved.companyId || 'system',
      saved.assignedTo,
      {
        taskId: saved.taskId,
        enquiryId: saved.enquiryOrderId,
        enquiryNo: saved.enquiryOrderNo,
        sku: saved.sku,
        stepName: saved.stepName,
        assignedBy,
      }
    );

    return saved;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.taskRepository.update(id, { isActive: false, deletedAt: new Date() });
    return (result.affected ?? 0) > 0;
  }

  // ============ TASK STEPS ============

  async getTaskSteps(taskId: string): Promise<FMSTaskStep[]> {
    return this.taskStepRepository.find({
      where: { fmsTaskId: taskId },
      order: { stepNo: 'ASC' },
    });
  }

  async updateTaskStep(taskStepId: string, data: Partial<FMSTaskStep>): Promise<FMSTaskStep | null> {
    await this.taskStepRepository.update(taskStepId, data);
    return this.taskStepRepository.findOne({ where: { taskStepId } });
  }

  async recordTaskStepHistory(taskId: string, stepData: Partial<FMSTaskStep>): Promise<FMSTaskStep> {
    const step = this.taskStepRepository.create({ ...stepData, fmsTaskId: taskId });
    return this.taskStepRepository.save(step);
  }

  // ============ AUTO TASK CREATION ============

  async createTasksForEnquiry(
    enquiryId: string,
    enquiryNo: string,
    items: Array<{ sku: string; productName: string; quantity: number }>,
    companyId: string,
    userId: string,
  ): Promise<FmsTask[]> {
    const steps = await this.findAllSteps({ companyId });
    const tasks: FmsTask[] = [];

    for (const item of items) {
      for (const step of steps) {
        const plannedStartDate = new Date();
        const plannedEndDate = new Date(plannedStartDate.getTime() + step.slaHours * 60 * 60 * 1000);

        const uniqueKey = `RATEFMS-${enquiryNo}-${item.sku}-${userId}-${step.stepCode}-${Date.now()}`;

        const task = await this.createTask({
          enquiryOrderId: enquiryId,
          enquiryOrderNo: enquiryNo,
          sku: item.sku,
          productName: item.productName,
          companyId,
          createdBy: userId,
          stepCode: step.stepCode,
          stepName: step.stepName,
          plannedStartDate,
          plannedEndDate,
          slaHours: step.slaHours,
          slaDeadline: plannedEndDate,
          status: FmsTaskStatus.PENDING,
          uniqueKey,
        });

        tasks.push(task);

        // Create task steps
        const taskSteps = steps.map((s, index) => ({
          fmsTaskId: task.taskId,
          stepId: s.stepId,
          stepNo: index + 1,
          stepCode: s.stepCode,
          plannedAt: new Date(plannedStartDate.getTime() + index * s.slaHours * 60 * 60 * 1000),
          status: 'pending',
        }));

        await this.taskStepRepository.save(taskSteps);
      }
    }

    return tasks;
  }

  async createFollowUpTasks(parentTaskId: string, userId: string): Promise<FmsTask[]> {
    const parentTask = await this.findTaskById(parentTaskId);
    if (!parentTask) return [];

    const followUpTask = await this.createTask({
      enquiryOrderId: parentTask.enquiryOrderId,
      enquiryOrderNo: parentTask.enquiryOrderNo,
      sku: parentTask.sku,
      productName: parentTask.productName,
      companyId: parentTask.companyId,
      stepCode: parentTask.stepCode,
      stepName: parentTask.stepName,
      assignedBy: userId,
      createdBy: userId,
      plannedStartDate: new Date(),
      plannedEndDate: new Date(Date.now() + (parentTask.slaHours || 24) * 60 * 60 * 1000),
      slaHours: parentTask.slaHours,
      status: FmsTaskStatus.PENDING,
      remarks: `Follow-up task for ${parentTask.uniqueKey}`,
    });

    return [followUpTask];
  }

  // ============ TASK STATS ============

  async getTaskStats(userId?: string): Promise<{
    total: number;
    pending: number;
    delayed: number;
    completed: number;
    escalated: number;
    inProgress: number;
    todayCompleted: number;
    overdue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: FindOptionsWhere<FmsTask> = { isActive: true };
    if (userId) where.assignedTo = userId;

    const [, total] = await this.taskRepository.findAndCount({ where });

    const [, pending] = await this.taskRepository.findAndCount({
      where: { ...where, status: FmsTaskStatus.PENDING },
    });

    const [, inProgress] = await this.taskRepository.findAndCount({
      where: { ...where, status: FmsTaskStatus.IN_PROGRESS },
    });

    const [, completed] = await this.taskRepository.findAndCount({
      where: { ...where, status: FmsTaskStatus.COMPLETED },
    });

    const [, delayed] = await this.taskRepository.findAndCount({
      where: { ...where, status: FmsTaskStatus.DELAYED },
    });

    const [, escalated] = await this.taskRepository.findAndCount({
      where: { ...where, isEscalated: true },
    });

    const [, todayCompletedCount] = await this.taskRepository.findAndCount({
      where: {
        ...where,
        status: FmsTaskStatus.COMPLETED,
        actualEndDate: Between(today, tomorrow),
      },
    });

    const [, overdue] = await this.taskRepository.findAndCount({
      where: {
        ...where,
        slaDeadline: LessThanOrEqual(new Date()),
        status: FmsTaskStatus.IN_PROGRESS,
      },
    });

    return {
      total,
      pending,
      inProgress,
      completed,
      delayed,
      escalated,
      todayCompleted: todayCompletedCount,
      overdue,
    };
  }

  async updateOverdueTasks(): Promise<{ updated: number }> {
    const now = new Date();
    const overdueTasks = await this.taskRepository.find({
      where: {
        slaDeadline: LessThanOrEqual(now),
        status: FmsTaskStatus.IN_PROGRESS as any,
        isActive: true,
      },
    });

    let updated = 0;
    for (const task of overdueTasks) {
      const delayMs = now.getTime() - new Date(task.slaDeadline as any).getTime();
      const delayHours = Math.floor(delayMs / (1000 * 60 * 60));
      await this.taskRepository.update(task.taskId, {
        status: FmsTaskStatus.DELAYED,
        delayHours,
      });
      updated++;
    }

    return { updated };
  }

  async findAllSteps(params: { companyId?: string } = {}): Promise<FmsStep[]> {
    const query = this.stepRepository.createQueryBuilder('step')
      .where('step.isActive = :isActive', { isActive: true });
    
    if (params.companyId) {
      query.andWhere('(step.companyId = :companyId OR step.companyId IS NULL)', { companyId: params.companyId });
    } else {
      query.andWhere('step.companyId IS NULL');
    }

    return query.orderBy('step.sequence', 'ASC').getMany();
  }

  async findStepByCode(code: string): Promise<FmsStep | null> {
    return this.stepRepository.findOne({ where: { stepCode: code, isActive: true } });
  }

  async createStep(data: Partial<FmsStep>): Promise<FmsStep> {
    const step = this.stepRepository.create(data);
    return this.stepRepository.save(step);
  }

  async updateStep(id: string, data: Partial<FmsStep>): Promise<FmsStep | null> {
    await this.stepRepository.update(id, data);
    return this.stepRepository.findOne({ where: { stepId: id } });
  }

  // ============ MASTER OPERATIONS ============

  async findAllMasters(companyId?: string): Promise<FmsMaster[]> {
    const query = this.masterRepository.createQueryBuilder('master')
      .where('master.isActive = :isActive', { isActive: true });
    
    if (companyId) {
      query.andWhere('(master.companyId = :companyId OR master.companyId IS NULL)', { companyId });
    } else {
      query.andWhere('master.companyId IS NULL');
    }

    return query.getMany();
  }

  async createMaster(data: Partial<FmsMaster>): Promise<FmsMaster> {
    const master = this.masterRepository.create(data);
    return this.masterRepository.save(master);
  }

  async updateMaster(id: string, data: Partial<FmsMaster>): Promise<FmsMaster | null> {
    await this.masterRepository.update(id, data);
    return this.masterRepository.findOne({ where: { fmsId: id } });
  }

  // ============ MAIL QUEUE OPERATIONS ============

  async addMailQueue(data: Partial<FmsMailQueue>): Promise<FmsMailQueue> {
    const mail = this.mailQueueRepository.create(data);
    return this.mailQueueRepository.save(mail);
  }

  async getPendingMails(): Promise<FmsMailQueue[]> {
    return this.mailQueueRepository.find({
      where: {
        status: MailQueueStatus.PENDING,
        scheduledFor: LessThanOrEqual(new Date()),
      },
      order: { scheduledFor: 'ASC' },
    });
  }

  async markMailSent(id: string): Promise<void> {
    await this.mailQueueRepository.update(id, {
      status: MailQueueStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markMailFailed(id: string, errorMessage: string): Promise<void> {
    await this.mailQueueRepository.update(id, {
      status: MailQueueStatus.FAILED,
      errorMessage,
    });
  }

  // ============ ADDITIONAL CONTROLLER METHODS ============

  async getMyTasks(userId: string, params: PaginationOptions = {}): Promise<PaginatedResult<FmsTask>> {
    return this.findAllTasks({ ...params, assignedTo: userId });
  }

  async getDelayedTasks(): Promise<FmsTask[]> {
    return this.taskRepository.find({
      where: { isActive: true, status: FmsTaskStatus.DELAYED },
      order: { slaDeadline: 'ASC' },
    });
  }

  async getTasksByEnquiry(enquiryId: string): Promise<FmsTask[]> {
    return this.taskRepository.find({
      where: { enquiryOrderId: enquiryId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async startTask(id: string): Promise<FmsTask | null> {
    const task = await this.findTaskById(id);
    if (!task) return null;

    task.status = FmsTaskStatus.IN_PROGRESS;
    task.actualStartDate = new Date();

    return this.taskRepository.save(task);
  }

  async completeTask(id: string, remarks?: string, completedBy?: string): Promise<FmsTask | null> {
    const task = await this.findTaskById(id);
    if (!task) return null;

    task.status = FmsTaskStatus.COMPLETED;
    task.actualEndDate = new Date();
    if (remarks) task.remarks = remarks;

    const saved = await this.taskRepository.save(task);

    // Emit FMS task completed event
    this.eventBusService.emit(
      ERPEventType.FMS_TASK_COMPLETED,
      saved.companyId || 'system',
      saved.assignedTo,
      {
        taskId: saved.taskId,
        enquiryId: saved.enquiryOrderId,
        enquiryNo: saved.enquiryOrderNo,
        sku: saved.sku,
        stepName: saved.stepName,
        createdBy: saved.createdBy,
        completedBy,
      }
    );

    return saved;
  }

  async escalateTask(id: string, escalatedTo: string, reason?: string, escalatedBy?: string): Promise<FmsTask | null> {
    const task = await this.findTaskById(id);
    if (!task) return null;

    task.isEscalated = true;
    task.escalatedTo = escalatedTo;
    task.escalatedAt = new Date();
    task.status = FmsTaskStatus.ESCALATED;
    if (reason) task.delayReason = reason;

    const saved = await this.taskRepository.save(task);

    // Emit FMS task escalated event
    this.eventBusService.emit(
      ERPEventType.FMS_TASK_ESCALATED,
      saved.companyId || 'system',
      escalatedTo,
      {
        taskId: saved.taskId,
        enquiryId: saved.enquiryOrderId,
        enquiryNo: saved.enquiryOrderNo,
        sku: saved.sku,
        stepName: saved.stepName,
        reason,
        escalatedBy,
      }
    );

    return saved;
  }

  async getTaskHistory(taskId: string): Promise<FMSTaskStep[]> {
    return this.getTaskSteps(taskId);
  }

  async getDashboardStats(userId?: string): Promise<{
    taskStats: {
      total: number;
      pending: number;
      delayed: number;
      completed: number;
      escalated: number;
      inProgress: number;
      todayCompleted: number;
      overdue: number;
    };
    recentTasks: FmsTask[];
    upcomingDeadlines: FmsTask[];
  }> {
    const taskStats = await this.getTaskStats(userId);

    const [recentTasks] = await this.taskRepository.findAndCount({
      where: userId ? { assignedTo: userId, isActive: true } : { isActive: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const upcomingDeadlineDate = new Date();
    upcomingDeadlineDate.setDate(upcomingDeadlineDate.getDate() + 3);

    const [upcomingDeadlines] = await this.taskRepository.findAndCount({
      where: {
        isActive: true,
        status: FmsTaskStatus.IN_PROGRESS,
        slaDeadline: LessThanOrEqual(upcomingDeadlineDate),
      },
      order: { slaDeadline: 'ASC' },
      take: 10,
    });

    return {
      taskStats,
      recentTasks,
      upcomingDeadlines,
    };
  }

  // ============ QUALITY FMS ============

  async createQualityTask(data: Partial<QualityFmsTask>): Promise<QualityFmsTask> {
    const task = this.qualityTaskRepository.create({
      ...data,
      uniqueKey: data.uniqueKey || `QUALFMS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    });
    return this.qualityTaskRepository.save(task);
  }

  async findAllQualityTasks(params: { page?: number; limit?: number; status?: QualityStatus; inspectorId?: string; companyId?: string } = {}) {
    const { page = 1, limit = 20, status, inspectorId, companyId } = params;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<QualityFmsTask> = {};

    if (status) where.status = status;
    if (inspectorId) where.inspectorId = inspectorId;
    if (companyId) where.companyId = companyId;

    const [data, total] = await this.qualityTaskRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findQualityTaskById(id: string): Promise<QualityFmsTask> {
    const task = await this.qualityTaskRepository.findOne({ where: { taskId: id } });
    if (!task) throw new NotFoundException('Quality task not found');
    return task;
  }

  async updateQualityTask(id: string, data: Partial<QualityFmsTask>) {
    await this.qualityTaskRepository.update(id, data);
    return this.findQualityTaskById(id);
  }

  // ============ PO TRACKING ============

  async createPoTracking(data: Partial<PoTracking>): Promise<PoTracking> {
    const tracking = this.poTrackingRepository.create({
      ...data,
      trackingNumber: data.trackingNumber || `POT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    });
    return this.poTrackingRepository.save(tracking);
  }

  async findAllPoTracking(params: { page?: number; limit?: number; status?: PoTrackingStatus; vendorId?: string; companyId?: string } = {}) {
    const { page = 1, limit = 20, status, vendorId, companyId } = params;
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<PoTracking> = {};

    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;
    if (companyId) where.companyId = companyId;

    const [data, total] = await this.poTrackingRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPoTrackingById(id: string): Promise<PoTracking> {
    const tracking = await this.poTrackingRepository.findOne({ where: { trackingId: id } });
    if (!tracking) throw new NotFoundException('PO tracking entry not found');
    return tracking;
  }

  async updatePoTracking(id: string, data: Partial<PoTracking>) {
    await this.poTrackingRepository.update(id, data);
    return this.findPoTrackingById(id);
  }
}
