import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SalesInvoice, SalesInvoiceItem } from './entities/sales-order.entity';

@Injectable()
export class SalesInvoicePdfService {
  constructor(
    @InjectRepository(SalesInvoice)
    private invoiceRepo: Repository<SalesInvoice>,
  ) {}

  async generateInvoicePdf(invoiceId: string, companyId?: string): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    const where: FindOptionsWhere<SalesInvoice> = { invoiceId };
    if (companyId) where.companyId = companyId;

    const invoice = await this.invoiceRepo.findOne({
      where,
      relations: ['items'],
    });

    if (!invoice) {
      throw new NotFoundException(`Sales invoice not found: ${invoiceId}`);
    }

    return this.createPdfStream(invoice);
  }

  private createPdfStream(invoice: SalesInvoice): { stream: NodeJS.ReadableStream; filename: string } {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
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
    });

    doc.on('error', (err: Error) => {
      console.error('PDF generation error:', err);
    });

    this.renderInvoice(doc, invoice);

    // Get the filename
    const filename = `INVOICE-${invoice.invoiceNumber}.pdf`;

    return {
      stream: doc as any,
      filename,
    };
  }

  private renderInvoice(doc: PDFKit.PDFDocument, invoice: SalesInvoice): void {
    const pageWidth = doc.page.width - 100;
    let y = 50;

    // ===== HEADER =====
    doc.fontSize(20).font('Helvetica-Bold').text('SALES INVOICE', 50, y, { align: 'center' });
    y += 30;

    // Company Info (Left)
    doc.fontSize(12).font('Helvetica-Bold').text('From:', 50, y);
    y += 15;
    doc.fontSize(10).font('Helvetica-Bold').text('ERP Solutions Pvt. Ltd.');
    y += 14;
    doc.font('Helvetica').fontSize(9).text('123 Business Park, Sector 62');
    y += 12;
    doc.text('Noida, UP - 201301');
    y += 12;
    doc.text('GSTIN: 09AAACH1234H1ZX');
    y += 12;
    doc.text('Phone: +91-120-4567890');
    y += 12;
    doc.text('Email: billing@erpsolutions.com');

    // Invoice Info (Right)
    const rightX = doc.page.width - 200;
    doc.font('Helvetica-Bold').fontSize(10).text('Invoice No:', rightX, 50);
    doc.font('Helvetica').text(invoice.invoiceNumber || '', rightX + 80, 50);

    doc.font('Helvetica-Bold').text('Date:', rightX, 65);
    doc.font('Helvetica').text(this.formatDate(invoice.invoiceDate), rightX + 80, 65);

    if (invoice.dueDate) {
      doc.font('Helvetica-Bold').text('Due Date:', rightX, 80);
      doc.font('Helvetica').text(this.formatDate(invoice.dueDate), rightX + 80, 80);
    }

    doc.font('Helvetica-Bold').text('Status:', rightX, 95);
    doc.font('Helvetica').text(invoice.status || 'DRAFT', rightX + 80, 95);

    y = 130;

    // Horizontal line
    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke();
    y += 15;

    // ===== BILL TO / SHIP TO =====
    const billToX = 50;
    const shipToX = 300;

    doc.font('Helvetica-Bold').fontSize(11).text('Bill To:', billToX, y);
    doc.font('Helvetica-Bold').text('Ship To:', shipToX, y);
    y += 15;

    doc.font('Helvetica-Bold').fontSize(10).text(invoice.customerName || 'Customer', billToX, y);
    doc.font('Helvetica-Bold').text(invoice.customerName || 'Customer', shipToX, y);
    y += 14;

    if (invoice.billingAddress) {
      doc.font('Helvetica').fontSize(9).text(invoice.billingAddress, billToX, y, { width: 200 });
    }
    if (invoice.shippingAddress) {
      doc.font('Helvetica').fontSize(9).text(invoice.shippingAddress, shipToX, y, { width: 200 });
    }
    y += 30;

    if (invoice.customerGstin) {
      doc.text(`GSTIN: ${invoice.customerGstin}`, billToX, y);
      y += 12;
    }

    // E-Invoice details if available
    if (invoice.eInvoiceNumber) {
      doc.text(`E-Invoice No: ${invoice.eInvoiceNumber}`, billToX, y);
      y += 12;
    }

    y += 15;

    // ===== ITEMS TABLE =====
    const tableTop = y;
    const colWidths = [30, 80, 150, 50, 60, 75];
    const colX = [50, 80, 160, 310, 360, 420];

    // Table header
    doc.rect(45, tableTop - 3, pageWidth, 20).fill('#f0f0f0');
    doc.fillColor('black');

    doc.font('Helvetica-Bold').fontSize(8).text('#', colX[0], tableTop + 3);
    doc.text('HSN', colX[1], tableTop + 3);
    doc.text('Description', colX[2], tableTop + 3);
    doc.text('Qty', colX[3], tableTop + 3);
    doc.text('Rate', colX[4], tableTop + 3);
    doc.text('Amount', colX[5], tableTop + 3);

    y = tableTop + 22;
    doc.fillColor('black');

    // Table rows
    const items = (invoice as any).items || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as SalesInvoiceItem;

      // Check page break
      if (y > doc.page.height - 150) {
        this.addPageFooter(doc, invoice);
        doc.addPage();
        y = 50;
      }

      const rowY = y;

      // Alternating row color
      if (i % 2 === 0) {
        doc.rect(45, rowY - 2, pageWidth, 18).fill('#fafafa');
      }

      doc.fillColor('black');
      doc.font('Helvetica').fontSize(8);
      doc.text(String(i + 1), colX[0], rowY);
      doc.text(item.hsnCode || '-', colX[1], rowY, { width: colWidths[1] });
      doc.text(item.productName || item.productCode || '-', colX[2], rowY, { width: colWidths[2] });
      doc.text(`${item.quantity} ${item.uomName || ''}`, colX[3], rowY);
      doc.text(`₹${Number(item.unitPrice || 0).toLocaleString('en-IN')}`, colX[4], rowY);
      doc.text(`₹${Number(item.totalAmount || 0).toLocaleString('en-IN')}`, colX[5], rowY);

      y += 18;
    }

    // Table border
    doc.rect(45, tableTop - 3, pageWidth, y - tableTop + 3).stroke();

    y += 20;

    // ===== TOTALS BOX =====
    const totalsX = doc.page.width - 200;
    doc.rect(totalsX - 10, y - 5, 200, 100).stroke();

    doc.font('Helvetica').fontSize(9);
    doc.text('Subtotal:', totalsX, y);
    doc.text(`₹${Number(invoice.subtotal || 0).toLocaleString('en-IN')}`, totalsX + 100, y);
    y += 15;

    if (Number(invoice.discountAmount || 0) > 0) {
      doc.text('Discount:', totalsX, y);
      doc.text(`-₹${Number(invoice.discountAmount).toLocaleString('en-IN')}`, totalsX + 100, y);
      y += 15;
    }

    if (Number(invoice.cgstAmount || 0) > 0) {
      doc.text('CGST:', totalsX, y);
      doc.text(`₹${Number(invoice.cgstAmount).toLocaleString('en-IN')}`, totalsX + 100, y);
      y += 15;
    }

    if (Number(invoice.sgstAmount || 0) > 0) {
      doc.text('SGST:', totalsX, y);
      doc.text(`₹${Number(invoice.sgstAmount).toLocaleString('en-IN')}`, totalsX + 100, y);
      y += 15;
    }

    if (Number(invoice.igstAmount || 0) > 0) {
      doc.text('IGST:', totalsX, y);
      doc.text(`₹${Number(invoice.igstAmount).toLocaleString('en-IN')}`, totalsX + 100, y);
      y += 15;
    }

    if (Number(invoice.cessAmount || 0) > 0) {
      doc.text('Cess:', totalsX, y);
      doc.text(`₹${Number(invoice.cessAmount).toLocaleString('en-IN')}`, totalsX + 100, y);
      y += 15;
    }

    doc.moveTo(totalsX - 10, y).lineTo(totalsX + 190, y).stroke();
    y += 8;

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL:', totalsX, y);
    doc.text(`₹${Number(invoice.totalAmount || 0).toLocaleString('en-IN')}`, totalsX + 100, y);

    // Amount in words
    y += 30;
    doc.font('Helvetica-Bold').fontSize(9).text('Amount in Words:', 50, y);
    y += 15;
    doc.font('Helvetica').fontSize(9).text(this.numberToWords(Number(invoice.totalAmount || 0)), 50, y, { width: pageWidth });

    // ===== TERMS & CONDITIONS =====
    y += 35;
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, y);
    y += 15;

    doc.font('Helvetica').fontSize(8).font('Helvetica');
    const terms = [
      '1. Payment due within 30 days of invoice date.',
      '2. Interest @ 18% p.a. will be charged on overdue payments.',
      '3. Goods once sold will not be taken back.',
      '4. Subject to Noida jurisdiction only.',
    ];

    for (const term of terms) {
      doc.text(term, 50, y);
      y += 12;
    }

    // ===== NOTES =====
    if (invoice.notes) {
      y += 15;
      doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, y);
      y += 15;
      doc.font('Helvetica').fontSize(8).text(invoice.notes, 50, y, { width: pageWidth });
    }

    // ===== FOOTER =====
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY - 10).lineTo(pageWidth + 50, footerY - 10).stroke();
    doc.fontSize(8).text('Thank you for your business!', 50, footerY, { align: 'center' });
    doc.text('Generated by ERP Solutions', 50, footerY + 12, { align: 'center' });
  }

  private addPageFooter(doc: PDFKit.PDFDocument, invoice: SalesInvoice): void {
    const footerY = doc.page.height - 50;
    doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke();
    doc.fontSize(8).text(
      `Invoice: ${invoice.invoiceNumber} | Page`,
      50,
      footerY + 5,
      { align: 'center' }
    );
  }

  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = Math.floor(num / 100);
    num %= 100;
    const ten = Math.floor(num);

    const part = (n: number, suffix: string) => {
      if (n === 0) return '';
      if (n < 20) return ones[n] + suffix;
      return tens[Math.floor(n / 10)] + (n % 10 ? ones[n % 10] : '') + suffix;
    };

    let words = '';
    if (crore > 0) words += part(crore, ' Crore ');
    if (lakh > 0) words += part(lakh, ' Lakh ');
    if (thousand > 0) words += part(thousand, ' Thousand ');
    if (hundred > 0) words += part(hundred, ' Hundred ');
    if (ten > 0) words += ten < 20 ? ones[ten] : tens[Math.floor(ten / 10)] + (ten % 10 ? ones[ten % 10] : '');

    return words ? `Rupees ${words.trim()} Only` : 'Rupees Zero Only';
  }
}
