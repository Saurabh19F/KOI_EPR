import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested',
}

export enum ApprovalLevel {
  LEVEL_1 = 1, // Purchase Manager
  LEVEL_2 = 2, // Costing Manager
  LEVEL_3 = 3,  // Management
  LEVEL_4 = 4,  // Director
}

@Entity('approval_requests')
@Index(['entityType', 'entityId'])
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  approvalId: string;

  @Column({ name: 'approval_type' })
  approvalType: string; // 'purchase_quote', 'vendor_selection', 'rate_finalization'

  @Column({ name: 'entity_type' })
  entityType: string; // 'purchase_quote', 'sales_enquiry'

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'entity_reference' })
  entityReference: string; // Quote number, enquiry number, etc.

  @Column({ name: 'requester_id' })
  requesterId: string;

  @Column({ name: 'requester_name' })
  requesterName: string;

  @Column({ name: 'requester_role' })
  requesterRole: string;

  @Column({ type: 'int', default: ApprovalLevel.LEVEL_1 })
  currentLevel: number;

  @Column({ type: 'int', default: ApprovalLevel.LEVEL_1 })
  requiredLevel: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  previousAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  variance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  variancePercent: number;

  @Column({ type: 'text', nullable: true })
  justification: string;

  @Column({ type: 'text', nullable: true })
  requestNotes: string;

  // Level-specific approvals
  @Column({ name: 'level1ApproverId', nullable: true })
  level1ApproverId: string;

  @Column({ name: 'level1ApproverName', nullable: true })
  level1ApproverName: string;

  @Column({ name: 'level1ApprovedAt', nullable: true })
  level1ApprovedAt: Date;

  @Column({ name: 'level1Remarks', type: 'text', nullable: true })
  level1Remarks: string;

  @Column({ name: 'level2ApproverId', nullable: true })
  level2ApproverId: string;

  @Column({ name: 'level2ApproverName', nullable: true })
  level2ApproverName: string;

  @Column({ name: 'level2ApprovedAt', nullable: true })
  level2ApprovedAt: Date;

  @Column({ name: 'level2Remarks', type: 'text', nullable: true })
  level2Remarks: string;

  @Column({ name: 'level3ApproverId', nullable: true })
  level3ApproverId: string;

  @Column({ name: 'level3ApproverName', nullable: true })
  level3ApproverName: string;

  @Column({ name: 'level3ApprovedAt', nullable: true })
  level3ApprovedAt: Date;

  @Column({ name: 'level3Remarks', type: 'text', nullable: true })
  level3Remarks: string;

  @Column({ name: 'finalApproverId', nullable: true })
  finalApproverId: string;

  @Column({ name: 'finalApproverName', nullable: true })
  finalApproverName: string;

  @Column({ name: 'finalApprovedAt', nullable: true })
  finalApprovedAt: Date;

  @Column({ name: 'finalRemarks', type: 'text', nullable: true })
  finalRemarks: string;

  // Rejection tracking
  @Column({ name: 'rejectedById', nullable: true })
  rejectedById: string;

  @Column({ name: 'rejectedByName', nullable: true })
  rejectedByName: string;

  @Column({ name: 'rejectedAt', nullable: true })
  rejectedAt: Date;

  @Column({ name: 'rejectionReason', type: 'text', nullable: true })
  rejectionReason: string;

  // Revision tracking
  @Column({ name: 'revisionNotes', type: 'text', nullable: true })
  revisionNotes: string;

  @Column({ name: 'revisionRequestedById', nullable: true })
  revisionRequestedById: string;

  @Column({ name: 'revisionRequestedByName', nullable: true })
  revisionRequestedByName: string;

  @Column({ name: 'revisionRequestedAt', nullable: true })
  revisionRequestedAt: Date;

  // Additional context data (JSON)
  @Column({ type: 'jsonb', nullable: true })
  contextData: Record<string, any>;

  @Column({ nullable: true })
  priority: string; // 'low', 'normal', 'high', 'urgent'

  @Column({ default: false })
  isOverride: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;
}
