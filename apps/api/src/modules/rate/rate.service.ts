import { Injectable, NotFoundException, BadRequestException, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, IsNull, In } from 'typeorm';
import { PriceAnalysis, PriceAnalysisStatus } from './entities/price-analysis.entity';
import { PriceAnalysisItem, PriceAnalysisItemStatus } from './entities/price-analysis-item.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { HaulageRate } from './entities/haulage-master.entity';
import { FinalCurrencyRateMaster } from './entities/final-currency-rate-master.entity';
import { CreatePriceAnalysisDto, UpdatePriceAnalysisDto, UpdatePriceAnalysisItemDto } from '../../common/dto/create-rate.dto';
import { CreateHaulageRateDto, UpdateHaulageRateDto, CreateCurrencyRateDto, UpdateCurrencyRateDto } from '../../common/dto/create-rate.dto';
import { PurchaseQuote, PurchaseStatus } from '../purchase/entities/purchase-quote.entity';
import { NumberSeriesService } from '../../common/utils/number-series';
import { PaginatedResult } from '../../common/types';
import { PaymentTerms } from '../masters/entities/payment-terms.entity';
import { AuditService } from '../audit/audit.service';

// Valid status transitions
const ANALYSIS_STATUS_TRANSITIONS: Record<PriceAnalysisStatus, PriceAnalysisStatus[]> = {
  [PriceAnalysisStatus.DRAFT]: [PriceAnalysisStatus.CALCULATED],
  [PriceAnalysisStatus.CALCULATED]: [PriceAnalysisStatus.SUBMITTED, PriceAnalysisStatus.DRAFT],
  [PriceAnalysisStatus.SUBMITTED]: [PriceAnalysisStatus.APPROVED, PriceAnalysisStatus.APPROVAL_PENDING, PriceAnalysisStatus.CALCULATED],
  [PriceAnalysisStatus.APPROVAL_PENDING]: [PriceAnalysisStatus.APPROVED, PriceAnalysisStatus.REJECTED],
  [PriceAnalysisStatus.APPROVED]: [PriceAnalysisStatus.LOCKED],
  [PriceAnalysisStatus.LOCKED]: [],
  [PriceAnalysisStatus.REJECTED]: [PriceAnalysisStatus.DRAFT],
};

// Currency rates for conversion
const DEFAULT_CURRENCY_RATES = {
  GBP: 127.25,
  USD: 93.25,
  CAD: 60.75,
  AUD: 65.25,
  EUR: 105.75,
  INR: 1,
};

@Injectable()
export class RateService implements OnApplicationBootstrap, OnModuleDestroy {
  private syncIntervalRef: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(PriceAnalysis)
    private analysisRepo: Repository<PriceAnalysis>,
    @InjectRepository(PriceAnalysisItem)
    private itemRepo: Repository<PriceAnalysisItem>,
    @InjectRepository(CurrencyRate)
    private currencyRepo: Repository<CurrencyRate>,
    @InjectRepository(HaulageRate)
    private haulageRepo: Repository<HaulageRate>,
    @InjectRepository(FinalCurrencyRateMaster)
    private finalCurrencyRepo: Repository<FinalCurrencyRateMaster>,
    @InjectRepository(PurchaseQuote)
    private purchaseQuoteRepo: Repository<PurchaseQuote>,
    private numberSeriesService: NumberSeriesService,
    private auditService: AuditService,
  ) {}

  async onApplicationBootstrap() {
    console.log('[RateService] Application bootstrap: Syncing currency rates from Frankfurter API...');
    try {
      await this.syncCurrencyRates();
    } catch (err) {
      console.error('[RateService] Failed to sync currency rates on startup:', err.message);
    }

    // Set up a background interval to sync rates every 24 hours (86,400,000 milliseconds)
    this.syncIntervalRef = setInterval(async () => {
      console.log('[RateService] Running daily currency rates sync...');
      try {
        await this.syncCurrencyRates();
      } catch (err) {
        console.error('[RateService] Failed to sync currency rates during scheduled task:', err.message);
      }
    }, 86400000);
  }

  onModuleDestroy() {
    if (this.syncIntervalRef) {
      clearInterval(this.syncIntervalRef);
      this.syncIntervalRef = null;
    }
  }

  async syncCurrencyRates(): Promise<{ success: boolean; updated: string[]; errors?: string }> {
    try {
      console.log('[RateService] Fetching exchange rates from Frankfurter API...');
      const response = await fetch('https://api.frankfurter.app/latest?from=INR');
      if (!response.ok) {
        throw new Error(`Failed to fetch from Frankfurter API: ${response.statusText}`);
      }
      const data: any = await response.json();
      if (!data || !data.rates) {
        throw new Error('Invalid response structure from Frankfurter API');
      }

      const rates = data.rates;
      const dbRates = await this.currencyRepo.find({ where: { isActive: true } });
      const updatedCodes: string[] = [];

      // 1. Sync standard currency rates
      for (const dbRate of dbRates) {
        const code = dbRate.currencyCode.toUpperCase();
        if (code === 'INR') {
          dbRate.rate = 1;
          dbRate.source = 'BASE';
          dbRate.rateDate = new Date();
          await this.currencyRepo.save(dbRate);
          continue;
        }

        // Frankfurter returns rates from INR base. e.g. USD: 0.0119.
        // The value of 1 USD in INR is 1 / 0.0119.
        if (rates[code] !== undefined) {
          const valueInInr = 1 / Number(rates[code]);
          dbRate.rate = Math.round(valueInInr * 10000) / 10000; // Round to 4 decimal places
          dbRate.source = 'FRANKFURTER';
          dbRate.rateDate = new Date();
          await this.currencyRepo.save(dbRate);
          updatedCodes.push(code);
        }
      }

      // 2. Sync final currency rates master
      const finalRates = await this.finalCurrencyRepo.find({ where: { isActive: true } });
      for (const finalRate of finalRates) {
        const code = finalRate.currencyCode.toUpperCase();
        if (code === 'INR') {
          finalRate.actualRate = 1;
          finalRate.finalRate = 1;
          finalRate.rateDate = new Date();
          await this.finalCurrencyRepo.save(finalRate);
          continue;
        }

        if (rates[code] !== undefined) {
          const valueInInr = 1 / Number(rates[code]);
          const roundedRate = Math.round(valueInInr * 10000) / 10000;
          finalRate.actualRate = roundedRate;
          // finalRate = actualRate + marginBuffer
          finalRate.finalRate = roundedRate + Number(finalRate.marginBuffer || 0);
          finalRate.rateDate = new Date();
          await this.finalCurrencyRepo.save(finalRate);
        }
      }

      console.log(`[RateService] Successfully synced currency rates for: ${updatedCodes.join(', ')}`);
      return { success: true, updated: updatedCodes };
    } catch (err) {
      console.error('[RateService] Error syncing currency rates:', err.message);
      return { success: false, updated: [], errors: err.message };
    }
  }

  // ========== PRICE ANALYSIS ==========

  async createAnalysis(dto: CreatePriceAnalysisDto, userId?: string): Promise<PriceAnalysis> {
    const analysisNo = await this.numberSeriesService.generateNumber('PRICE_ANALYSIS', 'PA');

    // Set currency rates from existing data or defaults
    const currencyRates = await this.getCurrencyRates();

    const analysis = this.analysisRepo.create({
      ...dto,
      analysisNo,
      analysisDate: new Date(),
      gbpRate: dto.gbpRate || currencyRates.GBP,
      usdRate: dto.usdRate || currencyRates.USD,
      cadRate: dto.cadRate || currencyRates.CAD,
      audRate: dto.audRate || currencyRates.AUD,
      euroRate: dto.euroRate || currencyRates.EUR,
      createdBy: userId,
    });

    const savedAnalysis = await this.analysisRepo.save(analysis);

    // Create items if provided
    if (dto.items && dto.items.length > 0) {
      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        await this.createAnalysisItem(savedAnalysis.analysisId, itemDto, i + 1, userId);
      }
    }

    await this.auditService.log(
      savedAnalysis.companyId || '',
      'PriceAnalysis',
      savedAnalysis.analysisId,
      'CREATE',
      userId || 'system',
      { newValue: { analysisNo: savedAnalysis.analysisNo, status: savedAnalysis.status } },
    );

    return this.findAnalysisById(savedAnalysis.analysisId);
  }

  async createAnalysisFromPurchaseQuote(purchaseQuoteId: string, dto: Partial<CreatePriceAnalysisDto>, userId?: string): Promise<PriceAnalysis> {
    const analysisNo = await this.numberSeriesService.generateNumber('PRICE_ANALYSIS', 'PA');
    const currencyRates = await this.getCurrencyRates();

    // Fetch purchase quote and copy metadata
    const pqRepo = this.analysisRepo.manager.getRepository('PurchaseQuote');
    const pq = await pqRepo.findOne({
      where: { quoteId: purchaseQuoteId, deletedAt: IsNull() as any },
    });

    const metadata: Partial<PriceAnalysis> = {};
    if (pq) {
      metadata.enquiryOrderId = pq.enquiryOrderId;
      metadata.enquiryOrderNo = pq.salesEnquiryOrderNo;
      metadata.purchaseQuoteNo = pq.quoteNo;
      metadata.customerId = pq.customerId;
      metadata.buyerCode = pq.partyCode;
      metadata.customerName = pq.partyName;
      metadata.country = pq.country;
      metadata.state = pq.state;
      metadata.city = pq.city;
      metadata.pod = pq.pod;
      metadata.paymentTermsId = pq.paymentTermsId;
      metadata.currencyId = pq.currencyId;
      metadata.salesPersonId = pq.salesPersonId;
    }

    const analysis = this.analysisRepo.create({
      ...metadata,
      ...dto,
      purchaseQuoteId,
      analysisNo,
      analysisDate: new Date(),
      gbpRate: dto.gbpRate || currencyRates.GBP,
      usdRate: dto.usdRate || currencyRates.USD,
      cadRate: dto.cadRate || currencyRates.CAD,
      audRate: dto.audRate || currencyRates.AUD,
      euroRate: dto.euroRate || currencyRates.EUR,
      usePurchaseRate: true,
      createdBy: userId,
    });

    const savedAnalysis = await this.analysisRepo.save(analysis);

    // If the caller sends analysis items, treat them as an explicit override.
    if (dto.items && dto.items.length > 0) {
      for (let i = 0; i < dto.items.length; i++) {
        await this.createAnalysisItem(savedAnalysis.analysisId, dto.items[i], i + 1, userId);
      }
      return this.findAnalysisById(savedAnalysis.analysisId);
    }

    // Otherwise import items from purchase quote items.
    const pqItemRepo = this.analysisRepo.manager.getRepository('PurchaseQuoteItem');
    const pqItems = await pqItemRepo.find({
      where: { quoteId: purchaseQuoteId, deletedAt: IsNull() as any },
      order: { lineNo: 'ASC' },
    });

    if (pqItems && pqItems.length > 0) {
      for (const pqItem of pqItems) {
        const item = this.itemRepo.create({
          analysisId: savedAnalysis.analysisId,
          quoteId: purchaseQuoteId,
          quoteItemId: pqItem.itemId,
          enquiryItemId: pqItem.enquiryItemId,
          lineNo: pqItem.lineNo,
          sku: pqItem.sku,
          productCode: pqItem.productCode,
          categoryId: pqItem.categoryId,
          categoryName: pqItem.categoryName,
          brandId: pqItem.brandId,
          brandName: pqItem.brandName,
          productName: pqItem.productName,
          productDescription: pqItem.productDescription,
          unitSize: pqItem.unitSize,
          unitsPerCase: pqItem.unitsPerCase || pqItem.unitPerCarton,
          packingType: pqItem.packingType,
          unitBasis: pqItem.unitBasis,
          packingSize: pqItem.packingSize,
          orderQuantity: pqItem.quantity,
          cbmPerBox: pqItem.cbmPerBox,
          totalCbm: pqItem.totalCbm,
          mrp: pqItem.mrp,
          buyingPrice: pqItem.buyingPrice,
          gstPercent: pqItem.gstPercent,
          landingCost: pqItem.landingCost,
          location: (pqItem as any).location || (pqItem as any).bestLandingLocation || 'Delhi',
          bestLandingLocation: (pqItem as any).bestLandingLocation || (pqItem as any).location || '',
          purchasePersonId: (pqItem as any).purchasePersonId,
          purchasePersonName: (pqItem as any).purchasePersonName || (pqItem as any).productPurchasePersonName || (pqItem as any).purchasePerson || '',
          remark: (pqItem as any).remark || '',
          status: PriceAnalysisItemStatus.PENDING,
          createdBy: userId,
        });
        await this.itemRepo.save(item);
      }
    }

    return this.findAnalysisById(savedAnalysis.analysisId);
  }

  async findAllAnalysis(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PriceAnalysisStatus;
    customerId?: string;
    enquiryOrderId?: string;
  } = {}): Promise<PaginatedResult<PriceAnalysis>> {
    const { page = 1, limit = 20, search, status, customerId, enquiryOrderId } = params;

    // Build base conditions
    const baseWhere: any = { deletedAt: IsNull() };
    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim().toLowerCase());
        baseWhere.status = In(statuses);
      } else {
        baseWhere.status = (status as string).toLowerCase();
      }
    }
    if (customerId) baseWhere.customerId = customerId;
    if (enquiryOrderId) baseWhere.enquiryOrderId = enquiryOrderId;

    // If searching, use OR across multiple fields
    let where: any;
    if (search) {
      where = [
        { ...baseWhere, analysisNo: ILike(`%${search}%`) },
        { ...baseWhere, enquiryOrderNo: ILike(`%${search}%`) },
        { ...baseWhere, customerName: ILike(`%${search}%`) },
        { ...baseWhere, buyerCode: ILike(`%${search}%`) },
      ];
    } else {
      where = baseWhere;
    }

    return this.paginate(
      this.analysisRepo,
      page,
      limit,
      where,
      { createdAt: 'DESC' },
      [],
    );
  }

  async findAnalysisById(id: string): Promise<PriceAnalysis> {
    const analysis = await this.analysisRepo.findOne({
      where: { analysisId: id, deletedAt: IsNull() as any },
    });
    if (!analysis) throw new NotFoundException('Price Analysis not found');

    // Get items
    const items = await this.itemRepo.find({
      where: { analysisId: id, deletedAt: IsNull() as any },
      order: { lineNo: 'ASC' },
    });

    (analysis as any).items = items;

    // Load payment terms name/code if paymentTermsId is set
    if (analysis.paymentTermsId) {
      try {
        const ptRepo = this.analysisRepo.manager.getRepository(PaymentTerms);
        const pt = await ptRepo.findOne({ where: { id: analysis.paymentTermsId } });
        if (pt) {
          (analysis as any).paymentTerms = pt.code || pt.name || 'CIF';
        }
      } catch (err) {
        // Ignored
      }
    }

    // Calculate totals
    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    let totalCbm = 0;

    for (const item of items) {
      if (item.landingCost && item.orderQuantity) {
        totalPurchaseValue += Number(item.landingCost) * Number(item.orderQuantity);
      }
      if (item.finalSellingRate && item.orderQuantity) {
        totalSellingValue += Number(item.finalSellingRate) * Number(item.orderQuantity);
      }
      if (item.totalCbm) {
        totalCbm += Number(item.totalCbm);
      }
    }

    analysis.totalPurchaseValue = totalPurchaseValue;
    analysis.totalSellingValue = totalSellingValue;
    analysis.totalCbm = totalCbm;
    analysis.totalMargin = totalSellingValue > 0
      ? ((totalSellingValue - totalPurchaseValue) / totalSellingValue) * 100
      : 0;

    return analysis;
  }

  async findAnalysisByNumber(analysisNo: string): Promise<PriceAnalysis> {
    const analysis = await this.analysisRepo.findOne({
      where: { analysisNo, deletedAt: null as any },
    });
    if (!analysis) throw new NotFoundException('Price Analysis not found');
    return this.findAnalysisById(analysis.analysisId);
  }

  async updateAnalysis(id: string, dto: UpdatePriceAnalysisDto, userId?: string): Promise<PriceAnalysis> {
    const analysis = await this.findAnalysisById(id);

    // Calculate final currency rates if margins are provided
    if (dto.gbpMargin !== undefined && dto.gbpRate !== undefined) {
      dto.gbpFinalRate = dto.gbpRate + (dto.gbpMargin || 0);
    }
    if (dto.usdMargin !== undefined && dto.usdRate !== undefined) {
      dto.usdFinalRate = dto.usdRate + (dto.usdMargin || 0);
    }
    if (dto.cadMargin !== undefined && dto.cadRate !== undefined) {
      dto.cadFinalRate = dto.cadRate + (dto.cadMargin || 0);
    }
    if (dto.audMargin !== undefined && dto.audRate !== undefined) {
      dto.audFinalRate = dto.audRate + (dto.audMargin || 0);
    }
    if (dto.euroMargin !== undefined && dto.euroRate !== undefined) {
      dto.euroFinalRate = dto.euroRate + (dto.euroMargin || 0);
    }

    // Check status transition
    if (dto.status && dto.status !== analysis.status) {
      this.validateStatusTransition(analysis.status, dto.status as PriceAnalysisStatus);
    }

    Object.assign(analysis, dto);
    if (userId) analysis.updatedBy = userId;

    await this.analysisRepo.save(analysis);

    await this.auditService.log(
      analysis.companyId || '',
      'PriceAnalysis',
      id,
      'UPDATE',
      userId || 'system',
      { newValue: dto as Record<string, any> },
    );

    return this.findAnalysisById(id);
  }

  async updateAnalysisStatus(id: string, status: PriceAnalysisStatus, remarks?: string, userId?: string): Promise<PriceAnalysis> {
    const analysis = await this.findAnalysisById(id);
    const previousStatus = analysis.status;
    this.validateStatusTransition(analysis.status, status);

    analysis.status = status;
    if (remarks) analysis.remarks = remarks;
    if (status === PriceAnalysisStatus.APPROVED) {
      analysis.approvedBy = userId;
      analysis.approvedAt = new Date();
      if (remarks) analysis.approvalRemarks = remarks;
    }
    if (userId) analysis.updatedBy = userId;

    await this.analysisRepo.save(analysis);

    await this.auditService.logStatusChange(
      'PriceAnalysis',
      id,
      previousStatus,
      status,
      userId || 'system',
      remarks,
    );

    // Cross-module: When locking, mark the source purchase quote as RATE_FINALIZED
    if (status === PriceAnalysisStatus.LOCKED && analysis.purchaseQuoteId) {
      try {
        const pq = await this.purchaseQuoteRepo.findOne({ where: { quoteId: analysis.purchaseQuoteId } });
        if (pq) {
          pq.status = PurchaseStatus.RATE_FINALIZED;
          await this.purchaseQuoteRepo.save(pq);
        }
      } catch (err) {
        console.warn('[RateService] Could not update PurchaseQuote status on lock:', err?.message);
      }
    }

    return this.findAnalysisById(id);
  }


  async calculateAnalysis(id: string, userId?: string): Promise<PriceAnalysis> {
    const analysis = await this.findAnalysisById(id);
    const items = (analysis as any).items || [];

    for (const item of items) {
      await this.calculateItem(id, item.itemId, analysis, userId);
    }

    // Update analysis status to calculated
    analysis.status = PriceAnalysisStatus.CALCULATED;
    if (userId) analysis.updatedBy = userId;
    await this.analysisRepo.save(analysis);

    return this.findAnalysisById(id);
  }

  async calculateItem(
    analysisId: string,
    itemId: string,
    analysis: PriceAnalysis,
    userId?: string
  ): Promise<PriceAnalysisItem> {
    const item = await this.itemRepo.findOne({
      where: { itemId, analysisId, deletedAt: null as any },
    });
    if (!item) throw new NotFoundException('Analysis Item not found');

    // Get haulage rates
    const haulageRates = await this.getHaulageRates();

    const targetCurr = item.targetCurrency || 'USD';
    const exchangeRate = this.getCurrencyRate(analysis, targetCurr);
    const locationUpper = (item.location || 'DELHI').toUpperCase();

    // Use Buying Best Landing Rate (O), falling back to purchase team's Landing Cost (J) if not set
    const activeBuyingPrice = Number(item.buyingPrice || item.landingCost || 0);

    // 1. Gst % (Col P) = gstPercent
    // 2. Gst Amount (Col Q) = Buying Price (Col O) * Gst Percent (Col P) / 100
    item.gstAmount = activeBuyingPrice * ((item.gstPercent || 0) / 100);

    // 3. Per Pc Rate Without Gst (Col R) = (Buying Price - Gst Amount) / Units Per Case
    item.perPcRateWithoutGst = item.unitsPerCase > 0 ? ((activeBuyingPrice - item.gstAmount) / item.unitsPerCase) : 0;

    // 4. Tax (Col S) = Gst Percent / 100
    item.tax = (item.gstPercent || 0) / 100;

    // 5. Total Rate / Box (Col V) = (Per Pc Rate Without Gst * Tax) + Per Pc Rate Without Gst + Other Cost
    item.totalRatePerBox = (item.perPcRateWithoutGst * item.tax) + item.perPcRateWithoutGst + Number(item.otherCost || 0);

    // 6. Rate With Gst Cost (Col W) = Total Rate / Box + Gst Cost
    item.rateWithGstCost = item.totalRatePerBox + Number(item.gstCost || 0);

    // 7. Final Price in Frg. Currency (Col X) = (Rate With Gst Cost / Exchange Rate) / (1 - Margin %)
    // Margin defaults to 0 to match Google Sheet base formula; can be set per item for profit calculation
    const marginPercent = item.marginPercent || 0;
    item.marginPercent = marginPercent;
    const marginFactor = 1 - (Math.min(marginPercent, 99.99) / 100);
    item.finalPriceInForeignCurrency = marginFactor > 0 ? ((item.rateWithGstCost / exchangeRate) / marginFactor) : (item.rateWithGstCost / exchangeRate);

    // 8. Rates Per Carton (Col Y) = Final Price in Frg. Currency * Units Per Case
    item.ratePerCarton = item.finalPriceInForeignCurrency * (item.unitsPerCase || 1);

    // 9. Total CBM = (Quantity / Units Per Case) * CBM
    const totalCartons = item.unitsPerCase > 0 ? Math.ceil((item.orderQuantity || 0) / item.unitsPerCase) : 0;
    item.totalCbm = totalCartons * Number(item.cbmPerBox || 0);

    // 10. Haulage (Col AB)
    // Haulage defaults: Delhi=185000, Mumbai=85000 (per Google Sheet)
    let haulageLocationRate = haulageRates[locationUpper] || (locationUpper === 'MUMBAI' ? 85000 : 185000);
    const defaultLocation = (analysis.haulageLocation || 'DELHI').toUpperCase();
    if (locationUpper === defaultLocation && Number(analysis.totalHaulage) > 0) {
      haulageLocationRate = Number(analysis.totalHaulage);
    }
    const shippingTerms = (analysis as any).paymentTerms || 'CIF';
    const freightCharges = Number((analysis as any).freightUSD) > 0 ? Number((analysis as any).freightUSD) : 100; // From analysis settings, default 100 USD
    
    if (shippingTerms.toUpperCase() === 'FOB') {
      item.selectedHaulage = haulageLocationRate / exchangeRate;
    } else {
      item.selectedHaulage = (haulageLocationRate / exchangeRate) + freightCharges;
    }

    // 11. CBM Cost Per Box in Selected Currency (Col AA) = (CBM / Container Capacity) * Haulage
    const containerCapacity = (analysis as any).containerSize === 20 ? 28 : 60;
    item.cbmCostPerBoxInSelectedCurrency = Number(item.cbmPerBox || 0) / containerCapacity * item.selectedHaulage;

    // 12. Final Selling Rate (Col AD) = Rates Per Carton (Col Y) + Cbm Cost Per Box (Col AA)
    item.finalSellingRate = item.ratePerCarton + item.cbmCostPerBoxInSelectedCurrency;

    // Round if required
    if (analysis.isRateRounded) {
      item.finalSellingRate = Math.ceil(item.finalSellingRate * 100) / 100;
    }

    item.status = PriceAnalysisItemStatus.CALCULATED;
    if (userId) item.updatedBy = userId;

    await this.itemRepo.save(item);
    return item;
  }

  async deleteAnalysis(id: string, userId?: string): Promise<void> {
    const analysis = await this.findAnalysisById(id);
    analysis.deletedAt = new Date();
    await this.analysisRepo.save(analysis);

    // Soft delete items
    await this.itemRepo.update({ analysisId: id }, { deletedAt: new Date() });

    await this.auditService.log(
      analysis.companyId || '',
      'PriceAnalysis',
      id,
      'DELETE',
      userId || 'system',
      { oldValue: { analysisNo: analysis.analysisNo } },
    );
  }

  // ========== PRICE ANALYSIS ITEMS ==========

  async createAnalysisItem(analysisId: string, dto: any, lineNo: number = 1, userId?: string): Promise<PriceAnalysisItem | PriceAnalysisItem[]> {
    // Handle array of items
    if (Array.isArray(dto)) {
      const items: PriceAnalysisItem[] = [];
      for (let i = 0; i < dto.length; i++) {
        const itemDto = dto[i];
        const cartons = (itemDto.unitsPerCase || 1) > 0
          ? Math.ceil(Number(itemDto.orderQuantity || 0) / Number(itemDto.unitsPerCase || 1))
          : 0;
        const totalCbm = cartons * Number(itemDto.cbmPerBox || 0);
        const item = new PriceAnalysisItem();
        Object.assign(item, itemDto);
        item.analysisId = analysisId;
        item.lineNo = i + 1;
        item.totalCbm = totalCbm;
        if (userId) item.createdBy = userId;
        items.push(await this.itemRepo.save(item));
      }
      return items;
    }

    // Single item
    const cartons = (dto.unitsPerCase || 1) > 0
      ? Math.ceil(Number(dto.orderQuantity || 0) / Number(dto.unitsPerCase || 1))
      : 0;
    const totalCbm = cartons * Number(dto.cbmPerBox || 0);
    const item = new PriceAnalysisItem();
    Object.assign(item, dto);
    item.analysisId = analysisId;
    item.lineNo = lineNo;
    item.totalCbm = totalCbm;
    if (userId) item.createdBy = userId;

    return this.itemRepo.save(item) as Promise<PriceAnalysisItem>;
  }

  async updateAnalysisItem(id: string, dto: UpdatePriceAnalysisItemDto, userId?: string): Promise<PriceAnalysisItem> {
    const item = await this.itemRepo.findOne({
      where: { itemId: id, deletedAt: null as any },
    });
    if (!item) throw new NotFoundException('Analysis Item not found');

    Object.assign(item, dto);
    if (userId) item.updatedBy = userId;

    // Recalculate totals if needed
    if (dto.cbmPerBox || dto.orderQuantity || dto.unitsPerCase) {
      const cartons = (item.unitsPerCase || 1) > 0
        ? Math.ceil(Number(item.orderQuantity || 0) / Number(item.unitsPerCase || 1))
        : 0;
      item.totalCbm = cartons * Number(item.cbmPerBox || 0);
    }

    return this.itemRepo.save(item);
  }

  async deleteAnalysisItem(id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { itemId: id } });
    if (!item) throw new NotFoundException('Analysis Item not found');
    item.deletedAt = new Date();
    await this.itemRepo.save(item);
  }

  // ========== HAULAGE RATES ==========

  async createHaulageRate(dto: CreateHaulageRateDto, userId?: string): Promise<HaulageRate> {
    const rate = this.haulageRepo.create({
      ...dto,
      createdBy: userId,
    });
    return this.haulageRepo.save(rate);
  }

  async findAllHaulageRates(): Promise<HaulageRate[]> {
    return this.haulageRepo.find({
      where: { isActive: true },
      order: { location: 'ASC' },
    });
  }

  async updateHaulageRate(id: string, dto: UpdateHaulageRateDto, userId?: string): Promise<HaulageRate> {
    const rate = await this.haulageRepo.findOne({
      where: { haulageId: id },
    });
    if (!rate) throw new NotFoundException('Haulage Rate not found');

    Object.assign(rate, dto);
    if (userId) rate.updatedBy = userId;

    return this.haulageRepo.save(rate);
  }

  async deleteHaulageRate(id: string): Promise<void> {
    const rate = await this.haulageRepo.findOne({ where: { haulageId: id } });
    if (!rate) throw new NotFoundException('Haulage Rate not found');
    rate.isActive = false;
    await this.haulageRepo.save(rate);
  }

  // ========== CURRENCY RATES ==========

  async createCurrencyRate(dto: CreateCurrencyRateDto, userId?: string): Promise<CurrencyRate> {
    const rate = this.currencyRepo.create({
      ...dto,
      rateDate: new Date(),
      createdBy: userId,
    });
    return this.currencyRepo.save(rate);
  }

  async findAllCurrencyRates(): Promise<CurrencyRate[]> {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { currencyCode: 'ASC' },
    });
  }

  async updateCurrencyRate(id: string, dto: UpdateCurrencyRateDto, userId?: string): Promise<CurrencyRate> {
    const rate = await this.currencyRepo.findOne({
      where: { rateId: id },
    });
    if (!rate) throw new NotFoundException('Currency Rate not found');

    Object.assign(rate, dto);

    if (userId) rate.updatedBy = userId;

    return this.currencyRepo.save(rate);
  }

  async deleteCurrencyRate(id: string): Promise<void> {
    const rate = await this.currencyRepo.findOne({ where: { rateId: id } });
    if (!rate) throw new NotFoundException('Currency Rate not found');
    rate.isActive = false;
    await this.currencyRepo.save(rate);
  }

  // ========== FINAL CURRENCY RATES ==========

  async getFinalCurrencyRateMasters(): Promise<FinalCurrencyRateMaster[]> {
    return this.finalCurrencyRepo.find({
      where: { isActive: true },
      order: { currencyCode: 'ASC' },
    });
  }

  async updateFinalCurrencyRateMaster(id: string, margin: number, userId?: string): Promise<FinalCurrencyRateMaster> {
    const rate = await this.finalCurrencyRepo.findOne({
      where: { finalCurrencyRateId: id },
    });
    if (!rate) throw new NotFoundException('Final Currency Rate not found');

    rate.marginBuffer = margin;
    rate.finalRate = rate.actualRate + margin;
    if (userId) rate.updatedBy = userId;

    return this.finalCurrencyRepo.save(rate);
  }

  // ========== HELPER METHODS ==========

  private validateStatusTransition(current: PriceAnalysisStatus, next: PriceAnalysisStatus): void {
    const allowed = ANALYSIS_STATUS_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition from '${current}' to '${next}'. Allowed: ${allowed?.join(', ') || 'none'}`
      );
    }
  }

  private async getCurrencyRates(): Promise<Record<string, number>> {
    const rates = await this.currencyRepo.find({
      where: { isActive: true },
    });

    const rateMap: Record<string, number> = { ...DEFAULT_CURRENCY_RATES };
    for (const rate of rates) {
      rateMap[rate.currencyCode.toUpperCase()] = rate.rate;
    }

    return rateMap;
  }

  private async getHaulageRates(): Promise<Record<string, number>> {
    const rates = await this.haulageRepo.find({
      where: { isActive: true },
    });

    const rateMap: Record<string, number> = {};
    for (const rate of rates) {
      rateMap[rate.location.toUpperCase()] = rate.ratePerCbm;
    }

    // Default rates if not found (Delhi=185000, Mumbai=85000 per Google Sheet)
    if (!rateMap.DELHI) rateMap.DELHI = 185000;
    if (!rateMap.MUMBAI) rateMap.MUMBAI = 85000;

    return rateMap;
  }

  private getCurrencyRate(analysis: PriceAnalysis, currency: string): number {
    const currencyUpper = currency.toUpperCase();
    switch (currencyUpper) {
      case 'GBP': return Number(analysis.gbpRate || DEFAULT_CURRENCY_RATES.GBP);
      case 'USD': return Number(analysis.usdRate || DEFAULT_CURRENCY_RATES.USD);
      case 'CAD': return Number(analysis.cadRate || DEFAULT_CURRENCY_RATES.CAD);
      case 'AUD': return Number(analysis.audRate || DEFAULT_CURRENCY_RATES.AUD);
      case 'EUR': return Number(analysis.euroRate || DEFAULT_CURRENCY_RATES.EUR);
      default: return 1; // INR
    }
  }

  private async paginate<T>(
    repo: Repository<T>,
    page: number,
    limit: number,
    where: any,
    order: any,
    relations: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await repo.findAndCount({
      where,
      order,
      relations,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========== VERSION HISTORY ==========

  /**
   * Get the full requote chain for any PA in the chain.
   * Finds the root PA, then returns ALL versions (root + all requotes) ordered old → new.
   */
  async getVersionHistory(analysisId: string): Promise<any> {
    const analysis = await this.analysisRepo.findOne({
      where: { analysisId, deletedAt: IsNull() as any },
    });
    if (!analysis) throw new NotFoundException('Price Analysis not found');

    // Determine the root of the chain
    const rootId = analysis.rootAnalysisId || analysis.analysisId;

    // Find ALL PAs in this chain: root + all that share the same rootAnalysisId
    const chainMembers = await this.analysisRepo.find({
      where: [
        { analysisId: rootId, deletedAt: IsNull() as any },
        { rootAnalysisId: rootId, deletedAt: IsNull() as any },
      ],
      order: { requoteVersion: 'ASC', createdAt: 'ASC' },
    });

    // If no chain found (legacy PA without rootAnalysisId), return just this PA
    if (chainMembers.length === 0) {
      const full = await this.findAnalysisById(analysisId);
      return {
        versions: [{
          analysisId: full.analysisId,
          analysisNo: full.analysisNo,
          versionNo: full.requoteVersion || 1,
          status: full.status,
          createdAt: full.createdAt,
          totalPurchaseValue: full.totalPurchaseValue || 0,
          totalSellingValue: full.totalSellingValue || 0,
          totalMargin: full.totalMargin || 0,
          remarks: full.remarks || '',
          requoteReason: full.requoteReason || '',
          isRequote: false,
          isCurrent: true,
          createdBy: full.createdBy,
        }],
        currentVersion: 1,
        totalVersions: 1,
      };
    }

    const versions = chainMembers.map((pa, index) => ({
      analysisId: pa.analysisId,
      analysisNo: pa.analysisNo,
      versionNo: pa.requoteVersion || (index + 1),
      status: pa.status,
      createdAt: pa.createdAt,
      totalPurchaseValue: pa.totalPurchaseValue || 0,
      totalSellingValue: pa.totalSellingValue || 0,
      totalMargin: pa.totalMargin || 0,
      remarks: pa.remarks || '',
      requoteReason: pa.requoteReason || '',
      isRequote: !!pa.parentAnalysisId,
      isCurrent: pa.analysisId === analysisId,
      createdBy: pa.createdBy,
    }));

    return {
      versions,
      currentVersion: versions.find(v => v.isCurrent)?.versionNo || 1,
      totalVersions: versions.length,
    };
  }

  async createRequote(analysisId: string, reason: string, remarks: string, userId?: string): Promise<PriceAnalysis> {
    const analysis = await this.findAnalysisById(analysisId);
    const requoteNo = await this.numberSeriesService.generateNumber('PRICE_ANALYSIS', 'PA');

    // Determine chain root and next version number
    const rootId = analysis.rootAnalysisId || analysis.analysisId;

    // Count existing versions in chain to determine next version number
    const existingCount = await this.analysisRepo.count({
      where: [
        { analysisId: rootId, deletedAt: IsNull() as any },
        { rootAnalysisId: rootId, deletedAt: IsNull() as any },
      ],
    });
    const nextVersion = existingCount + 1;

    // Build a clean copy without the primary key and non-entity fields
    const { analysisId: _id, createdAt: _ca, updatedAt: _ua, items: _items, paymentTerms: _pt, ...rest } = analysis as any;
    const requoteAnalysis = this.analysisRepo.create({
      ...rest,
      analysisNo: requoteNo,
      status: PriceAnalysisStatus.DRAFT,
      remarks: remarks || undefined,
      parentAnalysisId: analysisId,
      rootAnalysisId: rootId,
      requoteVersion: nextVersion,
      requoteReason: reason || undefined,
      purchaseQuoteId: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      approvalRemarks: undefined,
      createdBy: userId,
    });

    const savedResult = await this.analysisRepo.save(requoteAnalysis);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    // Backfill rootAnalysisId on the original PA if it doesn't have one yet (first requote)
    if (!analysis.rootAnalysisId && analysis.analysisId === rootId) {
      await this.analysisRepo.update(rootId, { rootAnalysisId: rootId });
    }

    // Copy items
    const items = (analysis as any).items || [];
    for (const item of items) {
      const { itemId: _itemId, analysisId: _analysisId, createdAt: _ca2, updatedAt: _ua2, ...itemRest } = item;
      const newItem = this.itemRepo.create({
        ...itemRest,
        analysisId: saved.analysisId,
        status: PriceAnalysisItemStatus.PENDING,
        createdBy: userId,
      });
      await this.itemRepo.save(newItem);
    }

    // Automatically transition the associated Sales Enquiry to rate_pending
    if (analysis.enquiryOrderId) {
      try {
        const salesRepo = this.analysisRepo.manager.getRepository('SalesEnquiryOrder');
        const enquiry = await salesRepo.findOne({ where: { enquiryOrderId: analysis.enquiryOrderId } });
        if (enquiry) {
          (enquiry as any).status = 'rate_pending';
          await salesRepo.save(enquiry);
        }
      } catch (err) {
        console.warn('[RateService] Could not update SalesEnquiryOrder status on requote:', err?.message);
      }
    }

    await this.auditService.log(
      analysis.companyId || '',
      'PriceAnalysis',
      saved.analysisId,
      'REQUOTE',
      userId || 'system',
      { newValue: { analysisNo: requoteNo, sourceAnalysisId: analysisId, reason, version: nextVersion } },
    );

    return this.findAnalysisById(saved.analysisId);
  }

  async getVersionById(versionId: string): Promise<any> {
    return { versionId, status: 'draft' };
  }

  // ========== PREVIOUS YEAR COMPARISON ==========

  async getPreviousYearComparison(analysisId: string): Promise<any> {
    const analysis = await this.findAnalysisById(analysisId);

    // Query historical analyses for the same customer
    let previousYear = [];
    try {
      const historicalAnalyses = await this.analysisRepo.createQueryBuilder('pa')
        .where('pa.customerId = :customerId', { customerId: analysis.customerId })
        .andWhere('pa.analysisId != :analysisId', { analysisId })
        .andWhere('pa.status IN (:...statuses)', { statuses: [PriceAnalysisStatus.LOCKED, PriceAnalysisStatus.APPROVED] })
        .orderBy('pa.createdAt', 'DESC')
        .getMany();

      previousYear = historicalAnalyses.map(ha => ({
        year: ha.createdAt ? new Date(ha.createdAt).getFullYear() : new Date().getFullYear() - 1,
        analysisNo: ha.analysisNo,
        avgRate: ha.totalSellingValue ? Number(ha.totalSellingValue) : 0,
        currency: 'USD',
        marginPercentage: Number(ha.totalMargin || 0),
      }));
    } catch (err) {
      // In case of query errors
    }

    // Calculate changes if we have historical data
    let rateChange = '+0.0%';
    let marginChange = '+0.0%';
    if (previousYear.length > 0) {
      const prev = previousYear[0];
      const currentMargin = Number(analysis.totalMargin || 0);
      const prevMargin = Number(prev.marginPercentage || 0);
      const mDiff = currentMargin - prevMargin;
      marginChange = (mDiff >= 0 ? '+' : '') + mDiff.toFixed(1) + '%';
      
      const currentRate = Number(analysis.totalSellingValue || 0);
      const prevRate = Number(prev.avgRate || 0);
      if (prevRate > 0) {
        const rDiffPercent = ((currentRate - prevRate) / prevRate) * 100;
        rateChange = (rDiffPercent >= 0 ? '+' : '') + rDiffPercent.toFixed(1) + '%';
      }
    }

    return {
      currentAnalysis: {
        analysisNo: analysis.analysisNo,
        buyerCode: analysis.buyerCode,
        totalPurchaseValue: analysis.totalPurchaseValue,
        totalSellingValue: analysis.totalSellingValue,
        marginPercentage: analysis.totalMargin,
      },
      previousYear,
      comparison: {
        rateChange,
        marginChange,
      },
    };
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(params: { page: number; limit: number; entityType?: string; entityId?: string }): Promise<PaginatedResult<any>> {
    const moduleName = params.entityType || 'PriceAnalysis';

    if (params.entityId) {
      const logs = await this.auditService.getAuditTrail(moduleName, params.entityId);
      const start = (params.page - 1) * params.limit;
      const paged = logs.slice(start, start + params.limit);
      return {
        data: paged,
        total: logs.length,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(logs.length / params.limit) || 1,
      };
    }

    // No entityId — return empty result (audit trail requires a specific record)
    return {
      data: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
    };
  }

  // ========== FORMULA MASTER ==========

  async getFormulas(type?: string): Promise<any[]> {
    // Return default formulas based on type
    const formulas = [
      {
        formulaId: '1',
        formulaName: 'GST Calculation',
        formulaType: 'gst',
        calculationMethod: 'percentage',
        defaultValue: 18,
        isActive: true,
      },
      {
        formulaId: '2',
        formulaName: 'Landing Cost',
        formulaType: 'landing_cost',
        calculationMethod: 'add',
        defaultValue: 0,
        isActive: true,
      },
      {
        formulaId: '3',
        formulaName: 'Final Rate with Margin',
        formulaType: 'final_rate',
        calculationMethod: 'divide',
        defaultValue: 20,
        isActive: true,
      },
    ];

    if (type) {
      return formulas.filter(f => f.formulaType === type);
    }
    return formulas;
  }

  async createFormula(dto: any, userId?: string): Promise<any> {
    return {
      formulaId: Date.now().toString(),
      ...dto,
      createdBy: userId,
      isActive: true,
    };
  }

  async updateFormula(id: string, dto: any, userId?: string): Promise<any> {
    return {
      formulaId: id,
      ...dto,
      updatedBy: userId,
    };
  }

  // ========== BULK OPERATIONS ==========

  async bulkCalculate(analysisIds: string[], userId?: string): Promise<any> {
    const results = [];

    for (const id of analysisIds) {
      try {
        const calculated = await this.calculateAnalysis(id, userId);
        results.push({ id, success: true, data: calculated });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return results;
  }
}
