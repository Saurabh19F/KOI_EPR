import { Controller, Get, Query, Param, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { EnquiryStatus } from '../sales/entities/sales-enquiry.entity';
import { PurchaseStatus } from '../purchase/entities/purchase-quote.entity';
import { PriceAnalysisStatus } from '../rate/entities/price-analysis.entity';
import { FmsTaskStatus } from '../fms/entities/fms-task.entity';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ========== DASHBOARD ==========

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard(
    @Query('companyId') companyId?: string,
    @Query('days') days?: number,
  ) {
    return this.reportsService.getDashboardStats(companyId, days ? Number(days) : undefined);
  }

  // ========== SALES REPORTS ==========

  @Get('sales')
  @ApiOperation({ summary: 'Get sales report with filters' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EnquiryStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'salesPersonId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: EnquiryStatus,
    @Query('customerId') customerId?: string,
    @Query('salesPersonId') salesPersonId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getSalesReport({
      startDate,
      endDate,
      status,
      customerId,
      salesPersonId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('sales/summary')
  @ApiOperation({ summary: 'Get sales enquiry summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getSalesSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesEnquirySummary(startDate, endDate);
  }

  // ========== PURCHASE REPORTS ==========

  @Get('purchase')
  @ApiOperation({ summary: 'Get purchase report with filters' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseStatus })
  @ApiQuery({ name: 'partyName', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPurchaseReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: PurchaseStatus,
    @Query('partyName') partyName?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getPurchaseReport({
      startDate,
      endDate,
      status,
      partyName,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('purchase/summary')
  @ApiOperation({ summary: 'Get purchase summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getPurchaseSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getPurchaseSummary(startDate, endDate);
  }

  @Get('party-comparison')
  @ApiOperation({ summary: 'Get party comparison report' })
  getPartyComparison() {
    return this.reportsService.getPartyComparisonReport();
  }

  // ========== RATE ANALYSIS REPORTS ==========

  @Get(['rate-analysis', 'price-analysis'])
  @ApiOperation({ summary: 'Get rate analysis report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false, enum: PriceAnalysisStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRateAnalysisReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: PriceAnalysisStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getRateAnalysisReport({
      startDate,
      endDate,
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(['rate-analysis/summary', 'price-analysis/summary'])
  @ApiOperation({ summary: 'Get rate analysis summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getRateAnalysisSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRateAnalysisSummary(startDate, endDate);
  }

  // ========== FMS REPORTS ==========

  @Get('fms')
  @ApiOperation({ summary: 'Get FMS task report' })
  @ApiQuery({ name: 'status', required: false, enum: FmsTaskStatus })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFmsReport(
    @Query('status') status?: FmsTaskStatus,
    @Query('assignedTo') assignedTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getFmsReport({
      status,
      assignedTo,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('fms/summary')
  @ApiOperation({ summary: 'Get FMS summary' })
  getFmsSummary() {
    return this.reportsService.getFmsSummary();
  }

  // ========== PRODUCT REPORTS ==========

  @Get('products')
  @ApiOperation({ summary: 'Get product report' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProductReport(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getProductReport({
      categoryId,
      brandId,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  getLowStockProducts() {
    return this.reportsService.getLowStockProducts();
  }

  // ========== EXPORTS ==========

  @Get('export/excel/:type')
  @ApiOperation({ summary: 'Export report to Excel' })
  async exportToExcel(
    @Param('type') type: string,
    @Query() query: any,
    @Res() res: Response,
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      let data: any[] = [];
      let headers: string[] = [];

      switch (type) {
        case 'sales':
          data = await this.reportsService.getSalesReportData(query);
          headers = ['Enquiry No', 'Date', 'Customer', 'Status', 'Total Amount'];
          break;
        case 'purchase':
          data = await this.reportsService.getPurchaseReportData(query);
          headers = ['Quote No', 'Date', 'Party', 'Status', 'Total Amount'];
          break;
        case 'products':
          data = await this.reportsService.getProductsReportData(query);
          headers = ['SKU', 'Name', 'Category', 'Stock', 'Price'];
          break;
        case 'price-analysis':
        case 'rate-analysis':
          data = await this.reportsService.getRateAnalysisReportData(query);
          headers = ['Enquiry No', 'Date', 'Customer', 'Status', 'Purchase Value', 'Selling Value', 'Margin %'];
          break;
        case 'enquiry-summary':
          data = await this.reportsService.getEnquirySummaryReportData(query);
          headers = ['Status', 'Enquiry Count', 'Total Value', 'Percentage'];
          break;
        default:
          data = [];
          headers = ['Data'];
      }

      // Add headers
      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        data.forEach((row) => {
          worksheet.addRow(keys.map((k) => row[k]));
        });
      } else {
        worksheet.addRow(['No data available']);
      }

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 20;
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${type}-report-${Date.now()}.xlsx"`,
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate Excel report' });
    }
  }

  @Get('export/pdf/:type')
  @ApiOperation({ summary: 'Export report to PDF' })
  async exportToPdf(
    @Param('type') type: string,
    @Query() query: any,
    @Res() res: Response,
  ) {
    try {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${type}-report-${Date.now()}.pdf"`,
      );
      doc.pipe(res);

      // Title
      doc.fontSize(20).text(`${type.toUpperCase()} Report`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Get report data based on type
      let data: any[] = [];
      switch (type) {
        case 'sales':
          data = await this.reportsService.getSalesReportData(query);
          break;
        case 'purchase':
          data = await this.reportsService.getPurchaseReportData(query);
          break;
        case 'price-analysis':
        case 'rate-analysis':
          data = await this.reportsService.getRateAnalysisReportData(query);
          break;
        case 'enquiry-summary':
          data = await this.reportsService.getEnquirySummaryReportData(query);
          break;
        default:
          data = [];
      }

      // Add table header
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(keys.join(' | '));
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9);

        data.slice(0, 50).forEach((row) => {
          doc.text(keys.map((k) => String(row[k] ?? '')).join(' | '));
        });

        if (data.length > 50) {
          doc.moveDown();
          doc.text(`... and ${data.length - 50} more rows`);
        }
      } else {
        doc.text('No data available');
      }

      doc.end();
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate PDF report' });
    }
  }
}
