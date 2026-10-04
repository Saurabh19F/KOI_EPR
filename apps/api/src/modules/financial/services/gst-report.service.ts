import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesInvoice } from '../../sales-order/entities/sales-order.entity';
import { PurchaseInvoice } from '../../purchase-order/entities/purchase-order.entity';

export interface GstSummary {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
  invoiceCount: number;
}

export interface GstReportByRate {
  rate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
  count: number;
}

export interface Gstr1Summary {
  totalInvoiceCount: number;
  totalTaxableValue: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalInvoiceValue: number;
  byRate: GstReportByRate[];
  byPlaceOfSupply: Record<string, GstSummary>;
  exports: GstSummary;
  nilRated: GstSummary;
  exempted: GstSummary;
  byInvoice: any[];
}

export interface Gstr3bSummary {
  totalTaxableValue: number;
  totalIntegratedTax: number;
  totalCentralTax: number;
  totalStateTax: number;
  totalCess: number;
  totalInterest: number;
  totalLiability: number;
  itcAvailable: {
    centralTax: number;
    stateTax: number;
    integratedTax: number;
    cess: number;
    total: number;
  };
  itcRevesed: {
    centralTax: number;
    stateTax: number;
    integratedTax: number;
    cess: number;
    total: number;
  };
  netTaxLiability: number;
}

@Injectable()
export class GstReportService {
  constructor(
    @InjectRepository(SalesInvoice)
    private salesInvoiceRepo: Repository<SalesInvoice>,
    @InjectRepository(PurchaseInvoice)
    private purchaseInvoiceRepo: Repository<PurchaseInvoice>,
  ) {}

  async getGstr1Report(fromDate: Date, toDate: Date, companyId?: string): Promise<Gstr1Summary> {
    const where: any = {
      isActive: true,
      invoiceDate: Between(fromDate, toDate),
    };

    // Get all sales invoices for the period
    const invoices = await this.salesInvoiceRepo.find({
      where,
      order: { invoiceDate: 'ASC' },
    });

    // Calculate totals
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let totalInvoiceValue = 0;
    let nilRatedValue = 0;
    let exemptedValue = 0;
    let exportValue = 0;

    const byRate: Record<number, GstReportByRate> = {};
    const byPlaceOfSupply: Record<string, GstSummary> = {};

    for (const invoice of invoices) {
      const taxableAmount = Number(invoice.subtotal) - Number(invoice.discountAmount || 0);
      const cgst = Number(invoice.cgstAmount || 0);
      const sgst = Number(invoice.sgstAmount || 0);
      const igst = Number(invoice.igstAmount || 0);
      const cess = Number(invoice.cessAmount || 0);
      const total = Number(invoice.totalAmount || 0);

      totalTaxableValue += taxableAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;
      totalInvoiceValue += total;

      // Group by rate (extract from CGST which is half of GST rate)
      const rate = cgst > 0 && taxableAmount > 0 ? (cgst / taxableAmount) * 200 : 0;
      const roundedRate = Math.round(rate * 10) / 10;

      if (roundedRate > 0) {
        if (!byRate[roundedRate]) {
          byRate[roundedRate] = {
            rate: roundedRate,
            taxableAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            cessAmount: 0,
            totalTax: 0,
            totalAmount: 0,
            count: 0,
          };
        }
        byRate[roundedRate].taxableAmount += taxableAmount;
        byRate[roundedRate].cgstAmount += cgst;
        byRate[roundedRate].sgstAmount += sgst;
        byRate[roundedRate].igstAmount += igst;
        byRate[roundedRate].cessAmount += cess;
        byRate[roundedRate].totalTax += cgst + sgst + igst + cess;
        byRate[roundedRate].totalAmount += total;
        byRate[roundedRate].count++;
      }

      // Group by state (place of supply)
      const state = invoice.billingStateCode || 'UNKNOWN';
      if (!byPlaceOfSupply[state]) {
        byPlaceOfSupply[state] = {
          taxableAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0,
          totalTax: 0,
          totalAmount: 0,
          invoiceCount: 0,
        };
      }
      byPlaceOfSupply[state].taxableAmount += taxableAmount;
      byPlaceOfSupply[state].cgstAmount += cgst;
      byPlaceOfSupply[state].sgstAmount += sgst;
      byPlaceOfSupply[state].igstAmount += igst;
      byPlaceOfSupply[state].cessAmount += cess;
      byPlaceOfSupply[state].totalTax += cgst + sgst + igst + cess;
      byPlaceOfSupply[state].totalAmount += total;
      byPlaceOfSupply[state].invoiceCount++;
    }

    return {
      totalInvoiceCount: invoices.length,
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalCess: Math.round(totalCess * 100) / 100,
      totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100,
      byRate: Object.values(byRate).sort((a, b) => b.rate - a.rate),
      byPlaceOfSupply,
      exports: {
        taxableAmount: exportValue,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
        totalTax: 0,
        totalAmount: exportValue,
        invoiceCount: 0,
      },
      nilRated: {
        taxableAmount: nilRatedValue,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
        totalTax: 0,
        totalAmount: nilRatedValue,
        invoiceCount: 0,
      },
      exempted: {
        taxableAmount: exemptedValue,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        cessAmount: 0,
        totalTax: 0,
        totalAmount: exemptedValue,
        invoiceCount: 0,
      },
      byInvoice: invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        customerName: inv.customerName,
        gstin: inv.customerGstin,
        billingStateCode: inv.billingStateCode,
        taxableAmount: Number(inv.subtotal) - Number(inv.discountAmount || 0),
        cgst: Number(inv.cgstAmount || 0),
        sgst: Number(inv.sgstAmount || 0),
        igst: Number(inv.igstAmount || 0),
        cess: Number(inv.cessAmount || 0),
        totalAmount: Number(inv.totalAmount || 0),
        eInvoiceNumber: inv.eInvoiceNumber,
        eInvoiceDate: inv.eInvoiceDate,
        status: inv.status,
      })),
    };
  }

  async getGstr3bSummary(fromDate: Date, toDate: Date, companyId?: string): Promise<Gstr3bSummary> {
    const where: any = {
      isActive: true,
      invoiceDate: Between(fromDate, toDate),
    };

    // Get sales invoices
    const salesInvoices = await this.salesInvoiceRepo.find({ where });

    // Get purchase invoices
    const purchaseInvoices = await this.purchaseInvoiceRepo.find({
      where: { isActive: true },
    });

    // Calculate outward supplies
    let totalTaxableValue = 0;
    let totalIntegratedTax = 0;
    let totalCentralTax = 0;
    let totalStateTax = 0;
    let totalCess = 0;

    for (const inv of salesInvoices) {
      const taxableAmount = Number(inv.subtotal) - Number(inv.discountAmount || 0);
      totalTaxableValue += taxableAmount;
      totalIntegratedTax += Number(inv.igstAmount || 0);
      totalCentralTax += Number(inv.cgstAmount || 0);
      totalStateTax += Number(inv.sgstAmount || 0);
      totalCess += Number(inv.cessAmount || 0);
    }

    // Calculate ITC from purchase invoices
    let itcCentralTax = 0;
    let itcStateTax = 0;
    let itcIntegratedTax = 0;
    let itcCess = 0;

    for (const inv of purchaseInvoices) {
      itcCentralTax += Number(inv.cgstAmount || 0);
      itcStateTax += Number(inv.sgstAmount || 0);
      itcIntegratedTax += Number(inv.igstAmount || 0);
      itcCess += Number(inv.cessAmount || 0);
    }

    const totalTaxLiability = totalIntegratedTax + totalCentralTax + totalStateTax + totalCess;
    const totalItc = itcIntegratedTax + itcCentralTax + itcStateTax + itcCess;

    return {
      totalTaxableValue: Math.round(totalTaxableValue * 100) / 100,
      totalIntegratedTax: Math.round(totalIntegratedTax * 100) / 100,
      totalCentralTax: Math.round(totalCentralTax * 100) / 100,
      totalStateTax: Math.round(totalStateTax * 100) / 100,
      totalCess: Math.round(totalCess * 100) / 100,
      totalInterest: 0,
      totalLiability: Math.round(totalTaxLiability * 100) / 100,
      itcAvailable: {
        centralTax: Math.round(itcCentralTax * 100) / 100,
        stateTax: Math.round(itcStateTax * 100) / 100,
        integratedTax: Math.round(itcIntegratedTax * 100) / 100,
        cess: Math.round(itcCess * 100) / 100,
        total: Math.round(totalItc * 100) / 100,
      },
      itcRevesed: {
        centralTax: 0,
        stateTax: 0,
        integratedTax: 0,
        cess: 0,
        total: 0,
      },
      netTaxLiability: Math.round((totalTaxLiability - Math.min(totalItc, totalTaxLiability)) * 100) / 100,
    };
  }

  async getGstSummary(fromDate: Date, toDate: Date, companyId?: string): Promise<{
    sales: GstSummary;
    purchases: GstSummary;
    netLiability: number;
  }> {
    const salesInvoices = await this.salesInvoiceRepo.find({
      where: { isActive: true, invoiceDate: Between(fromDate, toDate) },
    });

    const purchaseInvoices = await this.purchaseInvoiceRepo.find({
      where: { isActive: true },
    });

    const salesSummary = this.calculateGstSummary(salesInvoices);
    const purchaseSummary = this.calculateGstSummary(purchaseInvoices);

    const netLiability = (salesSummary.totalTax + salesSummary.igstAmount) -
      (purchaseSummary.totalTax + purchaseSummary.igstAmount);

    return {
      sales: salesSummary,
      purchases: purchaseSummary,
      netLiability: Math.round(netLiability * 100) / 100,
    };
  }

  private calculateGstSummary(invoices: any[]): GstSummary {
    let taxableAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let cessAmount = 0;
    let totalAmount = 0;

    for (const inv of invoices) {
      taxableAmount += Number(inv.subtotal) - Number(inv.discountAmount || 0);
      cgstAmount += Number(inv.cgstAmount || 0);
      sgstAmount += Number(inv.sgstAmount || 0);
      igstAmount += Number(inv.igstAmount || 0);
      cessAmount += Number(inv.cessAmount || 0);
      totalAmount += Number(inv.totalAmount || 0);
    }

    return {
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      cessAmount: Math.round(cessAmount * 100) / 100,
      totalTax: Math.round((cgstAmount + sgstAmount + igstAmount + cessAmount) * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      invoiceCount: invoices.length,
    };
  }

  async getGstLiabilityReport(fromDate: Date, toDate: Date, companyId?: string): Promise<any> {
    const summary = await this.getGstSummary(fromDate, toDate);

    // Monthly breakdown
    const monthlyData = await this.getMonthlyGstBreakdown(fromDate, toDate);

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      summary: {
        totalOutputTax: summary.sales.totalTax,
        totalInputTax: summary.purchases.totalTax,
        netTaxLiability: summary.netLiability,
        taxPayable: Math.max(0, summary.netLiability),
        taxCredit: Math.max(0, -summary.netLiability),
      },
      byGstComponent: {
        cgst: {
          output: summary.sales.cgstAmount,
          input: summary.purchases.cgstAmount,
          liability: summary.sales.cgstAmount - summary.purchases.cgstAmount,
        },
        sgst: {
          output: summary.sales.sgstAmount,
          input: summary.purchases.sgstAmount,
          liability: summary.sales.sgstAmount - summary.purchases.sgstAmount,
        },
        igst: {
          output: summary.sales.igstAmount,
          input: summary.purchases.igstAmount,
          liability: summary.sales.igstAmount - summary.purchases.igstAmount,
        },
        cess: {
          output: summary.sales.cessAmount,
          input: summary.purchases.cessAmount,
          liability: summary.sales.cessAmount - summary.purchases.cessAmount,
        },
      },
      monthlyBreakdown: monthlyData,
    };
  }

  private async getMonthlyGstBreakdown(fromDate: Date, toDate: Date): Promise<any[]> {
    const salesInvoices = await this.salesInvoiceRepo.find({
      where: { isActive: true, invoiceDate: Between(fromDate, toDate) },
      order: { invoiceDate: 'ASC' },
    });

    const monthlyMap: Record<string, any> = {};

    for (const invoice of salesInvoices) {
      const monthKey = new Date(invoice.invoiceDate).toISOString().slice(0, 7);
      const taxableAmount = Number(invoice.subtotal) - Number(invoice.discountAmount || 0);

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          invoiceCount: 0,
          taxableAmount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
          totalTax: 0,
          totalAmount: 0,
        };
      }

      monthlyMap[monthKey].invoiceCount++;
      monthlyMap[monthKey].taxableAmount += taxableAmount;
      monthlyMap[monthKey].cgst += Number(invoice.cgstAmount || 0);
      monthlyMap[monthKey].sgst += Number(invoice.sgstAmount || 0);
      monthlyMap[monthKey].igst += Number(invoice.igstAmount || 0);
      monthlyMap[monthKey].cess += Number(invoice.cessAmount || 0);
      monthlyMap[monthKey].totalTax += Number(invoice.cgstAmount || 0) +
        Number(invoice.sgstAmount || 0) +
        Number(invoice.igstAmount || 0) +
        Number(invoice.cessAmount || 0);
      monthlyMap[monthKey].totalAmount += Number(invoice.totalAmount || 0);
    }

    return Object.values(monthlyMap).map((m: any) => ({
      ...m,
      taxableAmount: Math.round(m.taxableAmount * 100) / 100,
      cgst: Math.round(m.cgst * 100) / 100,
      sgst: Math.round(m.sgst * 100) / 100,
      igst: Math.round(m.igst * 100) / 100,
      cess: Math.round(m.cess * 100) / 100,
      totalTax: Math.round(m.totalTax * 100) / 100,
      totalAmount: Math.round(m.totalAmount * 100) / 100,
    }));
  }
}
