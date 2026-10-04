import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase-order.entity';
import { S3Service } from '../files/s3.service';

@Injectable()
export class PurchaseOrderPdfService {
  private readonly logger = new Logger(PurchaseOrderPdfService.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    private readonly s3Service: S3Service,
  ) {}

  @OnEvent('purchase-order.approved')
  async handlePurchaseOrderApproved(payload: { orderId: string; companyId: string; userId: string }) {
    try {
      const { stream } = await this.generatePurchaseOrderPdf(payload.orderId, payload.companyId);

      const chunks: Buffer[] = [];
      for await (const chunk of stream as AsyncIterable<any>) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      const key = `companies/${payload.companyId}/purchase-orders/${uuidv4()}.pdf`;
      const publicUrl = await this.s3Service.uploadBuffer(key, buffer, 'application/pdf');

      await this.poRepo.update(payload.orderId, { poUrl: publicUrl });

      this.logger.log(`PO PDF saved for order ${payload.orderId}: ${publicUrl}`);
    } catch (error) {
      this.logger.error(`Failed to save PO PDF for order ${payload.orderId}:`, error);
    }
  }

  async generatePurchaseOrderPdf(
    orderId: string,
    companyId?: string,
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    const where: FindOptionsWhere<PurchaseOrder> = { orderId };
    if (companyId) where.companyId = companyId;

    const order = await this.poRepo.findOne({
      where,
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Purchase order not found: ${orderId}`);
    }

    return this.createPdfStream(order);
  }

  private createPdfStream(order: PurchaseOrder): { stream: NodeJS.ReadableStream; filename: string } {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    this.renderPurchaseOrder(doc, order);
    const filename = `PO-${order.orderNumber.replace(/\//g, '-')}.pdf`;
    return { stream: doc as any, filename };
  }

  private renderPurchaseOrder(doc: PDFKit.PDFDocument, order: PurchaseOrder): void {
    const LM = 30;
    const pageW = doc.page.width - 60;
    const RE = LM + pageW;
    let y = 30;

    // ===== HEADER =====
    doc.fontSize(14).font('Helvetica-Bold').text('Indent To Purchase', LM, y, { width: pageW, align: 'center' });
    y += 20;

    doc.fontSize(13).font('Helvetica-Bold').text('Krishna Overseas INC', LM, y, { width: pageW, align: 'center' });
    y += 18;

    doc.fontSize(7).font('Helvetica').text(
      '229, Dada Deepu Chowk, Bharthal , Sector - 26, Dwarka, New Delhi - 110077',
      LM, y, { width: pageW, align: 'center' },
    );
    y += 10;
    doc.text(
      'Branch Address : D-29/14. TTC INDUSTRIAL AREA, TURBHE MIDC , NAVI MUMBAI - 400037',
      LM, y, { width: pageW, align: 'center' },
    );
    y += 16;

    // ===== INFO TABLE =====
    const col1LabelW = 90;
    const col1ValW = 170;
    const col2LabelW = 90;
    const col2ValW = 150;
    const col3LabelW = 80;
    const col3ValW = pageW - col1LabelW - col1ValW - col2LabelW - col2ValW - col3LabelW;
    const rowH = 16;
    const cellPad = 3;

    const drawInfoCell = (x: number, yPos: number, w: number, h: number, text: string, bold = false, bg?: string) => {
      if (bg) { doc.save().rect(x, yPos, w, h).fill(bg).restore(); }
      doc.rect(x, yPos, w, h).stroke();
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7)
        .fillColor('black')
        .text(text || '', x + cellPad, yPos + cellPad, { width: w - cellPad * 2, height: h - cellPad * 2 });
    };

    const lightBlue = '#DCE6F1';

    // Row 1
    let cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'Purchase Order No', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, order.poNumber || order.orderNumber || ''); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Order no.', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW, rowH, order.enquiryNo || order.soNo || ''); cx += col2ValW;
    drawInfoCell(cx, y, col3LabelW + col3ValW, rowH, 'Material Received\nExpected Date', true, lightBlue);
    y += rowH;

    // Row 2
    cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'Purchase Date', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, this.formatDate(order.orderDate)); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Purchase\nPerson Name', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW, rowH, order.purchasePerson || ''); cx += col2ValW;
    drawInfoCell(cx, y, col3LabelW + col3ValW, rowH, 'Location', true, lightBlue);
    y += rowH;

    // Row 3
    cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'Vender Name', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, order.vendorName || ''); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Vender Code', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW + col3LabelW + col3ValW, rowH, order.vendorCode || '');
    y += rowH;

    // Row 4
    cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'Contact Person\nNo:-', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, [order.contactPhone, order.vendorMobileNo].filter(Boolean).join('  ') || ''); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Person Name', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW + col3LabelW + col3ValW, rowH, order.contactPerson || '');
    y += rowH;

    // Row 5
    cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'Vender Address', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, order.billingAddress || ''); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Payment Term', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW + col3LabelW + col3ValW, rowH, order.paymentTermsName || '');
    y += rowH;

    // Row 6
    cx = LM;
    drawInfoCell(cx, y, col1LabelW, rowH, 'GSTIN/UIN', true, lightBlue); cx += col1LabelW;
    drawInfoCell(cx, y, col1ValW, rowH, order.vendorGstin || ''); cx += col1ValW;
    drawInfoCell(cx, y, col2LabelW, rowH, 'Freight Term', true, lightBlue); cx += col2LabelW;
    drawInfoCell(cx, y, col2ValW + col3LabelW + col3ValW, rowH, order.freightTerm || '');
    y += rowH;

    y += 6;

    // ===== ITEMS TABLE =====
    const cols = [
      { header: 'S. No.', width: 30, align: 'center' as const },
      { header: 'Unique Code', width: 95, align: 'left' as const },
      { header: 'Item Description', width: 140, align: 'left' as const },
      { header: 'Unit (Per\nKg / Per\nPcs)', width: 45, align: 'center' as const },
      { header: 'Order Qty (Per\nCase)', width: 55, align: 'center' as const },
      { header: 'Qty (Per\nKg / Per\nPcs)', width: 50, align: 'center' as const },
      { header: 'Best Price\nAs on Date', width: 60, align: 'right' as const },
      { header: 'GST', width: 40, align: 'center' as const },
      { header: 'Remark', width: 50, align: 'left' as const },
      { header: 'Amount', width: 65, align: 'right' as const },
      { header: 'GST\nAmount', width: 55, align: 'right' as const },
      { header: 'Total\nAmount', width: 65, align: 'right' as const },
    ];

    const tableW = cols.reduce((s, c) => s + c.width, 0);
    const colXs: number[] = [];
    let tx = LM;
    for (const c of cols) { colXs.push(tx); tx += c.width; }

    // Header row
    const headerH = 28;
    doc.save().rect(LM, y, tableW, headerH).fill(lightBlue).restore();
    doc.lineWidth(0.5);
    for (let i = 0; i < cols.length; i++) {
      doc.rect(colXs[i], y, cols[i].width, headerH).stroke();
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor('black')
        .text(cols[i].header, colXs[i] + 2, y + 3, { width: cols[i].width - 4, align: 'center' });
    }
    y += headerH;

    // Data rows
    const items: PurchaseOrderItem[] = (order as any).items || [];
    const itemRowH = 22;
    const minEmptyRows = 3;
    const totalRows = Math.max(items.length, items.length + minEmptyRows);

    for (let i = 0; i < totalRows; i++) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = 30;
      }

      const item = items[i];
      for (let j = 0; j < cols.length; j++) {
        doc.rect(colXs[j], y, cols[j].width, itemRowH).stroke();
      }

      if (item) {
        const unitPrice = Number(item.unitPrice || item.bestPrice || 0);
        const orderQty = Number(item.orderQty || 0);
        const qty = Number(item.quantity || 0);
        const gstRate = Number(item.gstRate || 0);
        const taxableAmt = Number(item.taxableAmount || unitPrice * qty);
        const gstAmt = Number(item.taxAmount || 0);
        const totalAmt = Number(item.totalAmount || 0);

        const vals = [
          String(item.lineNumber || i + 1),
          item.uniqueCode || item.productCode || '',
          item.productName || '',
          item.uomName || '',
          orderQty ? String(orderQty) : '',
          qty ? String(qty) : '',
          unitPrice ? this.fmtNum(unitPrice) : '',
          gstRate ? `${this.fmtNum(gstRate)}%` : '',
          item.remark || '',
          taxableAmt ? this.fmtNum(taxableAmt) : '',
          gstAmt ? this.fmtNum(gstAmt) : '',
          totalAmt ? this.fmtNum(totalAmt) : '',
        ];

        doc.font('Helvetica').fontSize(6.5).fillColor('black');
        for (let j = 0; j < cols.length; j++) {
          doc.text(vals[j], colXs[j] + 2, y + 3, { width: cols[j].width - 4, align: cols[j].align });
        }
      } else {
        const lastColIdx = cols.length - 1;
        doc.font('Helvetica').fontSize(6.5).fillColor('black')
          .text('0.00', colXs[lastColIdx] + 2, y + 3, { width: cols[lastColIdx].width - 4, align: 'right' });
      }

      y += itemRowH;
    }

    y += 4;

    // ===== TERMS & CONDITIONS =====
    doc.font('Helvetica-Bold').fontSize(7).fillColor('black')
      .text('Term & Conditions:-', LM, y, { continued: true });
    doc.font('Helvetica').fontSize(7)
      .text(
        ` ${order.termsAndConditions || 'Kindly Send the Material along with challan / Invoice and Duplicate'}`,
        { width: pageW - 120 },
      );
    y += 14;

    // ===== FOOTER SECTION =====
    const footerY = y;
    const summaryLabelW = 80;
    const summaryValW = 80;
    const summaryX = LM + tableW - summaryLabelW - summaryValW;

    // Left side: Delivery, Billing Address, GST No.
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text('Delivery :', LM, footerY);
    doc.font('Helvetica').text(order.shippingAddress || '', LM + 80, footerY, { width: 200 });

    doc.font('Helvetica-Bold').text('Billing Address', LM, footerY + 14);
    doc.font('Helvetica').text(order.billingAddress || '', LM + 80, footerY + 14, { width: 200 });

    doc.font('Helvetica-Bold').text('GST No.', LM, footerY + 28);
    doc.font('Helvetica').text(order.vendorGstin || '', LM + 80, footerY + 28, { width: 200 });

    // Right side: Summary totals
    const drawSummaryRow = (label: string, value: string, yPos: number, bold = false) => {
      doc.rect(summaryX, yPos, summaryLabelW, 14).stroke();
      doc.rect(summaryX + summaryLabelW, yPos, summaryValW, 14).stroke();
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
      doc.text(label, summaryX + 3, yPos + 3, { width: summaryLabelW - 6, align: 'right' });
      doc.text(value, summaryX + summaryLabelW + 3, yPos + 3, { width: summaryValW - 6, align: 'right' });
    };

    let sy = footerY;
    drawSummaryRow('Subtotal', this.fmtNum(Number(order.subtotal || 0)), sy);
    sy += 14;
    drawSummaryRow('Frieght', this.fmtNum(Number(order.freightAmount || 0)), sy);
    sy += 14;
    drawSummaryRow('GST', this.fmtNum(Number(order.taxAmount || 0)), sy);
    sy += 14;
    drawSummaryRow('TOTAL PAYABLE', this.fmtNum(Number(order.totalAmount || 0)), sy, true);
    sy += 14;

    y = Math.max(y + 50, sy + 10);

    // ===== REGARDS =====
    doc.font('Helvetica-Bold').fontSize(8).text('Regards :', LM, y);

    doc.end();
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private fmtNum(n: number): string {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
