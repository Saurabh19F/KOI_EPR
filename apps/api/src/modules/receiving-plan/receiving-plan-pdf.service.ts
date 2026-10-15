import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceivingPlan } from './entities/receiving-plan.entity';

@Injectable()
export class ReceivingPlanPdfService {
  constructor(
    @InjectRepository(ReceivingPlan)
    private readonly rpRepo: Repository<ReceivingPlan>,
  ) {}

  async generateReceivingPlanPdf(
    planId: string,
    companyId?: string,
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    const where: any = { planId };
    if (companyId) where.companyId = companyId;

    const plan = await this.rpRepo.findOne({ where });
    if (!plan) {
      throw new NotFoundException(`Receiving plan not found: ${planId}`);
    }

    return this.createPdfStream(plan);
  }

  async generateBulkReceivingPlanPdf(
    planIds: string[],
    companyId?: string,
  ): Promise<{ stream: NodeJS.ReadableStream; filename: string }> {
    const plans: ReceivingPlan[] = [];
    for (const planId of planIds) {
      const where: any = { planId };
      if (companyId) where.companyId = companyId;
      const plan = await this.rpRepo.findOne({ where });
      if (plan) plans.push(plan);
    }

    if (plans.length === 0) {
      throw new NotFoundException('No receiving plans found');
    }

    return this.createBulkPdfStream(plans);
  }

  private createPdfStream(plan: ReceivingPlan): { stream: NodeJS.ReadableStream; filename: string } {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    this.renderPlan(doc, plan);
    doc.end();
    const filename = `RP-${plan.planNumber.replace(/\//g, '-')}.pdf`;
    return { stream: doc as any, filename };
  }

  private createBulkPdfStream(plans: ReceivingPlan[]): { stream: NodeJS.ReadableStream; filename: string } {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    plans.forEach((plan, index) => {
      if (index > 0) doc.addPage();
      this.renderPlan(doc, plan);
    });
    doc.end();
    const filename = `Receiving-Plans-${Date.now()}.pdf`;
    return { stream: doc as any, filename };
  }

  private renderPlan(doc: PDFKit.PDFDocument, plan: ReceivingPlan): void {
    const LM = 40;
    const pageW = doc.page.width - 80;
    let y = 40;

    const lightBlue = '#DCE6F1';
    const cellPad = 4;
    const rowH = 20;

    doc.fontSize(16).font('Helvetica-Bold').text('Receiving Plan', LM, y, { width: pageW, align: 'center' });
    y += 28;

    doc.fontSize(13).font('Helvetica-Bold').text('Krishna Overseas INC', LM, y, { width: pageW, align: 'center' });
    y += 18;

    doc.fontSize(7).font('Helvetica').text(
      '229, Dada Deepu Chowk, Bharthal, Sector - 26, Dwarka, New Delhi - 110077',
      LM, y, { width: pageW, align: 'center' },
    );
    y += 22;

    const labelW = 130;
    const valW = pageW / 2 - labelW;

    const drawCell = (x: number, yPos: number, w: number, h: number, text: string, bold = false, bg?: string) => {
      if (bg) { doc.save().rect(x, yPos, w, h).fill(bg).restore(); }
      doc.rect(x, yPos, w, h).stroke();
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
        .fillColor('black')
        .text(text || '', x + cellPad, yPos + cellPad, { width: w - cellPad * 2, height: h - cellPad * 2 });
    };

    drawCell(LM, y, labelW, rowH, 'Plan Number', true, lightBlue);
    drawCell(LM + labelW, y, valW, rowH, plan.planNumber);
    drawCell(LM + labelW + valW, y, labelW, rowH, 'Status', true, lightBlue);
    drawCell(LM + labelW + valW + labelW, y, valW, rowH, plan.status.toUpperCase());
    y += rowH;

    drawCell(LM, y, labelW, rowH, 'PO Number', true, lightBlue);
    drawCell(LM + labelW, y, valW, rowH, plan.poNumber || '');
    drawCell(LM + labelW + valW, y, labelW, rowH, 'Created Date', true, lightBlue);
    drawCell(LM + labelW + valW + labelW, y, valW, rowH, this.formatDate(plan.createdAt));
    y += rowH;

    drawCell(LM, y, labelW, rowH, 'Product Name', true, lightBlue);
    drawCell(LM + labelW, y, pageW - labelW, rowH, plan.productName || '');
    y += rowH;

    drawCell(LM, y, labelW, rowH, 'Warehouse', true, lightBlue);
    drawCell(LM + labelW, y, valW, rowH, plan.warehouseName || '');
    drawCell(LM + labelW + valW, y, labelW, rowH, 'Planned By', true, lightBlue);
    drawCell(LM + labelW + valW + labelW, y, valW, rowH, plan.plannedBy || '');
    y += rowH;

    y += 10;

    const qtyColW = pageW / 3;
    drawCell(LM, y, qtyColW, rowH * 2, '', false);
    drawCell(LM + qtyColW, y, qtyColW, rowH * 2, '', false);
    drawCell(LM + qtyColW * 2, y, qtyColW, rowH * 2, '', false);

    doc.font('Helvetica-Bold').fontSize(7).fillColor('#666')
      .text('PLANNED QTY', LM + cellPad, y + cellPad, { width: qtyColW - cellPad * 2, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#d32f2f')
      .text(String(Number(plan.plannedQty) || 0), LM + cellPad, y + 14, { width: qtyColW - cellPad * 2, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(7).fillColor('#666')
      .text('RECEIVED QTY', LM + qtyColW + cellPad, y + cellPad, { width: qtyColW - cellPad * 2, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#2e7d32')
      .text(String(Number(plan.totalReceivedQty) || 0), LM + qtyColW + cellPad, y + 14, { width: qtyColW - cellPad * 2, align: 'center' });

    const remaining = Math.max(0, Number(plan.plannedQty) - Number(plan.totalReceivedQty));
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#666')
      .text('REMAINING', LM + qtyColW * 2 + cellPad, y + cellPad, { width: qtyColW - cellPad * 2, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1565c0')
      .text(String(remaining), LM + qtyColW * 2 + cellPad, y + 14, { width: qtyColW - cellPad * 2, align: 'center' });

    y += rowH * 2 + 16;

    if (plan.remarks) {
      drawCell(LM, y, labelW, rowH, 'Remarks', true, lightBlue);
      drawCell(LM + labelW, y, pageW - labelW, rowH, plan.remarks);
    }
  }

  private formatDate(d?: Date | string): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
