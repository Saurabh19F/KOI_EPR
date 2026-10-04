import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SalesOrder, SalesOrderItem } from './entities/sales-order.entity';

interface QuotationPdfOptions {
  showGst?: boolean;         // Include GST breakdown (default: true)
  showDiscount?: boolean;    // Show discount column (default: true)
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPhone?: string;
  companyEmail?: string;
}

@Injectable()
export class SalesQuotationPdfService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepo: Repository<SalesOrderItem>,
  ) {}

  /**
   * Generate a customer-facing sales quotation PDF from a sales order
   */
  async generateQuotationPdf(
    orderId: string,
    companyId?: string,
    options: QuotationPdfOptions = {},
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    const where: FindOptionsWhere<SalesOrder> = { orderId };
    if (companyId) where.companyId = companyId;

    const order = await this.salesOrderRepo.findOne({ where });
    if (!order) {
      throw new NotFoundException(`Sales order not found: ${orderId}`);
    }

    // Fetch items separately since relation might not be set up
    const items = await this.salesOrderItemRepo.find({
      where: { orderId, isActive: true },
      order: { lineNumber: 'ASC' },
    });

    return this.createPdfStream(order, items, options);
  }

  private createPdfStream(
    order: SalesOrder,
    items: SalesOrderItem[],
    options: QuotationPdfOptions,
  ): { stream: NodeJS.ReadableStream; filename: string } {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const quotationNumber = order.quotationId || order.orderNumber || 'DRAFT';
    const filename = `QUOTATION-${quotationNumber}.pdf`;

    this.renderQuotation(doc, order, items, options);

    return { stream: doc as any, filename };
  }

  private renderQuotation(
    doc: PDFKit.PDFDocument,
    order: SalesOrder,
    items: SalesOrderItem[],
    options: QuotationPdfOptions,
  ): void {
    const pageWidth = doc.page.width - 100; // 50 margin each side
    const showGst = options.showGst !== false;
    const showDiscount = options.showDiscount !== false;
    let y = 50;

    // ===== HEADER / COMPANY INFO =====
    const companyName = options.companyName || 'KOI India';
    const companyAddress = options.companyAddress || '';
    const companyGstin = options.companyGstin || '';
    const companyPhone = options.companyPhone || '';
    const companyEmail = options.companyEmail || '';

    // Company name - large
    doc.fontSize(18).font('Helvetica-Bold').text(companyName, 50, y, { align: 'center' });
    y += 25;

    if (companyAddress) {
      doc.fontSize(9).font('Helvetica').text(companyAddress, 50, y, { align: 'center' });
      y += 12;
    }
    if (companyPhone || companyEmail) {
      const contactLine = [companyPhone, companyEmail].filter(Boolean).join(' | ');
      doc.fontSize(9).font('Helvetica').text(contactLine, 50, y, { align: 'center' });
      y += 12;
    }
    if (companyGstin) {
      doc.fontSize(9).font('Helvetica').text(`GSTIN: ${companyGstin}`, 50, y, { align: 'center' });
      y += 12;
    }

    y += 5;

    // ===== QUOTATION TITLE BAR =====
    doc.rect(50, y, pageWidth, 28).fill('#1a365d');
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text('SALES QUOTATION', 50, y + 7, { align: 'center', width: pageWidth });
    doc.fillColor('black');
    y += 38;

    // ===== QUOTATION DETAILS (Left) + CUSTOMER (Right) =====
    const leftX = 50;
    const rightX = 310;

    // Left column - Quotation details
    doc.font('Helvetica-Bold').fontSize(9).text('Quotation No:', leftX, y);
    doc.font('Helvetica').text(order.quotationId || order.orderNumber || '-', leftX + 85, y);
    y += 14;

    doc.font('Helvetica-Bold').text('Order No:', leftX, y);
    doc.font('Helvetica').text(order.orderNumber || '-', leftX + 85, y);
    y += 14;

    doc.font('Helvetica-Bold').text('Date:', leftX, y);
    doc.font('Helvetica').text(this.formatDate(order.orderDate || order.createdAt), leftX + 85, y);
    y += 14;

    if (order.expectedDeliveryDate) {
      doc.font('Helvetica-Bold').text('Delivery By:', leftX, y);
      doc.font('Helvetica').text(this.formatDate(order.expectedDeliveryDate), leftX + 85, y);
      y += 14;
    }

    if (order.paymentTermsName) {
      doc.font('Helvetica-Bold').text('Payment:', leftX, y);
      doc.font('Helvetica').text(order.paymentTermsName, leftX + 85, y);
      y += 14;
    }

    if (order.salesPersonName) {
      doc.font('Helvetica-Bold').text('Sales Person:', leftX, y);
      doc.font('Helvetica').text(order.salesPersonName, leftX + 85, y);
      y += 14;
    }

    // Right column - Customer details (positioned at same Y as quotation details start)
    const custStartY = y - (14 * 4); // go back to align with left column start
    let custY = custStartY > 0 ? custStartY : y;

    doc.font('Helvetica-Bold').fontSize(10).text('To:', rightX, custY);
    custY += 14;

    doc.font('Helvetica-Bold').fontSize(10).text(order.customerName || 'Customer', rightX, custY);
    custY += 14;

    if (order.contactPerson) {
      doc.font('Helvetica').fontSize(9).text(`Attn: ${order.contactPerson}`, rightX, custY);
      custY += 12;
    }

    if (order.billingAddress) {
      doc.font('Helvetica').fontSize(9).text(order.billingAddress, rightX, custY, { width: 200 });
      custY += 12;
    }

    const cityState = [order.billingCity, order.billingState, order.billingPincode].filter(Boolean).join(', ');
    if (cityState) {
      doc.font('Helvetica').fontSize(9).text(cityState, rightX, custY);
      custY += 12;
    }

    if (order.billingGstin) {
      doc.font('Helvetica').fontSize(9).text(`GSTIN: ${order.billingGstin}`, rightX, custY);
      custY += 12;
    }

    if (order.contactPhone) {
      doc.font('Helvetica').fontSize(9).text(`Ph: ${order.contactPhone}`, rightX, custY);
      custY += 12;
    }

    if (order.contactEmail) {
      doc.font('Helvetica').fontSize(9).text(order.contactEmail, rightX, custY);
      custY += 12;
    }

    // Use max of left and right column ending positions
    y = Math.max(y, custY) + 10;

    // Horizontal separator
    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#cccccc');
    y += 15;

    // ===== ITEMS TABLE =====
    y = this.renderItemsTable(doc, items, y, pageWidth, showGst, showDiscount);

    y += 20;

    // ===== TOTALS BOX =====
    y = this.renderTotals(doc, order, y, pageWidth, showGst);

    // ===== AMOUNT IN WORDS =====
    y += 15;
    doc.font('Helvetica-Bold').fontSize(9).text('Amount in Words:', 50, y);
    y += 13;
    doc.font('Helvetica-Oblique').fontSize(9)
      .text(this.numberToWords(Number(order.totalAmount || 0)), 50, y, { width: pageWidth });
    y += 20;

    // ===== SHIPPING DETAILS (if different from billing) =====
    if (order.shippingAddress && order.shippingAddress !== order.billingAddress) {
      if (y > doc.page.height - 160) {
        doc.addPage();
        y = 50;
      }

      doc.font('Helvetica-Bold').fontSize(10).text('Shipping Address:', 50, y);
      y += 14;
      doc.font('Helvetica').fontSize(9).text(order.shippingAddress, 50, y, { width: 250 });
      y += 14;
      const shipCityState = [order.shippingCity, order.shippingState, order.shippingPincode].filter(Boolean).join(', ');
      if (shipCityState) {
        doc.text(shipCityState, 50, y);
        y += 14;
      }
      y += 10;
    }

    // ===== TERMS & CONDITIONS =====
    if (y > doc.page.height - 140) {
      doc.addPage();
      y = 50;
    }

    doc.font('Helvetica-Bold').fontSize(10).text('Terms & Conditions:', 50, y);
    y += 14;

    if (order.termsAndConditions) {
      doc.font('Helvetica').fontSize(8).text(order.termsAndConditions, 50, y, { width: pageWidth });
      y += doc.heightOfString(order.termsAndConditions, { width: pageWidth }) + 10;
    } else {
      // Default terms
      const defaultTerms = [
        '1. Prices are valid for 30 days from the date of this quotation.',
        '2. GST as applicable will be charged extra unless mentioned inclusive.',
        '3. Delivery: As mutually agreed.',
        '4. Payment: As per agreed payment terms.',
        '5. This is a system-generated quotation.',
      ];
      doc.font('Helvetica').fontSize(8);
      for (const term of defaultTerms) {
        doc.text(term, 50, y, { width: pageWidth });
        y += 12;
      }
    }

    // ===== NOTES =====
    if (order.notes) {
      y += 10;
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }
      doc.font('Helvetica-Bold').fontSize(10).text('Notes:', 50, y);
      y += 14;
      doc.font('Helvetica').fontSize(8).text(order.notes, 50, y, { width: pageWidth });
      y += doc.heightOfString(order.notes, { width: pageWidth }) + 10;
    }

    // ===== SIGNATURE SECTION =====
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }

    y = doc.page.height - 100;
    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#cccccc');
    y += 15;

    // Left: acceptance
    doc.font('Helvetica').fontSize(8).text('Customer Acceptance:', 50, y);
    doc.moveTo(50, y + 30).lineTo(200, y + 30).stroke('#999999');
    doc.text('Signature & Stamp', 50, y + 35);

    // Right: for company
    doc.text(`For ${options.companyName || 'KOI India'}`, 380, y);
    doc.moveTo(380, y + 30).lineTo(530, y + 30).stroke('#999999');
    doc.text('Authorised Signatory', 380, y + 35);

    // Footer
    const footerY = doc.page.height - 30;
    doc.fontSize(7).fillColor('#888888')
      .text('This is a computer-generated quotation.', 50, footerY, { align: 'center', width: pageWidth });

    doc.end();
  }

  private renderItemsTable(
    doc: PDFKit.PDFDocument,
    items: SalesOrderItem[],
    startY: number,
    pageWidth: number,
    showGst: boolean,
    showDiscount: boolean,
  ): number {
    let y = startY;

    // Define columns based on options
    interface Column { label: string; x: number; width: number; align?: string }
    const columns: Column[] = [];

    if (showGst && showDiscount) {
      columns.push(
        { label: '#', x: 50, width: 25 },
        { label: 'Description', x: 75, width: 150 },
        { label: 'HSN', x: 225, width: 50 },
        { label: 'Qty', x: 275, width: 40 },
        { label: 'Unit', x: 315, width: 35 },
        { label: 'Rate (₹)', x: 350, width: 60, align: 'right' },
        { label: 'Disc %', x: 410, width: 35, align: 'right' },
        { label: 'GST %', x: 445, width: 35, align: 'right' },
        { label: 'Amount (₹)', x: 480, width: 65, align: 'right' },
      );
    } else if (showGst) {
      columns.push(
        { label: '#', x: 50, width: 25 },
        { label: 'Description', x: 75, width: 165 },
        { label: 'HSN', x: 240, width: 55 },
        { label: 'Qty', x: 295, width: 45 },
        { label: 'Unit', x: 340, width: 40 },
        { label: 'Rate (₹)', x: 380, width: 65, align: 'right' },
        { label: 'GST %', x: 445, width: 40, align: 'right' },
        { label: 'Amount (₹)', x: 485, width: 60, align: 'right' },
      );
    } else {
      columns.push(
        { label: '#', x: 50, width: 25 },
        { label: 'Description', x: 75, width: 190 },
        { label: 'HSN', x: 265, width: 55 },
        { label: 'Qty', x: 320, width: 50 },
        { label: 'Unit', x: 370, width: 45 },
        { label: 'Rate (₹)', x: 415, width: 65, align: 'right' },
        { label: 'Amount (₹)', x: 480, width: 65, align: 'right' },
      );
    }

    // Table header background
    doc.rect(50, y, pageWidth, 20).fill('#2d3748');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8);

    for (const col of columns) {
      doc.text(col.label, col.x, y + 5, {
        width: col.width,
        align: (col.align as any) || 'left',
      });
    }

    doc.fillColor('black');
    y += 22;

    // Table rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Page break check
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 50;

        // Re-render header on new page
        doc.rect(50, y, pageWidth, 20).fill('#2d3748');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
        for (const col of columns) {
          doc.text(col.label, col.x, y + 5, {
            width: col.width,
            align: (col.align as any) || 'left',
          });
        }
        doc.fillColor('black');
        y += 22;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(50, y - 2, pageWidth, 18).fill('#f7fafc');
      }

      doc.fillColor('black').font('Helvetica').fontSize(8);

      const vals: string[] = [];
      if (showGst && showDiscount) {
        vals.push(
          String(i + 1),
          item.productName || item.productCode || '-',
          item.hsnCode || '-',
          String(Number(item.quantity || 0)),
          item.uomName || 'Nos',
          this.formatCurrency(item.unitPrice),
          Number(item.discountPercent || 0) > 0 ? `${item.discountPercent}%` : '-',
          `${Number(item.gstRate || 0)}%`,
          this.formatCurrency(item.totalAmount),
        );
      } else if (showGst) {
        vals.push(
          String(i + 1),
          item.productName || item.productCode || '-',
          item.hsnCode || '-',
          String(Number(item.quantity || 0)),
          item.uomName || 'Nos',
          this.formatCurrency(item.unitPrice),
          `${Number(item.gstRate || 0)}%`,
          this.formatCurrency(item.totalAmount),
        );
      } else {
        vals.push(
          String(i + 1),
          item.productName || item.productCode || '-',
          item.hsnCode || '-',
          String(Number(item.quantity || 0)),
          item.uomName || 'Nos',
          this.formatCurrency(item.unitPrice),
          this.formatCurrency(item.totalAmount),
        );
      }

      for (let c = 0; c < columns.length; c++) {
        doc.text(vals[c], columns[c].x, y, {
          width: columns[c].width,
          align: (columns[c].align as any) || 'left',
        });
      }

      y += 18;
    }

    // Table bottom border
    doc.moveTo(50, y).lineTo(pageWidth + 50, y).stroke('#2d3748');

    return y;
  }

  private renderTotals(
    doc: PDFKit.PDFDocument,
    order: SalesOrder,
    startY: number,
    pageWidth: number,
    showGst: boolean,
  ): number {
    let y = startY;
    const totalsX = pageWidth + 50 - 200;
    const labelX = totalsX;
    const valueX = totalsX + 120;

    // Check page break
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = 50;
    }

    // Totals box background
    doc.rect(totalsX - 10, y - 5, 210, showGst ? 130 : 80).lineWidth(0.5).stroke('#2d3748');

    doc.font('Helvetica').fontSize(9);

    // Subtotal
    doc.text('Subtotal:', labelX, y);
    doc.text(this.formatCurrency(order.subtotal), valueX, y, { width: 80, align: 'right' });
    y += 15;

    // Discount
    if (Number(order.discountAmount || 0) > 0) {
      doc.text('Discount:', labelX, y);
      doc.text(`-${this.formatCurrency(order.discountAmount)}`, valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    // GST breakdown
    if (showGst) {
      if (Number(order.cgstAmount || 0) > 0) {
        doc.text('CGST:', labelX, y);
        doc.text(this.formatCurrency(order.cgstAmount), valueX, y, { width: 80, align: 'right' });
        y += 15;
      }

      if (Number(order.sgstAmount || 0) > 0) {
        doc.text('SGST:', labelX, y);
        doc.text(this.formatCurrency(order.sgstAmount), valueX, y, { width: 80, align: 'right' });
        y += 15;
      }

      if (Number(order.igstAmount || 0) > 0) {
        doc.text('IGST:', labelX, y);
        doc.text(this.formatCurrency(order.igstAmount), valueX, y, { width: 80, align: 'right' });
        y += 15;
      }

      if (Number(order.cessAmount || 0) > 0) {
        doc.text('Cess:', labelX, y);
        doc.text(this.formatCurrency(order.cessAmount), valueX, y, { width: 80, align: 'right' });
        y += 15;
      }
    }

    // Freight, packing, insurance, other charges
    if (Number(order.freightAmount || 0) > 0) {
      doc.text('Freight:', labelX, y);
      doc.text(this.formatCurrency(order.freightAmount), valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    if (Number(order.packingAmount || 0) > 0) {
      doc.text('Packing:', labelX, y);
      doc.text(this.formatCurrency(order.packingAmount), valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    if (Number(order.insuranceAmount || 0) > 0) {
      doc.text('Insurance:', labelX, y);
      doc.text(this.formatCurrency(order.insuranceAmount), valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    if (Number(order.otherCharges || 0) > 0) {
      doc.text('Other Charges:', labelX, y);
      doc.text(this.formatCurrency(order.otherCharges), valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    if (Number(order.roundOff || 0) !== 0) {
      doc.text('Round Off:', labelX, y);
      doc.text(this.formatCurrency(order.roundOff), valueX, y, { width: 80, align: 'right' });
      y += 15;
    }

    // Separator line
    doc.moveTo(labelX, y).lineTo(labelX + 200, y).stroke('#2d3748');
    y += 8;

    // Grand total
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL:', labelX, y);
    doc.text(this.formatCurrency(order.totalAmount), valueX, y, { width: 80, align: 'right' });

    y += 20;
    return y;
  }

  // ===== UTILITY METHODS =====

  private formatCurrency(value: number | string | undefined | null): string {
    const num = Number(value || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatDate(date: Date | string | undefined | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private numberToWords(num: number): string {
    if (num === 0) return 'Rupees Zero Only';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const intPart = Math.floor(Math.abs(num));
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const hundred = Math.floor((intPart % 1000) / 100);
    const remainder = intPart % 100;

    const twoDigit = (n: number): string => {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    };

    let words = '';
    if (crore > 0) words += twoDigit(crore) + ' Crore ';
    if (lakh > 0) words += twoDigit(lakh) + ' Lakh ';
    if (thousand > 0) words += twoDigit(thousand) + ' Thousand ';
    if (hundred > 0) words += ones[hundred] + ' Hundred ';
    if (remainder > 0) {
      if (words) words += 'and ';
      words += twoDigit(remainder);
    }

    return `Rupees ${words.trim()} Only`;
  }
}
