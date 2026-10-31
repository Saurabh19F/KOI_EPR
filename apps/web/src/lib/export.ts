// Export utilities for generating PDF and Excel files

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  return `${symbols[currency] || ''} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Generate PDF for Sales Enquiry
export const generateEnquiryPDF = (data: any): jsPDF => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102);
  doc.text('SALES ENQUIRY', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Enquiry No: ${data.enquiryOrderNo}`, 20, 35);
  doc.text(`Date: ${formatDate(data.enquiryDate)}`, 20, 42);

  // Buyer Details
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Buyer Details', 20, 55);

  doc.setFontSize(10);
  doc.text(`Buyer Code: ${data.buyerCode || '-'}`, 20, 65);
  doc.text(`Company: ${data.buyerName || '-'}`, 20, 72);
  doc.text(`Contact: ${data.contactName || '-'} (${data.contactNumber || '-'})`, 20, 79);
  doc.text(`Email: ${data.buyerEmail || '-'}`, 20, 86);
  doc.text(`Location: ${data.city || '-'}, ${data.country || '-'}`, 20, 93);

  // PO Details
  doc.setFontSize(12);
  doc.text('PO / Order Details', 120, 55);
  doc.setFontSize(10);
  doc.text(`PO Number: ${data.poNumber || '-'}`, 120, 65);
  doc.text(`PO Date: ${data.poDate ? formatDate(data.poDate) : '-'}`, 120, 72);
  doc.text(`POD: ${data.pod || '-'}`, 120, 79);
  doc.text(`Cube Size: ${data.cubeSize || '-'}`, 120, 86);

  // Items Table
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.text('Product Items', 20, 110);

    const tableData = data.items.map((item: any, index: number) => [
      index + 1,
      item.sku || '-',
      item.productName || '-',
      item.categoryName || '-',
      item.brandName || '-',
      item.unitSize || '-',
      item.quantity || 0,
      item.totalCbm !== null && item.totalCbm !== undefined ? Number(item.totalCbm).toFixed(4) : '-',
    ]);

    autoTable(doc, {
      startY: 115,
      head: [['#', 'SKU', 'Product', 'Category', 'Brand', 'Unit', 'Qty', 'CBM']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 8 },
    });
  }

  // Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(10);
  doc.text(`Total CBM: ${data.totalCbm !== null && data.totalCbm !== undefined ? Number(data.totalCbm).toFixed(4) : '-'}`, 20, finalY + 15);
  doc.text(`Total Value: ${formatCurrency(data.totalValue || 0)}`, 20, finalY + 22);

  // Remarks
  if (data.remarks) {
    doc.text(`Remarks: ${data.remarks}`, 20, finalY + 35);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Generated on: ' + new Date().toLocaleString(), 20, 285);
  doc.text('ERP System - Confidential', doc.internal.pageSize.width - 60, 285);

  return doc;
};

// Generate PDF for Purchase Quote
export const generatePurchaseQuotePDF = (data: any): jsPDF => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 51);
  doc.text('PURCHASE QUOTE REQUEST', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Quote No: ${data.quoteNo}`, 20, 35);
  doc.text(`Date: ${formatDate(data.quoteDate)}`, 20, 42);
  doc.text(`Enquiry Ref: ${data.salesEnquiryOrderNo || '-'}`, 20, 49);

  // Party Details
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Party / Vendor Details', 20, 60);

  doc.setFontSize(10);
  doc.text(`Party Code: ${data.partyCode || '-'}`, 20, 70);
  doc.text(`Company: ${data.partyName || '-'}`, 20, 77);
  doc.text(`Contact: ${data.contactName || '-'}`, 20, 84);
  doc.text(`Email: ${data.emailAddress || '-'}`, 20, 91);
  doc.text(`Location: ${data.city || '-'}, ${data.country || '-'}`, 20, 98);

  // Commercial Details
  doc.setFontSize(12);
  doc.text('Commercial Details', 120, 60);
  doc.setFontSize(10);
  doc.text(`POD: ${data.pod || '-'}`, 120, 70);
  doc.text(`Shipment: ${data.shipmentDetails || '-'}`, 120, 77);
  doc.text(`Transporter: ${data.transporterDetails || '-'}`, 120, 84);

  // Items Table
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.text('Items with Vendor Quotes', 20, 115);

    const tableData = data.items.map((item: any, index: number) => [
      index + 1,
      item.sku || '-',
      item.productName || '-',
      item.vendorName || '-',
      item.buyingPrice || '-',
      item.landingCost !== null && item.landingCost !== undefined ? Number(item.landingCost).toFixed(2) : '-',
      item.bestLandingLocation || '-',
      item.leadTimeDays || '-',
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['#', 'SKU', 'Product', 'Vendor', 'Buying Price', 'Landing Cost', 'Best Location', 'Lead Days']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 102, 51] },
      styles: { fontSize: 8 },
    });
  }

  // Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Grand Total: ${formatCurrency(data.grandTotal || 0)}`, 20, finalY + 15);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Generated on: ' + new Date().toLocaleString(), 20, 285);
  doc.text('ERP System - Confidential', doc.internal.pageSize.width - 60, 285);

  return doc;
};

// Generate PDF for Price Analysis
export const generatePriceAnalysisPDF = (data: any): jsPDF => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(102, 0, 102);
  doc.text('PRICE ANALYSIS REPORT', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Analysis No: ${data.analysisNo}`, 20, 35);
  doc.text(`Date: ${formatDate(data.analysisDate)}`, 20, 42);
  doc.text(`Enquiry Ref: ${data.enquiryOrderNo || '-'}`, 20, 49);

  // Customer Details
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Customer Details', 20, 60);

  doc.setFontSize(10);
  doc.text(`Buyer Code: ${data.buyerCode || '-'}`, 20, 70);
  doc.text(`Company: ${data.customerName || '-'}`, 20, 77);
  doc.text(`Location: ${data.city || '-'}, ${data.country || '-'}`, 20, 84);

  // Currency Rates
  doc.setFontSize(12);
  doc.text('Currency Rates Applied', 120, 60);
  doc.setFontSize(10);
  doc.text(`GBP: ${data.gbpRate || '-'}`, 120, 70);
  doc.text(`USD: ${data.usdRate || '-'}`, 120, 77);
  doc.text(`EUR: ${data.euroRate || '-'}`, 120, 84);

  // Items Table
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.text('Rate Calculation Details', 20, 100);

    const tableData = data.items.map((item: any, index: number) => [
      index + 1,
      item.sku || '-',
      item.productName || '-',
      item.landingCost !== null && item.landingCost !== undefined ? Number(item.landingCost).toFixed(2) : '-',
      item.gstPercent || '-',
      item.selectedHaulageLocation || '-',
      item.finalSellingRate !== null && item.finalSellingRate !== undefined ? Number(item.finalSellingRate).toFixed(4) : '-',
      item.marginPercent !== null && item.marginPercent !== undefined ? Number(item.marginPercent).toFixed(2) : '-',
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['#', 'SKU', 'Product', 'Landing Cost', 'GST%', 'Haulage Loc', 'Final Rate', 'Margin%']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [102, 0, 102] },
      styles: { fontSize: 8 },
    });
  }

  // Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Summary', 20, finalY + 15);
  doc.setFontSize(10);
  doc.text(`Total Purchase Value: ${formatCurrency(data.totalPurchaseValue || 0)}`, 20, finalY + 25);
  doc.text(`Total Selling Value: ${formatCurrency(data.totalSellingValue || 0)}`, 20, finalY + 32);
  doc.text(`Total Margin: ${Number(data.totalMargin || 0).toFixed(2)}%`, 20, finalY + 39);
  doc.text(`Total CBM: ${Number(data.totalCbm || 0).toFixed(4)}`, 20, finalY + 46);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Generated on: ' + new Date().toLocaleString(), 20, 285);
  doc.text('ERP System - Confidential', doc.internal.pageSize.width - 60, 285);

  return doc;
};

// Export to Excel (using simple CSV format)
export const exportToExcel = (data: any[], filename: string, sheetName: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Download PDF
export const downloadPDF = (doc: jsPDF, filename: string): void => {
  doc.save(`${filename}.pdf`);
};

// Print PDF
export const printPDF = (doc: jsPDF): void => {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Generate Material Transfer Note PDF
export const generateTransferNotePDF = (transfer: any): void => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.width;
  const today = formatDate(new Date());

  // Header
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('INTERNAL LOGISTICS & STOCK TRANSFER', 14, 16);

  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('MATERIAL TRANSFER NOTE', 14, 26);

  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100);
  doc.text(`Request ID: ${transfer.transferNumber || '—'}  |  Date: ${transfer.createdAt ? formatDate(transfer.createdAt) : today}`, 14, 34);

  // KOI top-right
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('KOI', pw - 14, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(34, 139, 34);
  doc.text(`STATUS: ${(transfer.status || 'APPROVED').toUpperCase()}`, pw - 14, 28, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(14, 38, pw - 14, 38);

  // Two-column info boxes
  const boxY = 44;
  const boxH = 42;
  const halfW = (pw - 28 - 6) / 2;

  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.rect(14, boxY, halfW, boxH);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('ORDER & ROUTING DETAILS', 18, boxY + 8);
  doc.setDrawColor(255, 165, 0);
  doc.setLineWidth(1.5);
  doc.line(18, boxY + 10, 80, boxY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.setFontSize(9);
  doc.text('Order / Job Card:', 18, boxY + 18);
  doc.text('Requested By:', 18, boxY + 25);
  doc.text('Transfer Status:', 18, boxY + 32);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(transfer.orderNo || '—', 62, boxY + 18);
  doc.text(transfer.requestedByUsername || transfer.requesterName || '—', 62, boxY + 25);
  doc.setTextColor(34, 139, 34);
  doc.text((transfer.status || 'Approved').charAt(0).toUpperCase() + (transfer.status || 'approved').slice(1), 62, boxY + 32);

  // Warehouse Locations box
  const box2X = 14 + halfW + 6;
  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.rect(box2X, boxY, halfW, boxH);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 80, 160);
  doc.text('WAREHOUSE LOCATIONS', box2X + 4, boxY + 8);
  doc.setDrawColor(255, 165, 0);
  doc.setLineWidth(1.5);
  doc.line(box2X + 4, boxY + 10, box2X + 60, boxY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.setFontSize(9);
  doc.text('Source WH (From):', box2X + 4, boxY + 18);
  doc.text('Requesting WH (To):', box2X + 4, boxY + 25);
  doc.text('Transfer Type:', box2X + 4, boxY + 32);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 80, 0);
  doc.text(transfer.sourceWarehouseName || '—', box2X + 48, boxY + 18);
  doc.text(transfer.destinationWarehouseName || '—', box2X + 48, boxY + 25);
  doc.text('Internal WH Move', box2X + 48, boxY + 32);

  // Product table
  autoTable(doc, {
    startY: boxY + boxH + 8,
    head: [['PRODUCT CODE', 'PRODUCT DESCRIPTION', 'REQUESTED', 'DISPATCHED', 'RECEIVED']],
    body: [[
      transfer.sku || transfer.productId || '—',
      transfer.finalProductName || transfer.productName || '—',
      Number(transfer.totalQuantity || 0).toLocaleString(),
      Number(transfer.dispatchedQty || 0).toLocaleString(),
      Number(transfer.receivedQty || 0).toLocaleString(),
    ]],
    theme: 'grid',
    headStyles: { fillColor: [245, 245, 245], textColor: [60, 60, 60], fontStyle: 'bold', fontSize: 8, lineWidth: 0.3, lineColor: [180, 180, 180] },
    bodyStyles: { fontSize: 8, lineWidth: 0.3, lineColor: [200, 200, 200] },
    columnStyles: {
      0: { cellWidth: 45, font: 'courier', fontSize: 7 },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Signature area
  const sigY = (doc as any).lastAutoTable?.finalY + 20 || 170;
  doc.setDrawColor(0);
  doc.setLineWidth(1);
  doc.line(14, sigY, pw - 14, sigY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Authorized Requester:', 14, sigY + 10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(0);
  doc.text(transfer.requestedByUsername || transfer.requesterName || '—', 14, sigY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text('Source WH Sender', pw / 2, sigY + 10, { align: 'center' });
  doc.text('Target WH Receiver', pw - 14, sigY + 10, { align: 'right' });

  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(150);
  doc.text(`SYS-GEN-TRANSFER-${transfer.transferNumber || 'UNKNOWN'}`, pw / 2, sigY + 30, { align: 'center' });

  doc.save(`Transfer_Note_${transfer.transferNumber || 'UNKNOWN'}.pdf`);
};
