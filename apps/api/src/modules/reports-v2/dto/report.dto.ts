import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  IsArray,
  ValidateNested,
  Min,
  IsEnum,
  IsBoolean,
  IsJSON,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============ Report Type Enums (as constants for validation) ============

export const REPORT_TYPES = ['financial', 'inventory', 'sales', 'purchase', 'tax', 'custom'] as const;
export type ReportTypeValue = typeof REPORT_TYPES[number];

export const REPORT_FORMATS = ['pdf', 'excel', 'csv', 'html'] as const;
export type ReportFormatValue = typeof REPORT_FORMATS[number];

export const REPORT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type ReportStatusValue = typeof REPORT_STATUSES[number];

// ============ Report Definition DTOs ============

export class ReportColumnDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  header: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  align?: 'left' | 'center' | 'right';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ReportFilterDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  type: 'text' | 'number' | 'date' | 'dateRange' | 'select' | 'multiSelect';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  value?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  options?: { label: string; value: any }[];
}

export class ReportGroupingDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  type: 'group' | 'subgroup';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  collapsible?: boolean;
}

export class ReportAggregationDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  function: 'sum' | 'avg' | 'count' | 'min' | 'max';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;
}

export class CreateReportDefinitionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: REPORT_TYPES })
  @IsIn(REPORT_TYPES)
  type: ReportTypeValue;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  defaultFormat?: ReportFormatValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportColumnDto)
  columns?: ReportColumnDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportGroupingDto)
  grouping?: ReportGroupingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportAggregationDto)
  aggregations?: ReportAggregationDto[];
}

export class UpdateReportDefinitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  defaultFormat?: ReportFormatValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportColumnDto)
  columns?: ReportColumnDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportFilterDto)
  filters?: ReportFilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportGroupingDto)
  grouping?: ReportGroupingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportAggregationDto)
  aggregations?: ReportAggregationDto[];
}

// ============ Report Status Enum ============

export const REPORT_STATUS_ENUM = ['pending', 'processing', 'completed', 'failed'] as const;

// ============ Generate Report DTOs ============

export class GenerateReportDto {
  @ApiProperty()
  @IsString()
  reportId: string;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormatValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  parameters?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  filters?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class QueryReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportId?: string;

  @ApiPropertyOptional({ enum: REPORT_TYPES })
  @IsOptional()
  @IsIn(REPORT_TYPES)
  type?: ReportTypeValue;

  @ApiPropertyOptional({ enum: REPORT_STATUS_ENUM })
  @IsOptional()
  @IsIn(REPORT_STATUS_ENUM)
  status?: ReportStatusValue;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormatValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============ Scheduled Report DTOs ============

export class CreateScheduledReportDto {
  @ApiProperty()
  @IsString()
  reportId: string;

  @ApiProperty()
  @IsString()
  reportName: string;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormatValue;

  @ApiProperty()
  @IsString()
  cronExpression: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  parameters?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];
}

export class UpdateScheduledReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronExpression?: string;

  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: ReportFormatValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  parameters?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============ Chart Definition DTOs ============

export class ChartConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  legend?: { position: string; display: boolean };

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  colors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  animations?: { enabled: boolean; duration: number };
}

export class ChartAxesDto {
  @ApiProperty()
  @IsString()
  xField: string;

  @ApiProperty()
  @IsString()
  xLabel: string;

  @ApiProperty()
  @IsString()
  xType: 'category' | 'linear' | 'time';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  xFormat?: string;

  @ApiProperty()
  @IsString()
  yField: string;

  @ApiProperty()
  @IsString()
  yLabel: string;

  @ApiProperty()
  @IsString()
  yType: 'linear' | 'logarithmic';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yFormat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yAggregation?: 'sum' | 'avg' | 'count';
}

export class CreateChartDefinitionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: REPORT_TYPES })
  @IsOptional()
  @IsIn(REPORT_TYPES)
  type?: ReportTypeValue;

  @ApiProperty()
  @IsString()
  chartType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dataQuery?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ChartConfigDto)
  config?: ChartConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ChartAxesDto)
  axes?: ChartAxesDto;
}

// ============ Dashboard DTOs ============

export class DashboardWidgetDto {
  @ApiProperty()
  @IsString()
  chartId: string;

  @ApiProperty()
  @IsNumber()
  position: number;

  @ApiProperty()
  @IsNumber()
  sizeX: number;

  @ApiProperty()
  @IsNumber()
  sizeY: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  config?: string;
}

export class SaveDashboardDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets: DashboardWidgetDto[];
}
