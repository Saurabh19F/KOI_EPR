import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  FINANCIAL = 'financial',
  INVENTORY = 'inventory',
  SALES = 'sales',
  PURCHASE = 'purchase',
  TAX = 'tax',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  HTML = 'html',
}

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('report_definitions')
@Index(['companyId'])
export class ReportDefinition {
  @PrimaryGeneratedColumn('uuid')
  reportId: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  companyId: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  description: string;

  @Column()
  @ApiProperty({ enum: ['financial', 'inventory', 'sales', 'purchase', 'tax', 'custom'], enumName: 'ReportType' })
  type: string;

  @Column({ default: ReportFormat.PDF })
  @ApiProperty({ enum: ['pdf', 'excel', 'csv', 'html'], enumName: 'ReportFormat' })
  defaultFormat: string;

  @Column({ type: 'text', nullable: true })
  query: string; // Custom SQL for custom reports

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  parameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  columns: ReportColumn[];

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  filters: ReportFilter[];

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  grouping: ReportGrouping[];

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  aggregations: ReportAggregation[];

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty()
  isSystem: boolean;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  createdBy: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  updatedBy: string;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

export interface ReportColumn {
  field: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string; // currency, date, number, percentage
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  visible?: boolean;
}

export interface ReportFilter {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiSelect';
  required?: boolean;
  options?: { label: string; value: any }[];
}

export interface ReportGrouping {
  field: string;
  type: 'group' | 'subgroup';
  collapsible?: boolean;
}

export interface ReportAggregation {
  field: string;
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  label?: string;
  format?: string;
}

// Generated reports storage
@Entity('generated_reports')

export class GeneratedReport {
  @PrimaryGeneratedColumn('uuid')
  reportInstanceId: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  companyId: string;

  @Column()
  @ApiProperty()
  reportId: string;

  @Column()
  @ApiProperty()
  reportName: string;

  @Column()
  @ApiProperty({ enum: ['financial', 'inventory', 'sales', 'purchase', 'tax', 'custom'], enumName: 'ReportType' })
  type: string;

  @Column()
  @ApiProperty({ enum: ['pdf', 'excel', 'csv', 'html'], enumName: 'ReportFormat' })
  format: string;

  @Column({ default: ReportStatus.PENDING })
  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'], enumName: 'ReportStatus' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  parameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  filters: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional()
  filePath: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  fileName: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty()
  fileSize: number;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  errorMessage: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  requestedBy: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  completedAt: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  expiresAt: Date;

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

// Scheduled reports
@Entity('scheduled_reports')

export class ScheduledReport {
  @PrimaryGeneratedColumn('uuid')
  scheduleId: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  companyId: string;

  @Column()
  @ApiProperty()
  reportId: string;

  @Column()
  @ApiProperty()
  reportName: string;

  @Column({ default: ReportFormat.PDF })
  @ApiProperty({ enum: ['pdf', 'excel', 'csv', 'html'], enumName: 'ReportFormat' })
  format: string;

  @Column()
  @ApiProperty()
  cronExpression: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  parameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  recipients: string[];

  @Column({ nullable: true })
  @ApiPropertyOptional()
  lastRunAt: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  nextRunAt: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  lastRunStatus: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  lastError: string;

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  createdBy: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

// Chart configurations
@Entity('chart_definitions')
@Index(['companyId'])
export class ChartDefinition {
  @PrimaryGeneratedColumn('uuid')
  chartId: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  companyId: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  description: string;

  @Column({ default: ReportType.FINANCIAL })
  @ApiProperty({ enum: ['financial', 'inventory', 'sales', 'purchase', 'tax', 'custom'], enumName: 'ReportType' })
  type: string;

  @Column()
  @ApiProperty()
  chartType: string;

  @Column({ type: 'text', nullable: true })
  @ApiPropertyOptional()
  dataQuery: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  config: ChartConfig;

  @Column({ type: 'jsonb', nullable: true })
  @ApiPropertyOptional({ type: Object })
  axes: ChartAxes;

  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty()
  isSystem: boolean;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  createdBy: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional()
  updatedBy: string;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}

export interface ChartConfig {
  title?: string;
  subtitle?: string;
  legend?: {
    position: 'top' | 'bottom' | 'left' | 'right';
    display: boolean;
  };
  colors?: string[];
  animations?: {
    enabled: boolean;
    duration: number;
  };
}

export interface ChartAxes {
  xAxis: {
    field: string;
    label: string;
    type: 'category' | 'linear' | 'time';
    format?: string;
  };
  yAxis: {
    field: string;
    label: string;
    type: 'linear' | 'logarithmic';
    format?: string;
    aggregation?: 'sum' | 'avg' | 'count';
  };
}
