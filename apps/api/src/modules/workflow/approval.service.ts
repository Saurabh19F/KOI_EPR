import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ApprovalRequest,
  ApprovalStatus,
  ApprovalLevel,
} from './entities/approval.entity';
import {
  CreateApprovalRequestDto,
  ApprovalType,
  ApprovalSummaryDto,
} from './dto/approval.dto';

export interface ApprovalContext {
  userId: string;
  userName: string;
  userRole: string;
  userLevel: number;
}

// Amount thresholds for approval levels
const AMOUNT_THRESHOLDS = [
  { level: ApprovalLevel.LEVEL_1, maxAmount: 50000 },      // Up to 50K - Purchase Manager
  { level: ApprovalLevel.LEVEL_2, maxAmount: 200000 },    // Up to 2L - Costing Manager
  { level: ApprovalLevel.LEVEL_3, maxAmount: 500000 },     // Up to 5L - Management
  { level: ApprovalLevel.LEVEL_4, maxAmount: Infinity },  // Above 5L - Director
];

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private approvalRepo: Repository<ApprovalRequest>,
    @InjectQueue('workflow')
    private workflowQueue: Queue,
  ) {}

  /**
   * Create a new approval request
   */
  async createRequest(
    dto: CreateApprovalRequestDto,
    context: ApprovalContext,
  ): Promise<ApprovalRequest> {
    // Determine required approval level based on amount
    const requiredLevel = this.getRequiredApprovalLevel(dto.amount || 0);

    const approval = this.approvalRepo.create({
      approvalType: dto.approvalType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      entityReference: dto.entityReference,
      requesterId: context.userId,
      requesterName: context.userName,
      requesterRole: context.userRole,
      currentLevel: ApprovalLevel.LEVEL_1,
      requiredLevel,
      amount: dto.amount,
      previousAmount: dto.previousAmount,
      justification: dto.justification,
      requestNotes: dto.requestNotes,
      contextData: dto.contextData,
      priority: dto.priority || 'normal',
      status: ApprovalStatus.PENDING,
    });

    const saved = await this.approvalRepo.save(approval);

    // Queue notification
    await this.notifyApprovers(saved);

    return this.findById(saved.approvalId);
  }

  /**
   * Get approval by ID
   */
  async findById(id: string): Promise<ApprovalRequest> {
    const approval = await this.approvalRepo.findOne({
      where: { approvalId: id, deletedAt: IsNull() },
    });
    if (!approval) throw new NotFoundException('Approval request not found');
    return approval;
  }

  /**
   * Get all approvals with filters
   */
  async findAll(params: {
    page?: number;
    limit?: number;
    status?: ApprovalStatus;
    approvalType?: ApprovalType;
    entityType?: string;
    search?: string;
    myApprovals?: boolean;
    requesterId?: string;
  }): Promise<{ data: ApprovalRequest[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 20, status, approvalType, entityType, search, myApprovals, requesterId } = params;

    const where: any = { deletedAt: IsNull() };

    if (status) where.status = status;
    if (approvalType) where.approvalType = approvalType;
    if (entityType) where.entityType = entityType;
    if (requesterId) where.requesterId = requesterId;
    if (search) {
      where.entityReference = ILike(`%${search}%`);
    }

    // For myApprovals, filter by current level
    if (myApprovals) {
      // In a real system, we'd filter by approver ID/role
      // For now, show all pending
      where.status = ApprovalStatus.PENDING;
    }

    const [data, total] = await this.approvalRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get approvals pending for a specific user/role
   */
  async getPendingApprovals(userId: string, userRole: string, userLevel: number): Promise<ApprovalRequest[]> {
    // Find pending approvals where:
    // 1. Current level matches user's level, OR
    // 2. Current level is below user's level (can escalate)
    const approvals = await this.approvalRepo.find({
      where: { status: ApprovalStatus.PENDING, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });

    // Filter approvals that this user can approve
    return approvals.filter(a => {
      // Check if user is at the right level or above
      if (a.currentLevel <= userLevel) {
        return true;
      }
      return false;
    });
  }

  /**
   * Approve an approval request
   */
  async approve(
    approvalId: string,
    context: ApprovalContext,
    remarks?: string,
  ): Promise<ApprovalRequest> {
    const approval = await this.findById(approvalId);

    // Validate user can approve at this level
    if (context.userLevel < approval.currentLevel) {
      throw new ForbiddenException(`You need level ${approval.currentLevel} authority to approve this request`);
    }

    // Cannot approve own request
    if (approval.requesterId === context.userId) {
      throw new BadRequestException('You cannot approve your own request');
    }

    // Record approval at current level
    const levelField = `level${approval.currentLevel}ApproverId`;
    const levelNameField = `level${approval.currentLevel}ApproverName`;
    const levelAtField = `level${approval.currentLevel}ApprovedAt`;
    const levelRemarksField = `level${approval.currentLevel}Remarks`;

    (approval as any)[levelField] = context.userId;
    (approval as any)[levelNameField] = context.userName;
    (approval as any)[levelAtField] = new Date();
    if (remarks) (approval as any)[levelRemarksField] = remarks;

    // Check if all levels are complete
    if (approval.currentLevel >= approval.requiredLevel) {
      approval.status = ApprovalStatus.APPROVED;
      (approval as any).completedAt = new Date();
    } else {
      // Move to next level
      approval.currentLevel = (approval.currentLevel + 1) as ApprovalLevel;
    }

    await this.approvalRepo.save(approval);

    // Queue notifications
    await this.workflowQueue.add('approval-action', {
      approvalId,
      action: 'approved',
      approvedBy: context.userId,
    });

    // If fully approved, trigger downstream action
    if (approval.status === ApprovalStatus.APPROVED) {
      await this.workflowQueue.add('approval-completed', {
        approvalId,
        entityType: approval.entityType,
        entityId: approval.entityId,
      });
    }

    return this.findById(approvalId);
  }

  /**
   * Reject an approval request
   */
  async reject(
    approvalId: string,
    reason: string,
    context: ApprovalContext,
    remarks?: string,
  ): Promise<ApprovalRequest> {
    const approval = await this.findById(approvalId);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only reject pending requests');
    }

    if (approval.requesterId === context.userId) {
      throw new BadRequestException('You cannot reject your own request');
    }

    approval.status = ApprovalStatus.REJECTED;
    approval.rejectedById = context.userId;
    approval.rejectedByName = context.userName;
    approval.rejectedAt = new Date();
    approval.rejectionReason = reason;
    if (remarks) approval.rejectionReason += `\nRemarks: ${remarks}`;

    await this.approvalRepo.save(approval);

    // Queue notification
    await this.workflowQueue.add('approval-action', {
      approvalId,
      action: 'rejected',
      rejectedBy: context.userId,
      reason,
    });

    return approval;
  }

  /**
   * Request revision on an approval
   */
  async requestRevision(
    approvalId: string,
    revisionNotes: string,
    context: ApprovalContext,
    remarks?: string,
  ): Promise<ApprovalRequest> {
    const approval = await this.findById(approvalId);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only request revision on pending requests');
    }

    approval.status = ApprovalStatus.REVISION_REQUESTED;
    approval.revisionNotes = revisionNotes;
    approval.revisionRequestedById = context.userId;
    approval.revisionRequestedByName = context.userName;
    approval.revisionRequestedAt = new Date();

    await this.approvalRepo.save(approval);

    // Queue notification
    await this.workflowQueue.add('approval-action', {
      approvalId,
      action: 'revision_requested',
      requestedBy: context.userId,
      revisionNotes,
    });

    return approval;
  }

  /**
   * Resubmit a rejected/revised request
   */
  async resubmit(
    approvalId: string,
    context: ApprovalContext,
  ): Promise<ApprovalRequest> {
    const approval = await this.findById(approvalId);

    if (approval.status !== ApprovalStatus.REJECTED &&
        approval.status !== ApprovalStatus.REVISION_REQUESTED) {
      throw new BadRequestException('Can only resubmit rejected or revision-requested requests');
    }

    if (approval.requesterId !== context.userId) {
      throw new ForbiddenException('Only the requester can resubmit');
    }

    // Reset approval levels
    approval.status = ApprovalStatus.PENDING;
    approval.currentLevel = ApprovalLevel.LEVEL_1;
    approval.level1ApproverId = null;
    approval.level1ApproverName = null;
    approval.level1ApprovedAt = null;
    approval.level2ApproverId = null;
    approval.level2ApproverName = null;
    approval.level2ApprovedAt = null;
    approval.level3ApproverId = null;
    approval.level3ApproverName = null;
    approval.level3ApprovedAt = null;
    approval.rejectedById = null;
    approval.rejectedByName = null;
    approval.rejectedAt = null;
    approval.rejectionReason = null;

    await this.approvalRepo.save(approval);

    // Queue notification
    await this.notifyApprovers(approval);

    return this.findById(approvalId);
  }

  /**
   * Delegate approval to another user/role
   */
  async delegate(
    approvalId: string,
    toUserId: string,
    toRoleId: string,
    reason: string,
    context: ApprovalContext,
  ): Promise<ApprovalRequest> {
    const approval = await this.findById(approvalId);

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Can only delegate pending approvals');
    }

    // For now, just log the delegation
    // In a real system, we'd update the approver fields
    await this.workflowQueue.add('approval-delegated', {
      approvalId,
      fromUserId: context.userId,
      fromUserName: context.userName,
      toUserId,
      toRoleId,
      reason,
    });

    return approval;
  }

  /**
   * Get approval summary statistics
   */
  async getSummary(requesterId?: string): Promise<ApprovalSummaryDto> {
    const where: any = { deletedAt: IsNull() };
    if (requesterId) where.requesterId = requesterId;

    const [pending, approved, rejected, revisionRequested] = await Promise.all([
      this.approvalRepo.count({ where: { ...where, status: ApprovalStatus.PENDING } }),
      this.approvalRepo.count({ where: { ...where, status: ApprovalStatus.APPROVED } }),
      this.approvalRepo.count({ where: { ...where, status: ApprovalStatus.REJECTED } }),
      this.approvalRepo.count({ where: { ...where, status: ApprovalStatus.REVISION_REQUESTED } }),
    ]);

    return {
      pending,
      approved,
      rejected,
      revisionRequested,
      total: pending + approved + rejected + revisionRequested,
    };
  }

  /**
   * Check if approval is required for an amount
   */
  private getRequiredApprovalLevel(amount: number): ApprovalLevel {
    for (const threshold of AMOUNT_THRESHOLDS) {
      if (amount <= threshold.maxAmount) {
        return threshold.level;
      }
    }
    return ApprovalLevel.LEVEL_4;
  }

  /**
   * Notify approvers of new request
   */
  private async notifyApprovers(approval: ApprovalRequest): Promise<void> {
    await this.workflowQueue.add('approval-notification', {
      approvalId: approval.approvalId,
      approvalType: approval.approvalType,
      entityReference: approval.entityReference,
      amount: approval.amount,
      requesterName: approval.requesterName,
      requiredLevel: approval.requiredLevel,
    });
  }

  /**
   * Link approval to purchase quote workflow
   */
  async linkToPurchaseQuote(
    quoteId: string,
    quoteNo: string,
    amount: number,
    context: ApprovalContext,
  ): Promise<ApprovalRequest> {
    return this.createRequest({
      approvalType: ApprovalType.PURCHASE_QUOTE,
      entityType: 'purchase_quote',
      entityId: quoteId,
      entityReference: quoteNo,
      amount,
      justification: `Purchase quote approval required for amount ${amount}`,
    }, context);
  }
}
