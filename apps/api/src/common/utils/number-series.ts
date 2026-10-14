import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NumberSeries } from '../../modules/admin/entities/number-series.entity';

@Injectable()
export class NumberSeriesService {
  constructor(
    @InjectRepository(NumberSeries)
    private seriesRepo: Repository<NumberSeries>,
    private dataSource: DataSource,
  ) {}

  /**
   * Generate a unique number using pessimistic locking to prevent race conditions.
   * Uses SELECT ... FOR UPDATE to lock the row during transaction.
   */
  async generateNumber(moduleName: string, companyId?: string): Promise<string> {
    const whereClause: any = { moduleName, isActive: true };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Use transaction with pessimistic locking to prevent race conditions
    return this.dataSource.transaction(async (manager) => {
      // Lock the row for update to prevent concurrent access
      const series = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!series) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${moduleName}-${year}-${random}`;
      }

      const currentYear = new Date().getFullYear();
      const prefix = series.prefix || moduleName;
      const userCode = series.userCode || '';
      const padding = series.padding || 4;

      let newNumber: string;
      const currentNum = series.currentNumber || 0;

      if (currentNum === 0) {
        newNumber = '1'.padStart(padding, '0');
      } else {
        newNumber = (currentNum + 1).toString().padStart(padding, '0');
      }

      // Update within transaction
      series.currentNumber = parseInt(newNumber);
      await manager.save(series);

      if (userCode) {
        return `${prefix}-${userCode}-${currentYear}-${newNumber}`;
      }
      return `${prefix}-${currentYear}-${newNumber}`;
    });
  }

  /**
   * Generate SKU with pessimistic locking
   * Format: {CATEGORY}-{SEGMENT}-{GROUP}-{NUMBER}
   * Example: BR-STD-SAU-000001
   */
  async generateSku(
    brandName: string,
    locationName: string,
    productName: string,
    unitSize: string,
    packingSize?: string,
  ): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      // Find the SKU series by prefix
      const skuSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.prefix = :prefix', { prefix: 'SKU' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      let seqNumber = '';
      if (skuSeries) {
        const padding = skuSeries.padding || 6;
        const currentNum = skuSeries.currentNumber || 0;
        const newNumber = (currentNum + 1).toString().padStart(padding, '0');
        skuSeries.currentNumber = parseInt(newNumber);
        await manager.save(skuSeries);
        seqNumber = newNumber;
      } else {
        seqNumber = Math.floor(1000 + Math.random() * 9000).toString();
      }

      // Brand logic: Pvt Label / Pvt label -> PVT
      let brandPart = (brandName || '').trim().toUpperCase();
      if (brandPart.startsWith('PVT')) {
        brandPart = 'PVT';
      } else {
        brandPart = brandPart.replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-');
      }
      if (!brandPart) brandPart = 'GEN';

      // Location logic: Delhi -> D
      const locPart = (locationName || '').trim().toUpperCase().substring(0, 1);

      // Product description cleaning
      let descPart = (productName || '').trim().toUpperCase();
      descPart = descPart.replace(/\s+/g, '-');
      descPart = descPart.replace(/X/g, '-X-');
      descPart = descPart.replace(/[^A-Z0-9\-*]/g, ''); // keep alphanumeric, dash, asterisk
      descPart = descPart.replace(/-+/g, '-');
      descPart = descPart.replace(/^-|-$/g, '');

      // Unit size cleaning
      let unitPart = (unitSize || '').trim().toUpperCase();
      unitPart = unitPart.replace(/[^A-Z0-9\-]/g, '');

      // Construct parts array
      const parts = ['KOI', brandPart];
      if (locPart) parts.push(locPart);
      if (descPart) parts.push(descPart);
      if (unitPart) parts.push(unitPart);
      if (packingSize && parseInt(packingSize)) {
        parts.push('*');
        parts.push(packingSize.trim());
      }
      parts.push('D' + seqNumber);

      return parts.filter(Boolean).join('-');
    });
  }

  /**
   * Generate buyer code with pessimistic locking
   */
  async generateBuyerCode(): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const buyerSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName: 'customer' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!buyerSeries) {
        const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
        return `BUY-${random}`;
      }

      const padding = buyerSeries.padding || 6;
      const currentNum = buyerSeries.currentNumber || 0;
      const newNumber = (currentNum + 1).toString().padStart(padding, '0');

      buyerSeries.currentNumber = parseInt(newNumber);
      await manager.save(buyerSeries);

      return `BUY-${newNumber}`;
    });
  }

  /**
   * Generate vendor code with pessimistic locking
   */
  async generateVendorCode(): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const vendorSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName: 'vendor' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!vendorSeries) {
        const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
        return `VND-${random}`;
      }

      const padding = vendorSeries.padding || 6;
      const currentNum = vendorSeries.currentNumber || 0;
      const newNumber = (currentNum + 1).toString().padStart(padding, '0');

      vendorSeries.currentNumber = parseInt(newNumber);
      await manager.save(vendorSeries);

      return `VND-${newNumber}`;
    });
  }

  /**
   * Generate enquiry number with pessimistic locking
   */
  async generateEnquiryNumber(userCode: string): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      // Dynamic import to prevent circular dependency issues
      const { SalesEnquiryOrder } = await import('../../modules/sales/entities/sales-enquiry.entity');

      const prefix = `ENQ-${userCode}-`;
      
      // Find the last enquiry with this prefix
      const lastEnquiry = await manager
        .getRepository(SalesEnquiryOrder)
        .createQueryBuilder('enquiry')
        .where('enquiry.enquiryOrderNo LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('enquiry.createdAt', 'DESC')
        .getOne();

      let nextNum = 1;
      if (lastEnquiry) {
        const parts = lastEnquiry.enquiryOrderNo.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }

      return `${prefix}${nextNum}`;
    });
  }

  /**
   * Generate purchase quote number with pessimistic locking
   */
  async generatePurchaseQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();

    return this.dataSource.transaction(async (manager) => {
      const quoteSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName: 'purchase_quote' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!quoteSeries) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PUR-${year}-${random}`;
      }

      const padding = quoteSeries.padding || 4;
      const currentNum = quoteSeries.currentNumber || 0;
      const newNumber = (currentNum + 1).toString().padStart(padding, '0');

      quoteSeries.currentNumber = parseInt(newNumber);
      await manager.save(quoteSeries);

      return `PUR-${year}-${newNumber}`;
    });
  }

  /**
   * Generate price analysis number with pessimistic locking
   */
  async generatePriceAnalysisNumber(): Promise<string> {
    const year = new Date().getFullYear();

    return this.dataSource.transaction(async (manager) => {
      const paSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName: 'price_analysis' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!paSeries) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `PA-${year}-${random}`;
      }

      const padding = paSeries.padding || 4;
      const currentNum = paSeries.currentNumber || 0;
      const newNumber = (currentNum + 1).toString().padStart(padding, '0');

      paSeries.currentNumber = parseInt(newNumber);
      await manager.save(paSeries);

      return `PA-${year}-${newNumber}`;
    });
  }

  /**
   * Generate label code with pessimistic locking
   */
  async generateLabelCode(): Promise<string> {
    const year = new Date().getFullYear();

    return this.dataSource.transaction(async (manager) => {
      const labelSeries = await manager
        .createQueryBuilder(NumberSeries, 'series')
        .setLock('pessimistic_write')
        .where('series.moduleName = :moduleName', { moduleName: 'label_artwork' })
        .andWhere('series.isActive = :isActive', { isActive: true })
        .getOne();

      if (!labelSeries) {
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `LBL-${year}-${random}`;
      }

      const padding = labelSeries.padding || 4;
      const currentNum = labelSeries.currentNumber || 0;
      const newNumber = (currentNum + 1).toString().padStart(padding, '0');

      labelSeries.currentNumber = parseInt(newNumber);
      await manager.save(labelSeries);

      return `LBL-${year}-${newNumber}`;
    });
  }
}
