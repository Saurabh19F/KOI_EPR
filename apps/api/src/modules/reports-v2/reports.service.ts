import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import {
  ReportDefinition,
  ReportType,
  ReportFormat,
  ReportStatus,
  GeneratedReport,
  ScheduledReport,
  ChartDefinition,
} from './entities/report.entity';
import { FinancialService } from '../financial/financial.service';
import {
  ReportTypeValue,
  ReportFormatValue,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportDefinition)
    private reportDefRepo: Repository<ReportDefinition>,
    @InjectRepository(GeneratedReport)
    private generatedReportRepo: Repository<GeneratedReport>,
    @InjectRepository(ScheduledReport)
    private scheduledReportRepo: Repository<ScheduledReport>,
    @InjectRepository(ChartDefinition)
    private chartDefRepo: Repository<ChartDefinition>,
    private dataSource: DataSource,
    private financialService: FinancialService,
    @Optional() @InjectQueue('reports') private reportsQueue?: Queue,
  ) {}

  private assertCompanyAccess(record: { companyId?: string; isSystem?: boolean } | null, companyId?: string) {
    if (!record) {
      throw new NotFoundException('Report not found');
    }
    if (record.companyId && companyId && record.companyId !== companyId) {
      throw new NotFoundException('Report not found');
    }
  }

  private assertSqlIdentifier(identifier: string) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
      throw new BadRequestException(`Invalid SQL identifier: ${identifier}`);
    }
  }

  private buildColumnList(columns: any[] | undefined): string {
    if (!columns?.length) return '*';

    const fields = columns.map((column) => column.field);
    fields.forEach((field) => this.assertSqlIdentifier(field));
    return fields.join(', ');
  }

  private replaceQueryPlaceholders(query: string, values: Record<string, any> = {}, queryParams: any[]) {
    return query.replace(/{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g, (_match, key) => {
      queryParams.push(values[key]);
      return `$${queryParams.length}`;
    });
  }

  // ============ Report Definitions ============

  async createReportDefinition(dto: any, userId: string, companyId?: string) {
    const report = this.reportDefRepo.create({
      ...dto,
      companyId,
      createdBy: userId,
    });
    return this.reportDefRepo.save(report);
  }

  async updateReportDefinition(id: string, dto: any, userId: string, companyId?: string) {
    const report = await this.reportDefRepo.findOne({ where: { reportId: id } });
    this.assertCompanyAccess(report, companyId);
    if (report.isSystem) throw new BadRequestException('Cannot modify system reports');

    Object.assign(report, { ...dto, updatedBy: userId });
    return this.reportDefRepo.save(report);
  }

  async deleteReportDefinition(id: string, companyId?: string) {
    const report = await this.reportDefRepo.findOne({ where: { reportId: id } });
    this.assertCompanyAccess(report, companyId);
    if (report.isSystem) throw new BadRequestException('Cannot delete system reports');

    await this.reportDefRepo.delete(id);
    return { deleted: true };
  }

  async getReportDefinitions(companyId: string, type?: string) {
    const where: any = { isActive: true };
    if (companyId) where.companyId = companyId;
    if (type) where.type = type;

    return this.reportDefRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async getReportDefinitionById(id: string, companyId?: string) {
    const report = await this.reportDefRepo.findOne({ where: { reportId: id } });
    this.assertCompanyAccess(report, companyId);
    return report;
  }

  // ============ Report Generation ============

  async generateReport(
    dto: {
      reportId: string;
      format?: string;
      parameters?: Record<string, any>;
      filters?: Record<string, any>;
      startDate?: Date;
      endDate?: Date;
    },
    userId: string,
    companyId: string,
  ) {
    const reportDef = await this.getReportDefinitionById(dto.reportId, companyId);
    const format = (dto.format as ReportFormat) || reportDef.defaultFormat;

    // Create report instance
    const reportInstance = this.generatedReportRepo.create({
      companyId,
      reportId: dto.reportId,
      reportName: reportDef.name,
      type: reportDef.type,
      format,
      status: ReportStatus.PENDING,
      parameters: dto.parameters,
      filters: dto.filters,
      requestedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    await this.generatedReportRepo.save(reportInstance);

    // Queue for async processing
    if (this.reportsQueue) {
      await this.reportsQueue.add('generate-report', {
        reportInstanceId: reportInstance.reportInstanceId,
        reportDef,
        format,
        parameters: { ...dto.parameters, startDate: dto.startDate, endDate: dto.endDate },
        filters: dto.filters,
        companyId,
      });
    }

    return {
      reportInstanceId: reportInstance.reportInstanceId,
      status: ReportStatus.PENDING,
      message: 'Report generation queued',
    };
  }

  async processReportJob(job: any) {
    const { reportInstanceId, reportDef, format, parameters, filters, companyId } = job.data;

    try {
      // Update status to processing
      await this.generatedReportRepo.update(reportInstanceId, {
        status: ReportStatus.PROCESSING,
      });

      // Fetch data based on report type
      const data = await this.fetchReportData(reportDef, parameters, filters, companyId);

      // Generate file
      const fileName = `${reportDef.name.replace(/\s+/g, '_')}_${Date.now()}`;
      const outputDir = path.join(process.cwd(), 'uploads', 'reports');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let filePath: string;
      if (format === ReportFormat.EXCEL) {
        filePath = await this.generateExcel(data, reportDef, outputDir, fileName);
      } else if (format === ReportFormat.PDF) {
        filePath = await this.generatePDF(data, reportDef, outputDir, fileName);
      } else if (format === ReportFormat.CSV) {
        filePath = await this.generateCSV(data, reportDef, outputDir, fileName);
      } else {
        throw new BadRequestException('Unsupported format');
      }

      const stats = fs.statSync(filePath);

      // Update report instance
      await this.generatedReportRepo.update(reportInstanceId, {
        status: ReportStatus.COMPLETED,
        filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.generatedReportRepo.update(reportInstanceId, {
        status: ReportStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private async fetchReportData(
    reportDef: ReportDefinition,
    parameters: Record<string, any>,
    filters: Record<string, any>,
    companyId: string,
  ): Promise<any[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const queryParams: any[] = [companyId];
      const conditions = ['company_id = $1'];
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            this.assertSqlIdentifier(key);
            queryParams.push(value);
            conditions.push(`${key} = $${queryParams.length}`);
          }
        });
      }

      // Add date filters if provided
      if (parameters?.startDate) {
        queryParams.push(new Date(parameters.startDate).toISOString());
        conditions.push(`created_at >= $${queryParams.length}`);
      }
      if (parameters?.endDate) {
        queryParams.push(new Date(parameters.endDate).toISOString());
        conditions.push(`created_at <= $${queryParams.length}`);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      let query = reportDef.query;
      if (!query) {
        // Generate default queries based on type
        query = this.generateDefaultQuery(reportDef.type, reportDef.columns, whereClause);
      } else {
        if (!/^\s*select\b/i.test(query) || /;\s*\S/.test(query)) {
          throw new BadRequestException('Only single SELECT statements are allowed for custom report queries');
        }
        if (!query.includes('{{companyId}}')) {
          throw new BadRequestException('Custom report queries must include {{companyId}} tenant filter');
        }
        queryParams.length = 0;
        query = this.replaceQueryPlaceholders(query, { ...(parameters || {}), ...(filters || {}), companyId }, queryParams);
      }

      const result = await queryRunner.query(query, queryParams);
      return result;
    } finally {
      await queryRunner.release();
    }
  }

  private generateDefaultQuery(
    type: string,
    columns: any[],
    whereClause: string,
  ): string {
    const colStr = this.buildColumnList(columns);

    switch (type) {
      case 'financial':
        return `SELECT ${colStr} FROM ledger_entries ${whereClause}`;
      case 'inventory':
        return `SELECT ${colStr} FROM inventory_batches ${whereClause}`;
      case 'sales':
        return `SELECT ${colStr} FROM sales_invoices ${whereClause}`;
      case 'purchase':
        return `SELECT ${colStr} FROM purchase_invoices ${whereClause}`;
      case 'tax':
        return `SELECT ${colStr} FROM tax_records ${whereClause}`;
      case 'custom':
        return `SELECT ${colStr} FROM ledger_entries ${whereClause}`;
      default:
        return `SELECT ${colStr} FROM ledger_entries ${whereClause}`;
    }
  }

  private async generateExcel(
    data: any[],
    reportDef: ReportDefinition,
    outputDir: string,
    fileName: string,
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportDef.name);

    // Add headers
    const headers = reportDef.columns?.map((c) => c.header) || Object.keys(data[0] || {});
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    data.forEach((row) => {
      const rowData = reportDef.columns?.map((c) => this.formatCellValue(row[c.field], c.format)) ||
        Object.values(row);
      worksheet.addRow(rowData);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        maxLength = Math.max(maxLength, cell.value?.toString().length || 0);
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    const filePath = path.join(outputDir, `${fileName}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private async generatePDF(
    data: any[],
    reportDef: ReportDefinition,
    outputDir: string,
    fileName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(outputDir, `${fileName}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc.fontSize(18).text(reportDef.name, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Headers
      const headers = reportDef.columns?.map((c) => c.header) || Object.keys(data[0] || {});
      const colWidth = (doc.page.width - 100) / headers.length;

      doc.fontSize(9).font('Helvetica-Bold');
      let xPos = 50;
      headers.forEach((header) => {
        doc.text(header, xPos, doc.y, { width: colWidth });
        xPos += colWidth;
      });
      doc.moveDown();

      // Data rows
      doc.font('Helvetica').fontSize(8);
      data.slice(0, 100).forEach((row, index) => {
        if (doc.y > doc.page.height - 50) {
          doc.addPage();
        }

        xPos = 50;
        const rowData = reportDef.columns?.map((c) =>
          this.formatCellValue(row[c.field], c.format)
        ) || Object.values(row);

        rowData.forEach((cell) => {
          const cellStr = String(cell ?? '').substring(0, 30);
          doc.text(cellStr, xPos, doc.y, { width: colWidth });
          xPos += colWidth;
        });
        doc.moveDown(0.5);

        // Alternate row shading
        if (index % 2 === 0) {
          doc.rect(50, doc.y - 10, doc.page.width - 100, 12).fill('#F9F9F9');
        }
      });

      // Footer
      doc.fontSize(8).text(
        `Total Records: ${data.length}`,
        50,
        doc.page.height - 30,
      );

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private async generateCSV(
    data: any[],
    reportDef: ReportDefinition,
    outputDir: string,
    fileName: string,
  ): Promise<string> {
    const filePath = path.join(outputDir, `${fileName}.csv`);
    const headers = reportDef.columns?.map((c) => c.header) || Object.keys(data[0] || {});
    const rows = data.map((row) =>
      reportDef.columns?.map((c) =>
        this.formatCellValue(row[c.field], c.format)
      ) || Object.values(row)
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf-8');
    return filePath;
  }

  private formatCellValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';
    if (format === 'currency') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(value);
    }
    if (format === 'date') {
      return new Date(value).toLocaleDateString('en-IN');
    }
    if (format === 'percentage') {
      return `${Number(value).toFixed(2)}%`;
    }
    return String(value);
  }

  // ============ Generated Reports ============

  async getGeneratedReports(
    companyId: string,
    query: {
      reportId?: string;
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { isActive: true };
    if (companyId) where.companyId = companyId;
    if (query.reportId) where.reportId = query.reportId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [reports, total] = await this.generatedReportRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGeneratedReportById(id: string, companyId?: string) {
    const report = await this.generatedReportRepo.findOne({ where: { reportInstanceId: id } });
    this.assertCompanyAccess(report, companyId);
    return report;
  }

  async downloadReport(id: string, companyId?: string): Promise<{ filePath: string; fileName: string }> {
    const report = await this.getGeneratedReportById(id, companyId);
    if (report.status !== ReportStatus.COMPLETED) {
      throw new BadRequestException('Report not ready for download');
    }
    if (!fs.existsSync(report.filePath)) {
      throw new NotFoundException('Report file not found');
    }
    return {
      filePath: report.filePath,
      fileName: report.fileName,
    };
  }

  async deleteGeneratedReport(id: string, companyId?: string) {
    const report = await this.getGeneratedReportById(id, companyId);
    if (fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }
    await this.generatedReportRepo.delete(id);
    return { deleted: true };
  }

  // ============ Scheduled Reports ============

  async createScheduledReport(dto: any, userId: string, companyId: string) {
    const schedule = this.scheduledReportRepo.create({
      ...dto,
      companyId,
      createdBy: userId,
      nextRunAt: this.calculateNextRun(dto.cronExpression),
    });
    return this.scheduledReportRepo.save(schedule);
  }

  async updateScheduledReport(id: string, dto: any, companyId?: string) {
    const schedule = await this.scheduledReportRepo.findOne({ where: { scheduleId: id } });
    this.assertCompanyAccess(schedule, companyId);

    Object.assign(schedule, dto);
    if (dto.cronExpression) {
      schedule.nextRunAt = this.calculateNextRun(dto.cronExpression);
    }
    return this.scheduledReportRepo.save(schedule);
  }

  async deleteScheduledReport(id: string, companyId?: string) {
    const schedule = await this.scheduledReportRepo.findOne({ where: { scheduleId: id } });
    this.assertCompanyAccess(schedule, companyId);
    await this.scheduledReportRepo.delete(id);
    return { deleted: true };
  }

  async getScheduledReports(companyId: string) {
    return this.scheduledReportRepo.find({
      where: { companyId, isActive: true },
      order: { nextRunAt: 'ASC' },
    });
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron calculation for common patterns
    const now = new Date();
    const parts = cronExpression.split(' ');

    if (parts.length === 5) {
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

      if (dayOfWeek === '*' && dayOfMonth === '*') {
        // Daily
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        return next;
      }

      if (dayOfWeek !== '*') {
        // Weekly
        const next = new Date(now);
        const targetDay = parseInt(dayOfWeek);
        const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntil);
        next.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);
        return next;
      }
    }

    // Default: 1 hour from now
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  // ============ Chart Definitions ============

  async createChartDefinition(dto: any, userId: string, companyId?: string) {
    const chart = this.chartDefRepo.create({
      ...dto,
      companyId,
      createdBy: userId,
    });
    return this.chartDefRepo.save(chart);
  }

  async getChartDefinitions(companyId: string, type?: string) {
    const where: any = { isActive: true };
    if (companyId) where.companyId = companyId;
    if (type) where.type = type;

    return this.chartDefRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async getChartData(chartId: string, parameters?: Record<string, any>, companyId?: string) {
    const chart = await this.chartDefRepo.findOne({ where: { chartId } });
    this.assertCompanyAccess(chart, companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      let query = chart.dataQuery;
      if (!/^\s*select\b/i.test(query) || /;\s*\S/.test(query)) {
        throw new BadRequestException('Only single SELECT statements are allowed for chart queries');
      }
      if (!query.includes('{{companyId}}')) {
        throw new BadRequestException('Chart queries must include {{companyId}} tenant filter');
      }

      const queryParams: any[] = [];
      query = this.replaceQueryPlaceholders(query, { ...(parameters || {}), companyId }, queryParams);

      const data = await queryRunner.query(query, queryParams);
      return { chartId, chartName: chart.name, data };
    } finally {
      await queryRunner.release();
    }
  }

  async deleteChartDefinition(id: string, companyId?: string) {
    const chart = await this.chartDefRepo.findOne({ where: { chartId: id } });
    this.assertCompanyAccess(chart, companyId);
    if (chart.isSystem) throw new BadRequestException('Cannot delete system charts');

    await this.chartDefRepo.delete(id);
    return { deleted: true };
  }

  // ============ Standard Reports ============

  async getStandardReports(companyId: string) {
    // Return pre-defined standard reports
    return [
      {
        reportId: 'trial_balance',
        name: 'Trial Balance',
        description: 'Summary of all account balances',
        type: ReportType.FINANCIAL,
        defaultFormat: ReportFormat.PDF,
        icon: 'balance',
      },
      {
        reportId: 'balance_sheet',
        name: 'Balance Sheet',
        description: 'Assets, Liabilities, and Equity',
        type: ReportType.FINANCIAL,
        defaultFormat: ReportFormat.PDF,
        icon: 'sheet',
      },
      {
        reportId: 'profit_loss',
        name: 'Profit & Loss Statement',
        description: 'Income and Expenses',
        type: ReportType.FINANCIAL,
        defaultFormat: ReportFormat.PDF,
        icon: 'trending',
      },
      {
        reportId: 'gst_summary',
        name: 'GST Summary',
        description: 'GST liability summary',
        type: ReportType.TAX,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'tax',
      },
      {
        reportId: 'gstr1',
        name: 'GSTR-1',
        description: 'Outward supplies report',
        type: ReportType.TAX,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'document',
      },
      {
        reportId: 'gstr3b',
        name: 'GSTR-3B',
        description: 'Monthly return summary',
        type: ReportType.TAX,
        defaultFormat: ReportFormat.PDF,
        icon: 'document',
      },
      {
        reportId: 'sales_register',
        name: 'Sales Register',
        description: 'Detailed sales transactions',
        type: ReportType.SALES,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'sales',
      },
      {
        reportId: 'purchase_register',
        name: 'Purchase Register',
        description: 'Detailed purchase transactions',
        type: ReportType.PURCHASE,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'purchase',
      },
      {
        reportId: 'stock_valuation',
        name: 'Stock Valuation Report',
        description: 'Inventory valuation summary',
        type: ReportType.INVENTORY,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'inventory',
      },
      {
        reportId: 'low_stock',
        name: 'Low Stock Alert',
        description: 'Items below reorder point',
        type: ReportType.INVENTORY,
        defaultFormat: ReportFormat.PDF,
        icon: 'alert',
      },
      {
        reportId: 'ageing_receivable',
        name: 'Accounts Receivable Ageing',
        description: 'Outstanding customer invoices by age',
        type: ReportType.FINANCIAL,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'receivable',
      },
      {
        reportId: 'ageing_payable',
        name: 'Accounts Payable Ageing',
        description: 'Outstanding vendor invoices by age',
        type: ReportType.FINANCIAL,
        defaultFormat: ReportFormat.EXCEL,
        icon: 'payable',
      },
    ];
  }

  async generateStandardReport(
    reportId: string,
    parameters: {
      startDate?: Date;
      endDate?: Date;
      format?: string;
    },
    companyId: string,
    userId: string,
  ) {
    const reportDef = await this.getStandardReportDefinition(reportId, parameters);
    const format = (parameters.format as ReportFormat) || ReportFormat.PDF;

    const reportInstance = this.generatedReportRepo.create({
      companyId,
      reportId,
      reportName: reportDef.name,
      type: reportDef.type,
      format,
      status: ReportStatus.PROCESSING,
      parameters,
      requestedBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.generatedReportRepo.save(reportInstance);

    try {
      const outputDir = path.join(process.cwd(), 'uploads', 'reports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const fileName = `${reportDef.name.replace(/\s+/g, '_')}_${Date.now()}`;

      if (reportId === 'trial_balance') {
        const trialBalance = await this.financialService.getTrialBalance(
          parameters.startDate,
          parameters.endDate,
          companyId,
        );
        // Extract entries array from the TrialBalanceDto response
        const data = trialBalance?.accounts || [];
        const filePath = await this.generateExcel(data, {
          name: reportDef.name,
          columns: [
            { field: 'accountCode', header: 'Account Code' },
            { field: 'accountName', header: 'Account Name' },
            { field: 'accountType', header: 'Type' },
            { field: 'debit', header: 'Debit', format: 'currency' },
            { field: 'credit', header: 'Credit', format: 'currency' },
          ],
        } as any, outputDir, fileName);

        const stats = fs.statSync(filePath);
        reportInstance.status = ReportStatus.COMPLETED;
        reportInstance.filePath = filePath;
        reportInstance.fileName = path.basename(filePath);
        reportInstance.fileSize = stats.size;
        reportInstance.completedAt = new Date();
      } else {
        // For other standard reports, generate empty with headers
        const filePath = path.join(outputDir, `${fileName}.pdf`);
        await this.generatePDF([], { name: reportDef.name, columns: [] } as any, outputDir, fileName);

        const stats = fs.statSync(filePath);
        reportInstance.status = ReportStatus.COMPLETED;
        reportInstance.filePath = filePath;
        reportInstance.fileName = path.basename(filePath);
        reportInstance.fileSize = stats.size;
        reportInstance.completedAt = new Date();
      }

      await this.generatedReportRepo.save(reportInstance);
      return reportInstance;
    } catch (error) {
      reportInstance.status = ReportStatus.FAILED;
      reportInstance.errorMessage = error.message;
      await this.generatedReportRepo.save(reportInstance);
      throw error;
    }
  }

  private getStandardReportDefinition(reportId: string, parameters: any) {
    const reports: Record<string, any> = {
      trial_balance: {
        name: 'Trial Balance',
        type: ReportType.FINANCIAL,
      },
      balance_sheet: {
        name: 'Balance Sheet',
        type: ReportType.FINANCIAL,
      },
      profit_loss: {
        name: 'Profit & Loss Statement',
        type: ReportType.FINANCIAL,
      },
      gst_summary: {
        name: 'GST Summary',
        type: ReportType.TAX,
      },
      gstr1: {
        name: 'GSTR-1',
        type: ReportType.TAX,
      },
      gstr3b: {
        name: 'GSTR-3B',
        type: ReportType.TAX,
      },
      sales_register: {
        name: 'Sales Register',
        type: ReportType.SALES,
      },
      purchase_register: {
        name: 'Purchase Register',
        type: ReportType.PURCHASE,
      },
      stock_valuation: {
        name: 'Stock Valuation Report',
        type: ReportType.INVENTORY,
      },
      low_stock: {
        name: 'Low Stock Alert',
        type: ReportType.INVENTORY,
      },
      ageing_receivable: {
        name: 'Accounts Receivable Ageing',
        type: ReportType.FINANCIAL,
      },
      ageing_payable: {
        name: 'Accounts Payable Ageing',
        type: ReportType.FINANCIAL,
      },
    };

    return reports[reportId] || { name: 'Report', type: ReportType.FINANCIAL };
  }
}
