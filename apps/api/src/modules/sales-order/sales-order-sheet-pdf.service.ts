import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SalesOrder, SalesOrderItem } from './entities/sales-order.entity';

@Injectable()
export class SalesOrderSheetPdfService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepo: Repository<SalesOrderItem>,
  ) {}

  async generateSheetExcel(
    orderId: string,
    companyId?: string,
    withRate = true,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const where: FindOptionsWhere<SalesOrder> = { orderId };
    if (companyId) where.companyId = companyId;

    const order = await this.salesOrderRepo.findOne({ where });
    if (!order) throw new NotFoundException(`Sales order not found: ${orderId}`);

    const items = await this.salesOrderItemRepo.find({
      where: { orderId, isActive: true },
      order: { lineNumber: 'ASC' },
    });

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Order');

    const headers = withRate ? this.getWithRateHeaders() : this.getWithoutRateHeaders();
    const colCount = headers.length;

    // ===== COMPANY HEADER =====
    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = 'Krishna Overseas Inc';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ===== ORDER TITLE =====
    sheet.mergeCells(2, 1, 2, colCount);
    const containerInfo = order.containerSize ? ` (${order.containerSize})` : '';
    const dateStr = order.orderDate
      ? `(${new Date(order.orderDate).toLocaleString('en-US', { month: 'long' })}-${new Date(order.orderDate).getFullYear()})`
      : '';
    const subtitleCell = sheet.getCell(2, 1);
    subtitleCell.value = `${order.orderNumber} ${dateStr}${containerInfo}`;
    subtitleCell.font = { size: 14, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // ===== COLUMN HEADERS =====
    const headerRow = sheet.getRow(3);
    const darkGreen = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2D4A2E' } };
    const yellowBg = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFF00' } };
    const redBg = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFF0000' } };
    const thinBorder = {
      top: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      left: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };

    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h.label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.fill = darkGreen;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
      sheet.getColumn(i + 1).width = h.width;
    });

    // Highlight CBM headers (yellow and red like in the Google Sheet)
    if (withRate) {
      const cbmPerIdx = headers.findIndex(h => h.key === 'cbmPerCarton');
      const totalCbmIdx = headers.findIndex(h => h.key === 'totalCbm');
      if (cbmPerIdx >= 0) {
        const cell = headerRow.getCell(cbmPerIdx + 1);
        cell.fill = yellowBg;
        cell.font = { bold: true, size: 9 };
      }
      if (totalCbmIdx >= 0) {
        const cell = headerRow.getCell(totalCbmIdx + 1);
        cell.fill = redBg;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      }
    }

    headerRow.height = 40;

    // ===== DATA ROWS =====
    let totalBoxes = 0;
    let totalKg = 0;
    let totalPackets = 0;
    let totalNetAmount = 0;
    let totalCbm = 0;
    let totalRatePerBox = 0;

    items.forEach((item, i) => {
      const rowNum = 4 + i;
      const boxes = Number(item.quantity || 0);
      const packetsPerCarton = Number(item.unitsPerCase || 0);
      const totalKgItem = Number(item.weight || 0);
      const totalPacketsItem = boxes * (packetsPerCarton || 1);
      const ratePerBox = Number(item.unitPrice || 0);
      const netAmount = Number(item.totalAmount || 0);
      const cbmPerBox = Number(item.cbmPerBox || 0);
      const totalCbmItem = cbmPerBox * boxes;

      totalBoxes += boxes;
      totalKg += totalKgItem;
      totalPackets += totalPacketsItem;
      totalNetAmount += netAmount;
      totalCbm += totalCbmItem;
      totalRatePerBox += ratePerBox;

      const vals = withRate
        ? this.getWithRateRow(item, boxes, packetsPerCarton, totalKgItem, totalPacketsItem, ratePerBox, netAmount, cbmPerBox, totalCbmItem)
        : this.getWithoutRateRow(item, boxes, packetsPerCarton, totalKgItem, totalPacketsItem, cbmPerBox, totalCbmItem);

      const row = sheet.getRow(rowNum);
      vals.forEach((v, j) => {
        const cell = row.getCell(j + 1);
        cell.value = v;
        cell.font = { size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });
      // Left-align item name
      row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    });

    // ===== TOTALS ROW =====
    const totalsRowNum = 4 + items.length;
    const totalsRow = sheet.getRow(totalsRowNum);
    const grayBg = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFD9D9D9' } };

    const totalsData = withRate
      ? this.getWithRateTotals(headers.length, totalBoxes, totalKg, totalPackets, totalRatePerBox, totalNetAmount, totalCbm)
      : this.getWithoutRateTotals(headers.length, totalBoxes, totalKg, totalPackets, totalCbm);

    totalsData.forEach((v, j) => {
      const cell = totalsRow.getCell(j + 1);
      cell.value = v;
      cell.font = { bold: true, size: 9 };
      cell.fill = grayBg;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    // ===== FOOTER: Gross Wt, PI No, Req CBM =====
    const footerStart = totalsRowNum + 1;

    sheet.mergeCells(footerStart, 1, footerStart, 2);
    sheet.getCell(footerStart, 1).value = 'Gross wt.';
    sheet.getCell(footerStart, 1).font = { bold: true, size: 10 };
    sheet.getCell(footerStart, 3).value = Number(order.grossWeight || 0);
    sheet.getCell(footerStart, 3).font = { bold: true, size: 10 };

    if (order.piNumber) {
      const piCol = withRate ? 12 : 10;
      sheet.getCell(footerStart, piCol).value = 'PI No.\nAnd date';
      sheet.getCell(footerStart, piCol).font = { bold: true, size: 9 };
      sheet.getCell(footerStart, piCol).alignment = { wrapText: true };
    }

    sheet.mergeCells(footerStart + 1, 1, footerStart + 1, 2);
    sheet.getCell(footerStart + 1, 1).value = 'Req. CBM';
    sheet.getCell(footerStart + 1, 1).font = { bold: true, size: 10 };

    // Put total CBM value in the Total CBM column
    if (withRate) {
      const totalCbmIdx = headers.findIndex(h => h.key === 'totalCbm');
      if (totalCbmIdx >= 0) {
        sheet.getCell(footerStart + 1, totalCbmIdx + 1).value = Math.round(totalCbm);
        sheet.getCell(footerStart + 1, totalCbmIdx + 1).font = { bold: true, size: 10 };
      }
    } else {
      const totalCbmIdx = headers.findIndex(h => h.key === 'totalCbm');
      if (totalCbmIdx >= 0) {
        sheet.getCell(footerStart + 1, totalCbmIdx + 1).value = Math.round(totalCbm);
        sheet.getCell(footerStart + 1, totalCbmIdx + 1).font = { bold: true, size: 10 };
      }
    }

    const label = withRate ? 'WithRate' : 'WithoutRate';
    const filename = `SalesOrder-${label}-${order.orderNumber}.xlsx`;
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return { buffer, filename };
  }

  private getWithRateHeaders() {
    return [
      { key: 'item', label: 'Item', width: 25 },
      { key: 'packing', label: 'Packing', width: 12 },
      { key: 'packingSize', label: 'Packing Size', width: 10 },
      { key: 'packetsPerCarton', label: 'No of Packets per carton', width: 10 },
      { key: 'boxes', label: 'NO OF BOXES ?', width: 10 },
      { key: 'totalKg', label: 'Total KG', width: 10 },
      { key: 'totalPackets', label: 'Total no of packets', width: 10 },
      { key: 'ratePerBox', label: 'Rate Per Box USD FOB', width: 12 },
      { key: 'netAmount', label: 'Net Amount USD FOB', width: 14 },
      { key: 'cbmPerCarton', label: 'CBM per carton LxWxH CBM', width: 12 },
      { key: 'totalCbm', label: 'Total CBM Total CBM', width: 10 },
      { key: 'packingType', label: 'Packing', width: 12 },
      { key: 'purchasePerson', label: 'Purchase Person Name', width: 14 },
      { key: 'remarks', label: 'Remarks', width: 14 },
      { key: 'itemSelection', label: 'Item Selection', width: 10 },
      { key: 'importedBy', label: 'Imported By', width: 12 },
    ];
  }

  private getWithoutRateHeaders() {
    return [
      { key: 'item', label: 'Item', width: 22 },
      { key: 'packing', label: 'Packing', width: 12 },
      { key: 'packingSize', label: 'Packing Size', width: 10 },
      { key: 'packetsPerCarton', label: 'No of Packets per carton', width: 10 },
      { key: 'boxes', label: 'NO OF BOXES ?', width: 10 },
      { key: 'totalKg', label: 'Total KG', width: 10 },
      { key: 'totalPackets', label: 'Total no of packets', width: 10 },
      { key: 'cbmPerCarton', label: 'CBM per carton', width: 11 },
      { key: 'totalCbm', label: 'Total CBM', width: 10 },
      { key: 'packingType', label: 'Packing', width: 11 },
      { key: 'purchasePerson', label: 'Purchase Person Name', width: 13 },
      { key: 'remarks', label: 'Remarks', width: 10 },
      { key: 'itemSelection', label: 'Item Selection', width: 9 },
      { key: 'importedBy', label: 'Imported By', width: 9 },
      { key: 'poi', label: 'Poi', width: 7 },
      { key: 'nutrition', label: 'Nutrition', width: 9 },
      { key: 'ingredients', label: 'Ingredients', width: 9 },
      { key: 'barcode', label: 'Barcode', width: 9 },
      { key: 'batchNumber', label: 'Batch Number', width: 9 },
      { key: 'shelfLife', label: 'Shelf Life', width: 9 },
      { key: 'mfg', label: 'Mfg', width: 7 },
      { key: 'allergenAdvice', label: 'Allergen Advice', width: 10 },
      { key: 'ntWt', label: 'Nt Wt', width: 8 },
      { key: 'status', label: 'Status', width: 9 },
    ];
  }

  private getWithRateRow(
    item: SalesOrderItem, boxes: number, packetsPerCarton: number,
    totalKg: number, totalPackets: number, ratePerBox: number,
    netAmount: number, cbmPerBox: number, totalCbm: number,
  ): any[] {
    return [
      item.productName || '',
      item.packingType || '',
      item.unitSize || '',
      packetsPerCarton || '',
      boxes,
      totalKg || '',
      totalPackets,
      ratePerBox ? `$${ratePerBox.toFixed(2)}` : '',
      netAmount ? `$${netAmount.toFixed(2)}` : '',
      cbmPerBox ? cbmPerBox.toFixed(3) : '',
      totalCbm ? totalCbm.toFixed(1) : '',
      item.packingType || '',
      item.purchasePersonName || '',
      item.remarks || '',
      item.itemSelected ? 'Yes' : '',
      item.importedBy || '',
    ];
  }

  private getWithoutRateRow(
    item: SalesOrderItem, boxes: number, packetsPerCarton: number,
    totalKg: number, totalPackets: number, cbmPerBox: number, totalCbm: number,
  ): any[] {
    const yesNo = (v: any) => (v && v !== '' && v !== 'null' && v !== 'undefined') ? 'Yes' : '';
    return [
      item.productName || '',
      item.packingType || '',
      item.unitSize || '',
      packetsPerCarton || '',
      boxes,
      totalKg || '',
      totalPackets,
      cbmPerBox ? cbmPerBox.toFixed(3) : '',
      totalCbm ? totalCbm.toFixed(1) : '',
      item.packingType || '',
      item.purchasePersonName || '',
      item.remarks || '',
      item.itemSelected ? 'Yes' : '',
      item.importedBy || '',
      yesNo(item.poi),
      yesNo(item.nutrition),
      yesNo(item.ingredients),
      yesNo(item.barcode),
      yesNo(item.batchNumber),
      item.shelfLifeMonths ? `${item.shelfLifeMonths}m` : '',
      yesNo(item.mfgDate),
      yesNo(item.allergenAdvice),
      item.netWeight || '',
      item.itemStatus || '',
    ];
  }

  private getWithRateTotals(colCount: number, totalBoxes: number, totalKg: number, totalPackets: number, totalRate: number, totalNetAmount: number, totalCbm: number): any[] {
    const vals: any[] = new Array(colCount).fill('');
    vals[1] = 'TOTAL';
    vals[4] = totalBoxes;
    vals[5] = Math.round(totalKg);
    vals[6] = totalPackets;
    vals[7] = totalRate.toFixed(2);
    vals[8] = totalNetAmount.toFixed(2);
    vals[10] = totalCbm.toFixed(1);
    return vals;
  }

  private getWithoutRateTotals(colCount: number, totalBoxes: number, totalKg: number, totalPackets: number, totalCbm: number): any[] {
    const vals: any[] = new Array(colCount).fill('');
    vals[1] = 'TOTAL';
    vals[4] = totalBoxes;
    vals[5] = Math.round(totalKg);
    vals[6] = totalPackets;
    vals[8] = totalCbm.toFixed(1);
    return vals;
  }
}
