import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PurchaseService } from './purchase.service';
import {
  QuotationPdfData,
  QuotationItemPdfData,
  CostBreakdownData,
} from './dto/quotation.dto';

@Injectable()
export class QuotationPdfService {
  constructor(private purchaseService: PurchaseService) {}

  /**
   * Generate quotation PDF
   */
  async generateQuotationPdf(
    quoteId: string,
    options: {
      includeCostBreakdown?: boolean;
      includeVendorComparison?: boolean;
      showMargins?: boolean;
    } = {},
  ): Promise<Buffer> {
    // Fetch quote data
    const quote = await this.purchaseService.findQuoteById(quoteId);
    const items = (quote as any).items || [];

    // Build PDF data
    const pdfData = this.buildPdfData(quote, items, options);

    // Generate PDF
    return this.createPdf(pdfData);
  }

  /**
   * Generate quotation PDF stream for streaming response
   */
  generateQuotationPdfStream(
    quoteId: string,
    options: {
      includeCostBreakdown?: boolean;
      includeVendorComparison?: boolean;
      showMargins?: boolean;
    } = {},
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        const quote = await this.purchaseService.findQuoteById(quoteId);
        const items = (quote as any).items || [];
        const pdfData = this.buildPdfData(quote, items, options);

        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const stream = new (require('stream').Readable)({
            read() {
              this.push(pdfBuffer);
              this.push(null);
            },
          });
          resolve({
            stream,
            filename: `QUOTATION-${pdfData.quotationNumber}.pdf`,
          });
        });
        doc.on('error', reject);

        this.renderPdf(doc, pdfData);
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildPdfData(quote: any, items: any[], options: any): QuotationPdfData {
    const now = new Date();
    const validityDate = new Date(now);
    validityDate.setDate(validityDate.getDate() + (parseInt(options.validityDays) || 30));

    // Calculate totals
    let subtotal = 0;
    let totalGst = 0;
    let totalCbm = 0;
    const pdfItems: QuotationItemPdfData[] = items.map((item, index) => {
      const itemSubtotal = Number(item.totalValue) || 0;
      const gstAmount = itemSubtotal * ((Number(item.gstPercent) || 0) / 100);
      subtotal += itemSubtotal;
      totalGst += gstAmount;
      totalCbm += Number(item.totalCbm) || 0;

      return {
        lineNo: index + 1,
        sku: item.sku || item.productCode || '',
        productName: item.productName || '',
        productDescription: item.productDescription || '',
        quantity: Number(item.quantity) || 0,
        unit: item.uom || 'PCS',
        unitPrice: Number(item.buyingPrice) || 0,
        totalPrice: itemSubtotal,
        discountPercent: item.discountPercent ? Number(item.discountPercent) : undefined,
        discountAmount: item.discountAmount ? Number(item.discountAmount) : undefined,
        gstPercent: item.gstPercent ? Number(item.gstPercent) : undefined,
        gstAmount,
        finalPrice: itemSubtotal + gstAmount,
        leadTimeDays: item.leadTimeDays ? Number(item.leadTimeDays) : undefined,
        imageUrl: item.imageUrl,
        cbm: item.totalCbm ? Number(item.totalCbm) : undefined,
      };
    });

    return {
      companyName: 'ERP Solutions Pvt. Ltd.',
      companyAddress: '123 Business Park, Sector 62, Noida, UP - 201301',
      companyPhone: '+91-120-4567890',
      companyEmail: 'sales@erpsolutions.com',
      quotationNumber: quote.quoteNo || quote.quoteNumber,
      quotationDate: new Date(quote.quoteDate || now).toLocaleDateString('en-IN'),
      quotationValidity: validityDate.toLocaleDateString('en-IN'),
      quotationRef: quote.enquiryOrderId ? `Ref: ${quote.enquiryOrderId}` : undefined,
      customerName: quote.partyName || quote.customerName || 'Valued Customer',
      customerAddress: this.formatAddress(quote),
      customerEmail: quote.emailAddress,
      customerPhone: quote.contactPersonNo,
      salesPersonName: quote.salesPersonName || 'Sales Team',
      items: pdfItems,
      subtotal,
      totalGst,
      totalAmount: subtotal + totalGst,
      totalCbm,
      currency: quote.currency || 'INR',
      paymentTerms: quote.paymentTerms || 'Net 30 Days',
      deliveryTerms: quote.deliveryTerms || 'FOB Destination',
      validityTerms: `This quotation is valid for 30 days from the date of issue`,
      notes: quote.remarks || 'Thank you for your business inquiry.',
    };
  }

  private formatAddress(quote: any): string {
    const parts = [
      quote.city,
      quote.state,
      quote.country,
    ].filter(Boolean);
    return parts.join(', ') || 'As per agreement';
  }

  private createPdf(data: QuotationPdfData): Buffer {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.renderPdf(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    }) as any;
  }

  private renderPdf(doc: PDFKit.PDFDocument, data: QuotationPdfData): void {
    const pageWidth = doc.page.width - 100;
    let y = 50;

    // ===== HEADER =====
    doc.fontSize(20).font('Helvetica-Bold').text(data.companyName, 50, y);
    y += 25;
    doc.fontSize(10).font('Helvetica').text(data.companyAddress, 50, y);
    y += 15;
    doc.text(`${data.companyPhone} | ${data.companyEmail}`, 50, y);
    y += 20;

    // Horizontal line
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    // ===== QUOTATION TITLE =====
    doc.fontSize(18).font('Helvetica-Bold').text('QUOTATION', 50, y, { align: 'center' });
    y += 30;

    // ===== QUOTATION DETAILS (Right side) =====
    const rightX = doc.page.width - 250;
    doc.fontSize(10).font('Helvetica-Bold').text('Quotation No:', rightX, 80);
    doc.font('Helvetica').text(data.quotationNumber, rightX + 90, 80);

    doc.font('Helvetica-Bold').text('Date:', rightX, 95);
    doc.font('Helvetica').text(data.quotationDate, rightX + 90, 95);

    doc.font('Helvetica-Bold').text('Valid Until:', rightX, 110);
    doc.font('Helvetica').text(data.quotationValidity, rightX + 90, 110);

    if (data.quotationRef) {
      doc.font('Helvetica-Bold').text('Reference:', rightX, 125);
      doc.font('Helvetica').text(data.quotationRef, rightX + 90, 125);
    }

    y = 160;

    // ===== CUSTOMER INFO =====
    doc.fontSize(12).font('Helvetica-Bold').text('Customer Details:', 50, y);
    y += 18;
    doc.fontSize(10).font('Helvetica-Bold').text(data.customerName, 50, y);
    y += 15;
    doc.font('Helvetica').fontSize(9).text(data.customerAddress, 50, y);
    y += 25;

    if (data.customerEmail) {
      doc.text(`Email: ${data.customerEmail}`, 50, y);
      y += 12;
    }
    if (data.customerPhone) {
      doc.text(`Phone: ${data.customerPhone}`, 50, y);
      y += 12;
    }
    y += 15;

    // ===== ITEMS TABLE =====
    doc.fontSize(12).font('Helvetica-Bold').text('Items', 50, y);
    y += 20;

    // Table header
    const tableHeaders = [
      { label: '#', x: 50, width: 25 },
      { label: 'SKU', x: 75, width: 70 },
      { label: 'Description', x: 145, width: 150 },
      { label: 'Qty', x: 295, width: 40 },
      { label: 'Unit', x: 335, width: 40 },
      { label: 'Rate', x: 375, width: 60 },
      { label: 'Amount', x: 435, width: 70 },
    ];

    // Draw header row
    doc.rect(45, y - 3, pageWidth, 20).fill('#f0f0f0');
    doc.fillColor('black');
    tableHeaders.forEach(header => {
      doc.fontSize(8).font('Helvetica-Bold').text(header.label, header.x, y + 3);
    });
    y += 20;

    // Table rows
    doc.font('Helvetica').fontSize(8);
    data.items.forEach((item, index) => {
      // Check for page break
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }

      const rowY = y;
      doc.text(String(item.lineNo), 50, rowY);
      doc.text(item.sku || '-', 75, rowY, { width: 70 });
      doc.text(item.productName || '-', 145, rowY, { width: 150 });
      doc.text(String(item.quantity), 295, rowY);
      doc.text(item.unit, 335, rowY);
      doc.text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 375, rowY);
      doc.text(`₹${item.totalPrice.toLocaleString('en-IN')}`, 435, rowY);

      y += 18;

      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(45, rowY - 2, pageWidth, 18).fill('#fafafa');
        // Re-draw text after fill
        doc.fillColor('black');
        doc.text(String(item.lineNo), 50, rowY);
        doc.text(item.sku || '-', 75, rowY, { width: 70 });
        doc.text(item.productName || '-', 145, rowY, { width: 150 });
        doc.text(String(item.quantity), 295, rowY);
        doc.text(item.unit, 335, rowY);
        doc.text(`₹${item.unitPrice.toLocaleString('en-IN')}`, 375, rowY);
        doc.text(`₹${item.totalPrice.toLocaleString('en-IN')}`, 435, rowY);
      }
    });

    y += 15;

    // ===== TOTALS =====
    // Draw totals box
    const totalsX = doc.page.width - 200;
    doc.rect(totalsX - 10, y - 5, 200, 80).stroke();

    doc.fontSize(9).font('Helvetica-Bold').text('Subtotal:', totalsX, y);
    doc.font('Helvetica').text(`₹${data.subtotal.toLocaleString('en-IN')}`, totalsX + 100, y);

    y += 15;
    doc.font('Helvetica-Bold').text('GST:', totalsX, y);
    doc.font('Helvetica').text(`₹${data.totalGst.toLocaleString('en-IN')}`, totalsX + 100, y);

    y += 15;
    doc.moveTo(totalsX - 10, y).lineTo(totalsX + 190, y).stroke();
    y += 5;

    doc.fontSize(11).font('Helvetica-Bold').text('TOTAL:', totalsX, y);
    doc.fontSize(11).font('Helvetica-Bold').text(`₹${data.totalAmount.toLocaleString('en-IN')}`, totalsX + 100, y);

    y += 25;

    // ===== TERMS & CONDITIONS =====
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions', 50, y);
    y += 15;

    doc.fontSize(8).font('Helvetica');
    const terms = [
      `Payment Terms: ${data.paymentTerms}`,
      `Delivery Terms: ${data.deliveryTerms}`,
      `Validity: ${data.validityTerms}`,
    ];

    terms.forEach(term => {
      doc.text(term, 50, y);
      y += 12;
    });

    y += 10;

    // ===== NOTES =====
    if (data.notes) {
      doc.fontSize(10).font('Helvetica-Bold').text('Notes:', 50, y);
      y += 15;
      doc.fontSize(8).font('Helvetica').text(data.notes, 50, y, { width: pageWidth });
      y += 30;
    }

    // ===== FOOTER =====
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY - 10).lineTo(doc.page.width - 50, footerY - 10).stroke();
    doc.fontSize(8).font('Helvetica').text(
      'Thank you for your business! For any queries, please contact us.',
      50,
      footerY,
      { align: 'center' }
    );
  }

  /**
   * Generate cost breakdown report
   */
  async generateCostBreakdown(quoteId: string): Promise<CostBreakdownData[]> {
    const quote = await this.purchaseService.findQuoteById(quoteId);
    const items = (quote as any).items || [];

    return items.map((item: any) => {
      const buyingPrice = Number(item.buyingPrice) || 0;
      const freight = Number(item.freight) || 0;
      const landingCost = buyingPrice + freight;
      const sellingPrice = Number(item.totalValue) || landingCost;
      const margin = sellingPrice - landingCost;
      const marginPercent = landingCost > 0 ? (margin / landingCost) * 100 : 0;

      return {
        itemName: item.productName || item.sku || 'Unknown',
        buyingPrice,
        freight,
        landingCost,
        sellingPrice,
        margin,
        marginPercent: Math.round(marginPercent * 100) / 100,
      };
    });
  }
}
