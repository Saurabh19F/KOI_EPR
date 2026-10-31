import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// ─── Enums ───────────────────────────────────────────────────

export enum ReviewDraftStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum TaskEmailStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum OrderClosureStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

// ─── OrderReviewDraft ────────────────────────────────────────
// Cumulative draft snapshots — each save appends a new row with
// the full item-level review state.

@Entity('order_review_drafts')
@Index(['orderId'])
@Index(['companyId'])
export class OrderReviewDraft {
  @PrimaryGeneratedColumn('uuid')
  draftId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ nullable: true })
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productCode: string;

  @Column({ nullable: true })
  categoryName: string;

  // SO master data (snapshotted)
  @Column({ type: 'decimal', precision: 18, scale: 3, default: 0 })
  soQuantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  unitCbm: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  unitWeight: number;

  @Column({ nullable: true })
  purchasePersonName: string;

  // Review editable fields
  @Column({ nullable: true })
  poNumber: string;

  @Column({ nullable: true })
  poDate: Date;

  @Column({ nullable: true })
  indentDate: Date;

  @Column({ nullable: true })
  expectedDeliveryDate: Date;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  reviewQuantity: number;

  // Auto-calculated fields
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  autoCbm: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  autoNetWeight: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  autoGrossWeight: number;

  @Column({ type: 'decimal', precision: 18, scale: 3, nullable: true })
  categoryExtraWeight: number;

  // Order-wise final dispatch (shared across all items of same order)
  @Column({ nullable: true })
  finalDispatch: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'enum', enum: ReviewDraftStatus, default: ReviewDraftStatus.DRAFT })
  status: ReviewDraftStatus;

  @Column({ type: 'int', default: 0 })
  draftVersion: number;

  @Column({ nullable: true })
  savedBy: string;

  @Column({ nullable: true })
  savedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── OrderFinalSubmission ────────────────────────────────────
// Tracks submission count per order+item. Locks after 2 completed submissions.

@Entity('order_final_submissions')
@Index(['orderId', 'itemId'])
@Index(['companyId'])
export class OrderFinalSubmission {
  @PrimaryGeneratedColumn('uuid')
  submissionId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column()
  productName: string;

  @Column({ type: 'int', default: 0 })
  submissionCount: number;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true })
  lockedAt: Date;

  @Column({ nullable: true })
  lockedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

// ─── OrderReviewLog ──────────────────────────────────────────
// Audit trail for each final submission.

@Entity('order_review_logs')
@Index(['orderId'])
@Index(['companyId'])
export class OrderReviewLog {
  @PrimaryGeneratedColumn('uuid')
  logId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column()
  productName: string;

  @Column({ type: 'int' })
  submissionNumber: number;

  @Column({ type: 'jsonb', nullable: true })
  submittedData: Record<string, any>;

  @Column({ nullable: true })
  submittedBy: string;

  @Column({ nullable: true })
  submittedByName: string;

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  excelUrl: string;
}

// ─── OrderItemTask ───────────────────────────────────────────
// Task assignments per item.

@Entity('order_item_tasks')
@Index(['orderId'])
@Index(['assignedTo'])
@Index(['companyId'])
export class OrderItemTask {
  @PrimaryGeneratedColumn('uuid')
  taskId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column()
  productName: string;

  @Column({ nullable: true })
  taskType: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  assignedBy: string;

  @Column({ type: 'text', nullable: true })
  taskDescription: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  completionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── OrderTaskEmailLog ───────────────────────────────────────
// Email delivery queue + status.

@Entity('order_task_email_logs')
@Index(['companyId'])
@Index(['status'])
export class OrderTaskEmailLog {
  @PrimaryGeneratedColumn('uuid')
  emailLogId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  taskId: string;

  @Column()
  recipientEmail: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  emailSubject: string;

  @Column({ type: 'text', nullable: true })
  emailBody: string;

  @Column({ type: 'enum', enum: TaskEmailStatus, default: TaskEmailStatus.QUEUED })
  status: TaskEmailStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── OrderItemCancellation ───────────────────────────────────
// Cancelled items with restore capability.

@Entity('order_item_cancellations')
@Index(['orderId'])
@Index(['companyId'])
export class OrderItemCancellation {
  @PrimaryGeneratedColumn('uuid')
  cancellationId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column()
  productName: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ default: false })
  isRestored: boolean;

  @Column({ nullable: true })
  restoredAt: Date;

  @Column({ nullable: true })
  restoredBy: string;

  @Column({ nullable: true })
  cancelledBy: string;

  @Column({ nullable: true })
  cancelledByName: string;

  @CreateDateColumn()
  cancelledAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ─── OrderClosure ────────────────────────────────────────────
// Order close status tracking.

@Entity('order_closures')
@Index(['orderId'], { unique: true })
@Index(['companyId'])
export class OrderClosure {
  @PrimaryGeneratedColumn('uuid')
  closureId: string;

  @Column({ nullable: true })
  companyId: string;

  @Column()
  orderId: string;

  @Column()
  orderNumber: string;

  @Column({ type: 'enum', enum: OrderClosureStatus, default: OrderClosureStatus.OPEN })
  status: OrderClosureStatus;

  @Column({ type: 'text', nullable: true })
  closureNotes: string;

  @Column({ nullable: true })
  closedBy: string;

  @Column({ nullable: true })
  closedByName: string;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  reopenedBy: string;

  @Column({ nullable: true })
  reopenedAt: Date;

  @Column({ type: 'text', nullable: true })
  reopenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
