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
