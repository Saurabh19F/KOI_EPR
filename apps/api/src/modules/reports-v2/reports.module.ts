import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

// Entities
import {
  ReportDefinition,
  GeneratedReport,
  ScheduledReport,
  ChartDefinition,
} from './entities/report.entity';

// Financial module for report generation
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportDefinition,
      GeneratedReport,
      ScheduledReport,
      ChartDefinition,
    ]),
    FinancialModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsV2Module {}
