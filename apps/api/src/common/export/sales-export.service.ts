import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { SalesEnquiryOrder } from '../../modules/sales/entities/sales-enquiry.entity';
import { PurchaseQuote } from '../../modules/purchase/entities/purchase-quote.entity';
import { PriceAnalysis } from '../../modules/rate/entities/price-analysis.entity';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor() {}

  /**
   * Generate PDF for Sales Enquiry
   */
  async generateEnquiryPdf(enquiry: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('SALES ENQUIRY', { align: 'center' });
        doc.moveDown();

        // Enquiry Details
        doc.fontSize(12);
        doc.text(`Enquiry No: ${enquiry.enquiryOrderNo || 'N/A'}`);
        doc.text(`Date: ${enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : 'N/A'}`);
        doc.text(`Status: ${enquiry.status || 'N/A'}`);
        doc.moveDown();

        // Customer Info
        if (enquiry.customer) {
          doc.fontSize(14).text('Customer Details', { underline: true });
          doc.fontSize(10);
          doc.text(`Name: ${enquiry.customer.customerName || 'N/A'}`);
          doc.text(`Buyer Code: ${enquiry.customer.buyerCode || 'N/A'}`);
          doc.text(`Contact: ${enquiry.customer.contactPerson || 'N/A'}`);
          doc.text(`Email: ${enquiry.customer.email || 'N/A'}`);
          doc.moveDown();
        }

        // Items Table Header
        doc.fontSize(14).text('Items', { underline: true });
        doc.moveDown(0.5);

        // Table
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 200;
        const col3 = 280;
        const col4 = 340;
        const col5 = 420;

        // Header Row
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('SKU', col1, tableTop);
        doc.text('Description', col2, tableTop);
        doc.text('Qty', col3, tableTop);
        doc.text('CBM', col4, tableTop);
        doc.text('Total CBM', col5, tableTop);

        // Separator line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Items
        let y = tableTop + 25;
        doc.font('Helvetica');
        const items = enquiry.items || [];

        for (const item of items) {
          doc.text(item.sku || '-', col1, y);
          doc.text((item.productName || item.description || '-').substring(0, 25), col2, y);
          doc.text(String(item.quantity || 0), col3, y);
          doc.text(String(item.cbmPerBox || 0), col4, y);
          doc.text(String(item.totalCbm || 0), col5, y);
          y += 20;

          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }

        // Footer
        doc.fontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF for Purchase Quote
   */
  async generatePurchasePdf(quote: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('PURCHASE QUOTATION', { align: 'center' });
        doc.moveDown();

        // Quote Details
        doc.fontSize(12);
        doc.text(`Quote No: ${quote.quoteNo || 'N/A'}`);
        doc.text(`Date: ${quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}`);
        doc.text(`Status: ${quote.status || 'N/A'}`);
        doc.moveDown();

        // Vendor Info
        if (quote.vendor) {
          doc.fontSize(14).text('Vendor Details', { underline: true });
          doc.fontSize(10);
          doc.text(`Name: ${quote.vendor.vendorName || 'N/A'}`);
          doc.text(`Code: ${quote.vendor.vendorCode || 'N/A'}`);
          doc.moveDown();
        }

        // Items Table
        doc.fontSize(14).text('Items', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 180;
        const col3 = 300;
        const col4 = 380;
        const col5 = 460;

        // Header Row
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('SKU', col1, tableTop);
        doc.text('Description', col2, tableTop);
        doc.text('Qty', col3, tableTop);
        doc.text('Rate', col4, tableTop);
        doc.text('Amount', col5, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');
        const items = quote.items || [];

        for (const item of items) {
          doc.text(item.sku || '-', col1, y);
          doc.text((item.productName || '-').substring(0, 30), col2, y);
          doc.text(String(item.quantity || 0), col3, y);
          doc.text(String(item.unitPrice || 0), col4, y);
          doc.text(String(item.totalAmount || 0), col5, y);
          y += 20;
        }

        // Total
        y += 10;
        doc.font('Helvetica-Bold');
        doc.text(`Total: ${quote.totalAmount || 0}`, col4, y);

        // Footer
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Generated on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate Excel for Sales Enquiries
   */
  async generateSalesEnquiriesExcel(enquiries: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Enquiries');

    // Headers
    const headers = [
      'Enquiry No',
      'Date',
      'Customer',
      'Status',
      'Items Count',
      'Total CBM',
      'Created By',
    ];

    worksheet.addRow(headers).font = { bold: true };

    // Data rows
    for (const enquiry of enquiries) {
      worksheet.addRow([
        enquiry.enquiryOrderNo,
        enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : '',
        enquiry.customer?.customerName || '',
        enquiry.status,
        enquiry.items?.length || 0,
        enquiry.totalCbm || 0,
        enquiry.createdBy || '',
      ]);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as any;
  }

  /**
   * Generate Excel for Purchase Quotes
   */
  async generatePurchaseQuotesExcel(quotes: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Quotes');

    // Headers
    const headers = [
      'Quote No',
      'Date',
      'Vendor',
      'Status',
      'Items Count',
      'Total Amount',
      'Currency',
    ];

    worksheet.addRow(headers).font = { bold: true };

    // Data rows
    for (const quote of quotes) {
      worksheet.addRow([
        quote.quoteNo,
        quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '',
        quote.vendor?.vendorName || '',
        quote.status,
        quote.items?.length || 0,
        quote.totalAmount || 0,
        quote.currency || 'INR',
      ]);
    }

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as any;
  }

  /**
   * Generate Excel for Price Analysis
   */
  async generatePriceAnalysisExcel(analysis: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Price Analysis');

    // Headers
    const headers = [
      'Analysis No',
      'Date',
      'Customer',
      'Status',
      'Items Count',
      'Total Amount',
    ];

    worksheet.addRow(headers).font = { bold: true };

    for (const item of analysis) {
      worksheet.addRow([
        item.analysisNo,
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
        item.customer?.customerName || '',
        item.status,
        item.items?.length || 0,
        item.totalAmount || 0,
      ]);
    }

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as any;
  }

  /**
   * Generate Excel for FMS Tasks
   */
  async generateFmsTasksExcel(tasks: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('FMS Tasks');

    // Headers
    const headers = [
      'Task ID',
      'Title',
      'Status',
      'Assigned To',
      'Due Date',
      'Enquiry No',
      'Is Delayed',
    ];

    worksheet.addRow(headers).font = { bold: true };

    for (const task of tasks) {
      worksheet.addRow([
        task.taskId,
        task.title,
        task.status,
        task.assignedToName || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.enquiryNo || '',
        task.isDelayed ? 'Yes' : 'No',
      ]);
    }

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as any;
  }

  /**
   * Generate Vendor Comparison Excel
   */
  async generateVendorComparisonExcel(comparison: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Vendor Comparison Report']).font = { bold: true, size: 16 };
    summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    summarySheet.addRow([]);

    // Best vendor per item sheet
    if (comparison.bestVendors) {
      const bestSheet = workbook.addWorksheet('Best Vendors');
      bestSheet.addRow(['Item', 'Best Vendor', 'Rate', 'Savings']).font = { bold: true };

      for (const item of comparison.bestVendors) {
        bestSheet.addRow([
          item.productName,
          item.vendorName,
          item.rate,
          item.savings,
        ]);
      }
    }

    // Detailed comparison sheet
    if (comparison.details) {
      const detailSheet = workbook.addWorksheet('Detailed Comparison');
      detailSheet.addRow(['Item', 'Vendor', 'Rate', 'Lead Time', 'Quality Score']).font = { bold: true };

      for (const detail of comparison.details) {
        detailSheet.addRow([
          detail.productName,
          detail.vendorName,
          detail.rate,
          detail.leadTime,
          detail.qualityScore,
        ]);
      }
    }

    workbook.eachSheet((ws) => {
      ws.columns.forEach((column) => {
        column.width = 20;
      });
    });

    return workbook.xlsx.writeBuffer() as any;
  }
}

// Helper variable to avoid lint error
const enquiryData: any[] = [];
