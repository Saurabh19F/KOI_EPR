import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, IsNull, DataSource, In } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { Segment } from './entities/segment.entity';
import { ComponentGroup } from './entities/component-group.entity';
import { Brand } from './entities/brand.entity';
import { Product, ProductStatus, ProductSource } from './entities/product.entity';
import { Uom } from './entities/uom.entity';
import { GstRate } from './entities/gst-rate.entity';
import { Customer } from './entities/customer.entity';
import { SalesEnquiryOrderItem, ProductMasterStatus } from '../sales/entities/sales-enquiry-item.entity';
import { Zone } from './entities/zone.entity';
import { Location } from './entities/location.entity';
import { PaymentTerms } from './entities/payment-terms.entity';
import { Currency } from './entities/currency.entity';
import { CurrencyRate } from './entities/currency-rate.entity';
import { Port } from './entities/port.entity';
import { FreightRate } from './entities/freight.entity';
import { HaulageCharge } from './entities/haulage.entity';
import { Country } from './entities/country.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateVendorDto,
  UpdateVendorDto,
  CreatePackingDto,
  UpdatePackingDto,
} from '../../common/dto/create-master.dto';
import { NumberSeriesService } from '../../common/utils/number-series';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { TenantService } from '../../common/tenant/tenant.service';
import { CurrentUserDto } from '../../common/dto/current-user.dto';

export { PaginatedResult };

@Injectable()
export class MastersService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    @InjectRepository(Segment)
    private segmentRepo: Repository<Segment>,
    @InjectRepository(ComponentGroup)
    private groupRepo: Repository<ComponentGroup>,
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Uom)
    private uomRepo: Repository<Uom>,
    @InjectRepository(GstRate)
    private gstRepo: Repository<GstRate>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(Zone)
    private zoneRepo: Repository<Zone>,
    @InjectRepository(Location)
    private locationRepo: Repository<Location>,
    @InjectRepository(PaymentTerms)
    private paymentTermsRepo: Repository<PaymentTerms>,
    @InjectRepository(Currency)
    private currencyRepo: Repository<Currency>,
    @InjectRepository(CurrencyRate)
    private currencyRateRepo: Repository<CurrencyRate>,
    @InjectRepository(Port)
    private portRepo: Repository<Port>,
    @InjectRepository(FreightRate)
    private freightRepo: Repository<FreightRate>,
    @InjectRepository(HaulageCharge)
    private haulageRepo: Repository<HaulageCharge>,
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
    @InjectRepository(SalesEnquiryOrderItem)
    private itemRepo: Repository<SalesEnquiryOrderItem>,
    private numberSeries: NumberSeriesService,
    private tenantService: TenantService,
    private dataSource: DataSource,
  ) {}

  // ========== PAGINATION HELPERS ==========
  private async paginate<T>(
    repo: Repository<T>,
    page: number = 1,
    limit: number = 20,
    where: any = {},
    order: any = { createdAt: 'DESC' },
    relations: string[] = [],
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;

    const [data, total] = await repo.findAndCount({
      where,
      order,
      relations,
      skip,
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

  // ========== HELPER: Get tenant-filtered where clause ==========
  private getTenantWhere(user: CurrentUserDto | undefined, additionalWhere: Record<string, any> = {}): Record<string, any> {
    return this.tenantService.buildTenantWhere(user, additionalWhere);
  }

  // ========== HELPER: Validate record belongs to tenant ==========
  private validateAccess<T extends { companyId?: string }>(user: CurrentUserDto, record: T | null, resourceName: string): void {
    if (!record) return;
    this.tenantService.validateRecordAccess(user, record, resourceName);
  }

  // ========== HELPER: Include shared (null company) records ==========
  private getTenantOrSharedWhere(user: CurrentUserDto | undefined, additionalWhere: Record<string, any> = {}): Record<string, any>[] {
    const tenantWhere = this.getTenantWhere(user, additionalWhere);
    const sharedWhere = { ...additionalWhere, companyId: IsNull() };
    return [tenantWhere, sharedWhere];
  }

  // ========== CATEGORIES ==========
  findAllCategories(user?: CurrentUserDto) {
    return this.categoryRepo.find({
      where: this.getTenantOrSharedWhere(user, { isActive: true }) as any,
      order: { categoryName: 'ASC' },
    });
  }

  async findAllCategoriesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) {
      where.categoryName = ILike(`%${search}%`);
    }
    return this.paginate(this.categoryRepo, page, limit, where, { categoryName: 'ASC' });
  }

  async createCategory(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const category = this.categoryRepo.create({ ...dto, ...where });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: any, user?: CurrentUserDto) {
    const category = await this.categoryRepo.findOne({ where: { categoryId: id } });
    if (!category) throw new NotFoundException('Category not found');
    this.validateAccess(user, category, 'Category');
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string, user?: CurrentUserDto) {
    const category = await this.categoryRepo.findOne({ where: { categoryId: id } });
    if (!category) throw new NotFoundException('Category not found');
    this.validateAccess(user, category, 'Category');
    await this.categoryRepo.remove(category);
    return { deleted: true };
  }

  // ========== SEGMENTS ==========
  findAllSegments(user?: CurrentUserDto) {
    return this.segmentRepo.find({
      where: this.getTenantOrSharedWhere(user, { isActive: true }) as any,
      order: { segmentName: 'ASC' },
    });
  }

  // ========== COMPONENT GROUPS ==========
  findAllGroups(user?: CurrentUserDto) {
    return this.groupRepo.find({
      where: this.getTenantOrSharedWhere(user, { isActive: true }) as any,
      order: { groupName: 'ASC' },
    });
  }

  // ========== BRANDS ==========
  findAllBrands(user?: CurrentUserDto) {
    return this.brandRepo.find({
      where: this.getTenantOrSharedWhere(user, { isActive: true }) as any,
      order: { brandName: 'ASC' },
    });
  }

  async findAllBrandsPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) {
      where.brandName = ILike(`%${search}%`);
    }
    return this.paginate(this.brandRepo, page, limit, where, { brandName: 'ASC' });
  }

  async createBrand(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const brand = this.brandRepo.create({ ...dto, ...where });
    return this.brandRepo.save(brand);
  }

  async updateBrand(id: string, dto: any, user?: CurrentUserDto) {
    const brand = await this.brandRepo.findOne({ where: { brandId: id } });
    if (!brand) throw new NotFoundException('Brand not found');
    this.validateAccess(user, brand, 'Brand');
    Object.assign(brand, dto);
    return this.brandRepo.save(brand);
  }

  async deleteBrand(id: string, user?: CurrentUserDto) {
    const brand = await this.brandRepo.findOne({ where: { brandId: id } });
    if (!brand) throw new NotFoundException('Brand not found');
    this.validateAccess(user, brand, 'Brand');
    await this.brandRepo.remove(brand);
    return { deleted: true };
  }

  // ========== PRODUCTS ==========
  async findAllProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    segmentId?: string;
    source?: string;
    productStatus?: string;
  } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search, categoryId, segmentId, source, productStatus } = params;

    const where = this.getTenantWhere(user, { deletedAt: IsNull() as any });

    if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
    if (segmentId && segmentId !== 'all') where.segmentId = segmentId;
    if (source && source !== 'all') where.source = source;
    if (productStatus && productStatus !== 'all') where.productStatus = productStatus;

    // Search by productName OR sku (OR condition via array of where clauses)
    let whereCondition: any = where;
    if (search) {
      whereCondition = [
        { ...where, productName: ILike(`%${search}%`) },
        { ...where, sku: ILike(`%${search}%`) },
      ];
    }

    const result = await this.paginate(this.productRepo, page, limit, whereCondition, { createdAt: 'DESC' }, ['category', 'segment', 'brand', 'uom', 'gstRate']);

    // Filter out duplicate TEMP- products if an official master product already exists for that name
    const activeOfficialNames = new Set(
      result.data
        .filter(p => p.sku && !p.sku.startsWith('TEMP-') && p.source !== ProductSource.MANUAL)
        .map(p => p.productName?.toLowerCase().trim())
        .filter(Boolean)
    );

    result.data = result.data.filter(p => {
      if (p.sku?.startsWith('TEMP-') || p.source === ProductSource.MANUAL) {
        const name = p.productName?.toLowerCase().trim();
        if (name && activeOfficialNames.has(name)) {
          return false; // Hide temporary record if official product exists!
        }
      }
      return true;
    });

    const locationIds = result.data.map(p => p.locationId).filter(Boolean);
    if (locationIds.length > 0) {
      try {
        const locations = await this.locationRepo.find({ where: { id: In(locationIds) } });
        const locationsMap = new Map(locations.map(l => [l.id, l]));
        for (const product of result.data) {
          if (product.locationId && locationsMap.has(product.locationId)) {
            const loc = locationsMap.get(product.locationId);
            (product as any).location = loc;
            (product as any).locationName = (loc as any)?.locationName || (loc as any)?.name;
          }
        }
      } catch (e) {
        console.error('Failed to populate locations in findAllProducts:', e);
      }
    }

    return result;
  }

  async findProductById(id: string, user?: CurrentUserDto) {
    const product = await this.productRepo.findOne({
      where: { productId: id, deletedAt: IsNull() as any },
      relations: [],
    });
    if (!product) throw new NotFoundException('Product not found');
    this.validateAccess(user, product, 'Product');
    return product;
  }

  async findProductBySku(sku: string, user?: CurrentUserDto) {
    const product = await this.productRepo.findOne({
      where: { sku, deletedAt: IsNull() as any },
      relations: ['category', 'segment', 'brand', 'uom', 'gstRate'],
    });
    if (!product) throw new NotFoundException('Product not found');
    this.validateAccess(user, product, 'Product');
    return product;
  }

  async createProduct(dto: CreateProductDto, userId?: string, user?: CurrentUserDto) {
    // Generate SKU if not provided
    let sku = dto.sku || dto.productCode;
    if (!sku) {
      const category = await this.categoryRepo.findOne({ where: { categoryId: dto.categoryId } });
      const segment = await this.segmentRepo.findOne({ where: { segmentId: dto.segmentId } });
      const group = await this.groupRepo.findOne({ where: { groupId: dto.groupId } });

      if (!category || !segment || !group) {
        throw new BadRequestException('Category, Segment, and Group are required for SKU generation');
      }

      sku = await this.generateSkuLegacy(
        category.categoryCode,
        segment.segmentCode,
        group.groupCode,
      );
    }

    const companyId = this.tenantService.getCompanyId(user);
    
    let purchasePersonName = dto.purchasePersonName;
    if (dto.purchasePersonId && !purchasePersonName) {
      try {
        const u = await this.dataSource.getRepository('users').findOne({ where: { userId: dto.purchasePersonId } });
        if (u) {
          purchasePersonName = u.name;
        }
      } catch (e) {
        console.error('Failed to resolve purchase person name:', e);
      }
    }

    const product = this.productRepo.create({
      ...dto,
      unitBasis: dto.unitBasis as any,
      productCode: dto.productCode || sku,
      packingSize: dto.packingSize ? Number(dto.packingSize) : undefined,
      stockStatus: dto.stockStatus as any,
      sku,
      purchasePersonName,
      createdBy: userId,
      companyId,
    });
    const savedProduct = await this.productRepo.save(product);

    // Auto-update pending items across Sales, Purchase, and Rate Analysis
    try {
      const category = await this.categoryRepo.findOne({ where: { categoryId: savedProduct.categoryId } });
      const categoryName = category?.categoryName || '';
      const brand = await this.brandRepo.findOne({ where: { brandId: savedProduct.brandId } });
      const brandName = brand?.brandName || '';
      let gstPercent: number | undefined;
      if (savedProduct.gstRateId) {
        const gst = await this.gstRepo.findOne({ where: { gstRateId: savedProduct.gstRateId } });
        if (gst) gstPercent = Number(gst.gstPercent);
      }

      const enquiryItemSet: any = {
        productId: savedProduct.productId,
        sku: savedProduct.sku,
        productCode: savedProduct.sku,
        categoryId: savedProduct.categoryId,
        categoryName,
        brandId: savedProduct.brandId,
        brandName,
        unitSize: savedProduct.unitSize,
        unitPerCarton: savedProduct.unitsPerCase || savedProduct.unitsPerCarton || undefined,
        cbmPerBox: savedProduct.cbmPerBox || undefined,
        isManualEntry: false,
        masterStatus: 'master_product',
      };
      if (savedProduct.mrp) enquiryItemSet.mrp = Number(savedProduct.mrp);
      if (savedProduct.buyingPrice) enquiryItemSet.buyingPrice = Number(savedProduct.buyingPrice);
      if (savedProduct.landingCost) enquiryItemSet.landingCost = Number(savedProduct.landingCost);
      if (savedProduct.landingCost || savedProduct.buyingPrice) {
        enquiryItemSet.expectedRate = Number(savedProduct.landingCost || savedProduct.buyingPrice);
      }
      if (gstPercent !== undefined) enquiryItemSet.gstPercent = gstPercent;

      await this.dataSource.createQueryBuilder()
        .update('sales_enquiry_items')
        .set(enquiryItemSet)
        .where('LOWER(TRIM(productName)) = LOWER(TRIM(:pname))', { pname: savedProduct.productName })
        .execute();

      await this.dataSource.createQueryBuilder()
        .update('purchase_quote_items')
        .set({
          productId: savedProduct.productId,
          sku: savedProduct.sku,
          categoryName,
          brandName,
          unitSize: savedProduct.unitSize,
        })
        .where('LOWER(TRIM(productName)) = LOWER(TRIM(:pname))', { pname: savedProduct.productName })
        .execute();

      const priceAnalysisSet: any = {
        sku: savedProduct.sku,
        productCode: savedProduct.sku,
        categoryId: savedProduct.categoryId,
        categoryName,
        brandId: savedProduct.brandId,
        brandName,
        unitSize: savedProduct.unitSize,
        unitsPerCase: savedProduct.unitsPerCase || savedProduct.unitsPerCarton || undefined,
        cbmPerBox: savedProduct.cbmPerBox || undefined,
      };
      if (savedProduct.mrp) priceAnalysisSet.mrp = Number(savedProduct.mrp);
      if (savedProduct.buyingPrice) priceAnalysisSet.buyingPrice = Number(savedProduct.buyingPrice);
      if (savedProduct.landingCost || savedProduct.buyingPrice) {
        priceAnalysisSet.buyingBestLandingRate = Number(savedProduct.landingCost || savedProduct.buyingPrice);
        priceAnalysisSet.landingCost = Number(savedProduct.landingCost || savedProduct.buyingPrice);
      }
      if (gstPercent !== undefined) priceAnalysisSet.gstPercent = gstPercent;

      await this.dataSource.createQueryBuilder()
        .update('price_analysis_items')
        .set(priceAnalysisSet)
        .where('LOWER(TRIM(productName)) = LOWER(TRIM(:pname))', { pname: savedProduct.productName })
        .execute();

      // Soft delete / archive matching TEMP- products
      await this.dataSource.createQueryBuilder()
        .update('products')
        .set({
          deletedAt: new Date(),
          isActive: false,
        })
        .where('(sku LIKE \'TEMP-%\' OR source = \'manual\') AND LOWER(TRIM(productName)) = LOWER(TRIM(:pname)) AND productId != :pid', {
          pname: savedProduct.productName,
          pid: savedProduct.productId,
        })
        .execute();
    } catch (e) {
      console.error('Failed to auto-sync created product into pending items:', e);
    }

    return savedProduct;
  }

  async updateProduct(id: string, dto: UpdateProductDto, user?: CurrentUserDto) {
    const product = await this.findProductById(id, user);
    
    let purchasePersonName = dto.purchasePersonName;
    if (dto.purchasePersonId && dto.purchasePersonId !== product.purchasePersonId && !purchasePersonName) {
      try {
        const u = await this.dataSource.getRepository('users').findOne({ where: { userId: dto.purchasePersonId } });
        if (u) {
          purchasePersonName = u.name;
        }
      } catch (e) {
        console.error('Failed to resolve purchase person name:', e);
      }
    } else if (dto.purchasePersonId === product.purchasePersonId && !purchasePersonName) {
      purchasePersonName = product.purchasePersonName;
    }

    Object.assign(product, {
      ...dto,
      ...(purchasePersonName ? { purchasePersonName } : {}),
    });
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string, user?: CurrentUserDto) {
    const product = await this.findProductById(id, user);
    product.deletedAt = new Date();
    await this.productRepo.save(product);
    return { deleted: true };
  }

  async generateSku(
    brandName: string,
    locationName: string,
    productName: string,
    unitSize: string,
    packingSize?: string,
  ): Promise<string> {
    return this.numberSeries.generateSku(brandName, locationName, productName, unitSize, packingSize);
  }

  async generateSkuLegacy(categoryCode: string, segmentCode: string, groupCode: string): Promise<string> {
    return this.numberSeries.generateSku(
      'LEGACY',
      'LEGACY',
      `${categoryCode}-${segmentCode}-${groupCode}`,
      '',
    );
  }

  // ========== PRODUCT REVIEW WORKFLOW ==========
  async getPendingProductReviews(user?: CurrentUserDto) {
    const where = this.getTenantWhere(user, {
      productStatus: ProductStatus.PENDING_REVIEW,
      source: ProductSource.MANUAL,
      deletedAt: IsNull() as any,
    });
    return this.productRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingMisReviews(user?: CurrentUserDto) {
    const { In } = require('typeorm');
    const where = this.getTenantWhere(user, {
      productStatus: In([ProductStatus.PENDING_REVIEW, ProductStatus.PENDING_MIS_REVIEW]),
      deletedAt: IsNull() as any,
    });
    return this.productRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async createManualProduct(
    manualProductName: string,
    enquiryId: string,
    enquiryNo: string,
    userId?: string,
    remarks?: string,
    user?: CurrentUserDto,
  ): Promise<Product> {
    const companyId = this.tenantService.getCompanyId(user);
    const product = this.productRepo.create({
      productName: manualProductName,
      tempProductName: manualProductName,
      source: ProductSource.MANUAL,
      productStatus: ProductStatus.PENDING_REVIEW,
      sourceEnquiryId: enquiryId,
      sourceEnquiryNo: enquiryNo,
      createdBy: userId,
      remarks: remarks,
      companyId,
      sku: 'TEMP-' + Date.now(),
      isActive: false,
    });
    return this.productRepo.save(product);
  }

  async reviewProduct(
    productId: string,
    dto: {
      action: 'map_existing' | 'submit_to_mis';
      existingProductId?: string;
      categoryId?: string;
      brandId?: string;
      vendorId?: string;
      unitSize?: string;
      unitsPerCarton?: number;
      cbmPerBox?: number;
      buyingPrice?: number;
      purchasePersonId?: string;
      remarks?: string;
    },
    userId?: string,
    user?: CurrentUserDto,
  ) {
    const product = await this.findProductById(productId, user);

    if (dto.action === 'map_existing' && dto.existingProductId) {
      const existingProduct = await this.findProductById(dto.existingProductId, user);
      await this.enrichEnquiryItemsWithMasterProduct(productId, dto.existingProductId, existingProduct);
      product.isActive = false;
      await this.productRepo.save(product);
      return { action: 'mapped', existingProduct, message: `Product mapped to ${existingProduct.productName}` };
    }

    product.productStatus = ProductStatus.PENDING_MIS_REVIEW;
    product.reviewedBy = userId;
    product.reviewedAt = new Date();

    if (dto.categoryId) product.categoryId = dto.categoryId;
    if (dto.brandId) product.brandId = dto.brandId;
    if (dto.unitSize) product.unitSize = dto.unitSize;
    if (dto.unitsPerCarton) product.unitsPerCarton = dto.unitsPerCarton;
    if (dto.cbmPerBox) product.cbmPerBox = dto.cbmPerBox;
    if (dto.buyingPrice) product.buyingPrice = dto.buyingPrice;
    
    if (dto.purchasePersonId) {
      product.purchasePersonId = dto.purchasePersonId;
      try {
        const u = await this.dataSource.getRepository('users').findOne({ where: { userId: dto.purchasePersonId } });
        if (u) {
          product.purchasePersonName = u.name;
        }
      } catch (e) {
        console.error('Failed to resolve purchase person name:', e);
      }
    }
    if (dto.remarks) product.remarks = dto.remarks;

    await this.productRepo.save(product);
    return { action: 'submitted_to_mis', product, message: 'Product submitted for MIS review' };
  }

  async misReviewProduct(
    productId: string,
    dto: {
      action: 'approve' | 'reject';
      categoryId?: string;
      segmentId?: string;
      groupId?: string;
      brandId?: string;
      uomId?: string;
      gstRateId?: string;
      unitSize?: string;
      unitsPerCarton?: number;
      cbmPerBox?: number;
      conversionRatio?: number;
      locationId?: string;
      remarks?: string;
    },
    userId?: string,
    user?: CurrentUserDto,
  ) {
    const product = await this.findProductById(productId, user);

    if (dto.action === 'reject') {
      product.productStatus = ProductStatus.INACTIVE;
      product.misReviewedBy = userId;
      product.misReviewedAt = new Date();
      await this.productRepo.save(product);
      return { action: 'rejected', product };
    }

    const category = await this.categoryRepo.findOne({ where: { categoryId: dto.categoryId } });
    const segment = await this.segmentRepo.findOne({ where: { segmentId: dto.segmentId } });
    const group = await this.groupRepo.findOne({ where: { groupId: dto.groupId } });

    if (!category || !segment || !group) {
      throw new BadRequestException('Category, Segment, and Group are required for SKU generation');
    }

    const sku = await this.generateSkuLegacy(category.categoryCode, segment.segmentCode, group.groupCode);

    product.productStatus = ProductStatus.ACTIVE;
    product.source = ProductSource.MASTER;
    product.sku = sku;
    product.tempProductName = null;

    if (dto.categoryId) product.categoryId = dto.categoryId;
    if (dto.segmentId) product.segmentId = dto.segmentId;
    if (dto.groupId) product.groupId = dto.groupId;
    if (dto.brandId) product.brandId = dto.brandId;
    if (dto.uomId) product.uomId = dto.uomId;
    if (dto.gstRateId) product.gstRateId = dto.gstRateId;
    if (dto.unitSize) product.unitSize = dto.unitSize;
    if (dto.unitsPerCarton) product.unitsPerCarton = dto.unitsPerCarton;
    if (dto.cbmPerBox) product.cbmPerBox = dto.cbmPerBox;
    if (dto.conversionRatio) product.conversionRatio = dto.conversionRatio;
    if (dto.locationId) product.locationId = dto.locationId;
    if (dto.remarks) product.remarks = dto.remarks;

    product.misReviewedBy = userId;
    product.misReviewedAt = new Date();
    product.isActive = true;

    const savedProduct = await this.productRepo.save(product);
    await this.enrichEnquiryItemsWithMasterProduct(productId, productId, savedProduct);

    return { action: 'approved', product: savedProduct, message: `Product approved with SKU: ${sku}` };
  }

  private async enrichEnquiryItemsWithMasterProduct(tempProductId: string, masterProductId: string, masterProduct: Product) {
    // Fetch all items that haven't been enriched yet or need mapping to match the IDs
    const enquiryItems = await this.itemRepo.find();
    
    // Filter matching items in application memory to bypass strict PostgreSQL UUID vs character varying casting
    const matchedItems = enquiryItems.filter(item => 
      item.masterProductId === tempProductId || 
      item.productId === tempProductId ||
      item.masterProductId === masterProductId ||
      item.productId === masterProductId
    );

    let categoryName: string | undefined = undefined;
    let brandName: string | undefined = undefined;

    if (masterProduct.categoryId) {
      const cat = await this.categoryRepo.findOne({ where: { categoryId: masterProduct.categoryId } });
      if (cat) categoryName = cat.categoryName;
    }
    if (masterProduct.brandId) {
      const br = await this.brandRepo.findOne({ where: { brandId: masterProduct.brandId } });
      if (br) brandName = br.brandName;
    }

    for (const item of matchedItems) {
      item.masterProductId = masterProductId;
      item.isEnriched = true;
      item.productId = masterProductId;
      item.masterStatus = ProductMasterStatus.MASTER_PRODUCT;
      if (categoryName) item.categoryName = categoryName;
      if (brandName) item.brandName = brandName;
      if (masterProduct.sku) item.sku = masterProduct.sku;
      if (masterProduct.productName) item.productName = masterProduct.productName;
      if (masterProduct.categoryId) item.categoryId = masterProduct.categoryId;
      if (masterProduct.brandId) item.brandId = masterProduct.brandId;
      if (masterProduct.unitSize) item.unitSize = masterProduct.unitSize;
      if (masterProduct.unitsPerCarton) item.unitPerCarton = masterProduct.unitsPerCarton;
      if (masterProduct.cbmPerBox) item.cbmPerBox = masterProduct.cbmPerBox;
      if (masterProduct.buyingPrice) item.mrp = masterProduct.buyingPrice;
      await this.itemRepo.save(item);
    }
    return matchedItems.length;
  }

  // ========== UOM ==========
  findAllUoms(user?: CurrentUserDto) {
    return this.uomRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any, order: { uomName: 'ASC' } });
  }

  // ========== GST ==========
  findAllGstRates(user?: CurrentUserDto) {
    return this.gstRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any, order: { gstPercent: 'ASC' } });
  }

  // ========== CUSTOMERS ==========
  private normalizeCustomerDto<T extends CreateCustomerDto | UpdateCustomerDto>(dto: T): T {
    const normalized = { ...dto } as any;
    if (normalized.zone && !normalized.productZone) {
      normalized.productZone = normalized.zone;
    }
    delete normalized.zone;
    return normalized;
  }

  private async enrichCustomers(customers: Customer[]): Promise<any[]> {
    const countryIds = [...new Set(customers.map(c => c.countryId).filter(Boolean))];
    const portIds = [...new Set(customers.map(c => c.portOfLoading).filter(Boolean))];

    const [countries, ports] = await Promise.all([
      countryIds.length > 0 ? this.countryRepo.find({ where: { id: In(countryIds) } }) : [],
      portIds.length > 0 ? this.portRepo.find({ where: { id: In(portIds) } }) : [],
    ]);

    const countryMap = new Map(countries.map(c => [c.id, c.name]));
    const portMap = new Map(ports.map(p => [p.id, p.name]));

    return customers.map(c => ({
      ...c,
      country: c.countryId ? countryMap.get(c.countryId) || '' : '',
      portOfLoading: c.portOfLoading ? portMap.get(c.portOfLoading) || c.portOfLoading : '',
    }));
  }

  async findAllCustomers(params: { page?: number; limit?: number; search?: string; zone?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search, zone } = params;
    const where = this.getTenantWhere(user, { deletedAt: IsNull() as any });
    if (zone) where.productZone = zone;
    if (search) {
      where.customerName = ILike(`%${search}%`);
    }
    const result = await this.paginate(this.customerRepo, page, limit, where, { createdAt: 'DESC' }, []);
    result.data = await this.enrichCustomers(result.data);
    return result;
  }

  async findCustomerById(id: string, user?: CurrentUserDto) {
    const customer = await this.customerRepo.findOne({
      where: { customerId: id, deletedAt: IsNull() as any },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    this.validateAccess(user, customer, 'Customer');
    const [enriched] = await this.enrichCustomers([customer]);
    return enriched;
  }

  async generateCustomerBuyerCode() {
    const buyerCode = await this.numberSeries.generateBuyerCode();
    return { buyerCode };
  }

  async findCustomerByBuyerCode(buyerCode: string, user?: CurrentUserDto) {
    const customer = await this.customerRepo.findOne({
      where: { buyerCode, deletedAt: IsNull() as any },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    this.validateAccess(user, customer, 'Customer');
    const [enriched] = await this.enrichCustomers([customer]);
    return enriched;
  }

  async createCustomer(dto: CreateCustomerDto, userId?: string, user?: CurrentUserDto) {
    const customerDto = this.normalizeCustomerDto(dto);
    let buyerCode = customerDto['buyerCode'];
    if (!buyerCode) {
      buyerCode = await this.numberSeries.generateBuyerCode();
    }

    const existing = await this.customerRepo.findOne({ where: { buyerCode } });
    if (existing) {
      throw new BadRequestException(`Buyer code ${buyerCode} already exists`);
    }

    const companyId = this.tenantService.getCompanyId(user);
    const customer = this.customerRepo.create({
      ...customerDto,
      buyerCode,
      customerType: customerDto.customerType as any,
      customerCategory: customerDto.customerCategory as any,
      status: customerDto.status as any,
      createdBy: userId,
      companyId,
    });
    return this.customerRepo.save(customer);
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto, user?: CurrentUserDto) {
    const customer = await this.findCustomerById(id, user);
    Object.assign(customer, this.normalizeCustomerDto(dto));
    return this.customerRepo.save(customer);
  }

  async deleteCustomer(id: string, user?: CurrentUserDto) {
    const customer = await this.findCustomerById(id, user);
    customer.deletedAt = new Date();
    await this.customerRepo.save(customer);
    return { deleted: true };
  }

  // ========== VENDORS ==========
  private async ensureVendorTable() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        "vendorId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" VARCHAR(100),
        "vendorCode" VARCHAR(100) UNIQUE NOT NULL,
        "vendorName" VARCHAR(255) NOT NULL,
        "contactPerson" VARCHAR(255),
        "email" VARCHAR(255),
        "phone" VARCHAR(50),
        "address" TEXT,
        "city" VARCHAR(100),
        "country" VARCHAR(100),
        "gstNumber" VARCHAR(100),
        "fssaiNumber" VARCHAR(100),
        "bankName" VARCHAR(255),
        "bankAccountNo" VARCHAR(100),
        "bankIfsc" VARCHAR(50),
        "category" VARCHAR(255),
        "productsSupplied" TEXT,
        "paymentTerms" VARCHAR(255),
        "purchasePerson" VARCHAR(255),
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP NULL
      )
    `);
    await this.dataSource.query(`
      ALTER TABLE vendors
        ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "contactPerson" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "address" TEXT,
        ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "country" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "gstNumber" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "fssaiNumber" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "bankName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "bankAccountNo" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "bankIfsc" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "category" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "productsSupplied" TEXT,
        ADD COLUMN IF NOT EXISTS "paymentTerms" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "purchasePerson" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL
    `);
    await this.dataSource.query(`ALTER TABLE vendors ALTER COLUMN "category" TYPE VARCHAR(255)`);

  }

  private mapVendor(row: any) {
    return {
      ...row,
      id: row.vendorId,
      vendorId: row.vendorId,
      name: row.vendorName,
      code: row.vendorCode,
      productCategory: row.productCategory || row.category,
    };
  }

  async findAllVendors(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    await this.ensureVendorTable();
    const { page = 1, limit = 20, search } = params;
    const offset = (page - 1) * limit;
    const companyId = this.tenantService.getCompanyId(user);
    const values: any[] = [];
    const conditions = [`"deletedAt" IS NULL`, `"isActive" = TRUE`];

    if (companyId) {
      values.push(companyId);
      conditions.push(`("companyId" = $${values.length} OR "companyId" IS NULL)`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`("vendorName" ILIKE $${values.length} OR "vendorCode" ILIKE $${values.length} OR "email" ILIKE $${values.length} OR "phone" ILIKE $${values.length} OR "gstNumber" ILIKE $${values.length} OR "fssaiNumber" ILIKE $${values.length} OR "category" ILIKE $${values.length} OR "productsSupplied" ILIKE $${values.length} OR "paymentTerms" ILIKE $${values.length} OR "purchasePerson" ILIKE $${values.length})`);
    }

    const whereSql = conditions.join(' AND ');
    const totalRows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM vendors WHERE ${whereSql}`, values);
    const dataValues = [...values, limit, offset];
    const rows = await this.dataSource.query(
      `SELECT * FROM vendors WHERE ${whereSql} ORDER BY "createdAt" DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues,
    );

    return {
      data: rows.map((row: any) => this.mapVendor(row)),
      total: Number(totalRows[0]?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalRows[0]?.count || 0) / limit),
    };
  }

  async findVendorById(id: string, user?: CurrentUserDto) {
    await this.ensureVendorTable();
    const companyId = this.tenantService.getCompanyId(user);
    const params = [id];
    let companySql = '';
    if (companyId) {
      params.push(companyId);
      companySql = ` AND ("companyId" = $2 OR "companyId" IS NULL)`;
    }
    const rows = await this.dataSource.query(
      `SELECT * FROM vendors WHERE "vendorId" = $1 AND "deletedAt" IS NULL${companySql} LIMIT 1`,
      params,
    );
    if (!rows[0]) throw new NotFoundException('Vendor not found');
    return this.mapVendor(rows[0]);
  }

  async createVendor(dto: CreateVendorDto, user?: CurrentUserDto) {
    await this.ensureVendorTable();
    const companyId = this.tenantService.getCompanyId(user);
    const [{ next }] = await this.dataSource.query(`SELECT COUNT(*)::int + 1 AS next FROM vendors`);
    const vendorCode = `VND-${String(next).padStart(3, '0')}`;
    const productCategory = dto.productCategory || dto.category || null;
    const rows = await this.dataSource.query(
      `INSERT INTO vendors ("companyId", "vendorCode", "vendorName", "contactPerson", "email", "phone", "address", "city", "country", "gstNumber", "fssaiNumber", "bankName", "bankAccountNo", "bankIfsc", "category", "productsSupplied", "paymentTerms", "purchasePerson")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        companyId || null,
        vendorCode,
        dto.vendorName,
        dto.contactPerson || null,
        dto.email || null,
        dto.phone || null,
        dto.address || null,
        dto.city || null,
        dto.country || null,
        dto.gstNumber || null,
        dto.fssaiNumber || null,
        dto.bankName || null,
        dto.bankAccountNo || null,
        dto.bankIfsc || null,
        productCategory,
        dto.productsSupplied || null,
        dto.paymentTerms || null,
        dto.purchasePerson || null,
      ],
    );
    return this.mapVendor(rows[0]);
  }

  async updateVendor(id: string, dto: UpdateVendorDto, user?: CurrentUserDto) {
    await this.findVendorById(id, user);
    const patch = { ...dto } as any;
    if (patch.productCategory !== undefined && patch.category === undefined) {
      patch.category = patch.productCategory;
    }
    delete patch.productCategory;
    const fields = ['vendorName', 'contactPerson', 'email', 'phone', 'address', 'city', 'country', 'gstNumber', 'fssaiNumber', 'bankName', 'bankAccountNo', 'bankIfsc', 'category', 'productsSupplied', 'paymentTerms', 'purchasePerson', 'isActive'];
    const sets: string[] = [];
    const values: any[] = [];
    for (const field of fields) {
      if (patch[field] !== undefined) {
        values.push(patch[field]);
        sets.push(`"${field}" = $${values.length}`);
      }
    }
    if (!sets.length) return this.findVendorById(id, user);
    values.push(id);
    const rows = await this.dataSource.query(
      `UPDATE vendors SET ${sets.join(', ')}, "updatedAt" = now() WHERE "vendorId" = $${values.length} RETURNING *`,
      values,
    );
    const row = Array.isArray(rows[0]) ? rows[0][0] : rows[0];
    return this.mapVendor(row);
  }

  async deleteVendor(id: string, user?: CurrentUserDto) {
    await this.findVendorById(id, user);
    await this.dataSource.query(`UPDATE vendors SET "deletedAt" = now(), "isActive" = FALSE WHERE "vendorId" = $1`, [id]);
    return { deleted: true };
  }


  // ========== ZONES ==========
  findAllZones(user?: CurrentUserDto) {
    return this.zoneRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any });
  }

  // ========== LOCATIONS ==========
  findAllLocations(user?: CurrentUserDto) {
    return this.locationRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any });
  }

  // ========== PAYMENT TERMS ==========
  findAllPaymentTerms(user?: CurrentUserDto) {
    return this.paymentTermsRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any }).then(terms =>
      terms.map(t => ({ ...t, paymentTermsId: t.id, termsName: t.name })));
  }

  findAllCurrencies(user?: CurrentUserDto) {
    return this.currencyRepo.find().then(currencies =>
      currencies.map(c => ({
        ...c,
        currencyId: c.id,
        currencyCode: c.code,
        currencyName: c.name
      })));
  }

  async findAllCurrenciesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where: any = {};
    if (search) {
      return this.paginate(this.currencyRepo, page, limit, [
        { ...where, code: ILike(`%${search}%`) },
        { ...where, name: ILike(`%${search}%`) },
      ] as any, { code: 'ASC' });
    }
    return this.paginate(this.currencyRepo, page, limit, where, { code: 'ASC' });
  }

  async createCurrency(dto: any, user?: CurrentUserDto) {
    const currency = this.currencyRepo.create(dto);
    return this.currencyRepo.save(currency);
  }

  async updateCurrency(id: string, dto: any, user?: CurrentUserDto) {
    const currency = await this.currencyRepo.findOne({ where: { id } });
    if (!currency) throw new NotFoundException('Currency not found');
    Object.assign(currency, dto);
    return this.currencyRepo.save(currency);
  }

  async deleteCurrency(id: string, user?: CurrentUserDto) {
    const currency = await this.currencyRepo.findOne({ where: { id } });
    if (!currency) throw new NotFoundException('Currency not found');
    await this.currencyRepo.remove(currency);
    return { deleted: true };
  }

  // ========== CURRENCY RATES ==========
  findAllCurrencyRates(user?: CurrentUserDto) {
    const where = this.getTenantWhere(user, {});
    return this.currencyRateRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ========== ZONES CRUD ==========
  async findAllZonesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const whereArr = this.getTenantOrSharedWhere(user, { isActive: true });
    if (search) whereArr.forEach(w => w.name = ILike(`%${search}%`));
    return this.paginate(this.zoneRepo, page, limit, whereArr as any, { name: 'ASC' });
  }

  async createZone(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const zone = this.zoneRepo.create({ ...dto, ...where });
    return this.zoneRepo.save(zone);
  }

  async updateZone(id: string, dto: any, user?: CurrentUserDto) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    this.validateAccess(user, zone, 'Zone');
    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  async deleteZone(id: string, user?: CurrentUserDto) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    this.validateAccess(user, zone, 'Zone');
    await this.zoneRepo.remove(zone);
    return { deleted: true };
  }

  // ========== LOCATIONS CRUD ==========
  async findAllLocationsPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const whereArr = this.getTenantOrSharedWhere(user, { isActive: true });
    if (search) whereArr.forEach(w => w.name = ILike(`%${search}%`));
    return this.paginate(this.locationRepo, page, limit, whereArr as any, { name: 'ASC' });
  }

  async createLocation(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const location = this.locationRepo.create({ ...dto, ...where });
    return this.locationRepo.save(location);
  }

  async updateLocation(id: string, dto: any, user?: CurrentUserDto) {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    this.validateAccess(user, location, 'Location');
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async deleteLocation(id: string, user?: CurrentUserDto) {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    this.validateAccess(user, location, 'Location');
    await this.locationRepo.remove(location);
    return { deleted: true };
  }

  // ========== PAYMENT TERMS CRUD ==========
  async findAllPaymentTermsPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const whereArr = this.getTenantOrSharedWhere(user, { isActive: true });
    if (search) whereArr.forEach(w => w.name = ILike(`%${search}%`));
    return this.paginate(this.paymentTermsRepo, page, limit, whereArr as any, { days: 'ASC' });
  }

  async createPaymentTerm(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const paymentTerm = this.paymentTermsRepo.create({ ...dto, ...where });
    return this.paymentTermsRepo.save(paymentTerm);
  }

  async updatePaymentTerm(id: string, dto: any, user?: CurrentUserDto) {
    const paymentTerm = await this.paymentTermsRepo.findOne({ where: { id } });
    if (!paymentTerm) throw new NotFoundException('Payment term not found');
    this.validateAccess(user, paymentTerm, 'Payment term');
    Object.assign(paymentTerm, dto);
    return this.paymentTermsRepo.save(paymentTerm);
  }

  async deletePaymentTerm(id: string, user?: CurrentUserDto) {
    const paymentTerm = await this.paymentTermsRepo.findOne({ where: { id } });
    if (!paymentTerm) throw new NotFoundException('Payment term not found');
    this.validateAccess(user, paymentTerm, 'Payment term');
    await this.paymentTermsRepo.remove(paymentTerm);
    return { deleted: true };
  }

  // ========== GST RATES CRUD ==========
  async findAllGstRatesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) where.gstName = ILike(`%${search}%`);
    return this.paginate(this.gstRepo, page, limit, where, { gstPercent: 'ASC' });
  }

  async createGstRate(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const gstRate = this.gstRepo.create({ ...dto, ...where });
    return this.gstRepo.save(gstRate);
  }

  async updateGstRate(id: string, dto: any, user?: CurrentUserDto) {
    const gstRate = await this.gstRepo.findOne({ where: { gstRateId: id } });
    if (!gstRate) throw new NotFoundException('GST rate not found');
    this.validateAccess(user, gstRate, 'GST rate');
    Object.assign(gstRate, dto);
    return this.gstRepo.save(gstRate);
  }

  async deleteGstRate(id: string, user?: CurrentUserDto) {
    const gstRate = await this.gstRepo.findOne({ where: { gstRateId: id } });
    if (!gstRate) throw new NotFoundException('GST rate not found');
    this.validateAccess(user, gstRate, 'GST rate');
    await this.gstRepo.remove(gstRate);
    return { deleted: true };
  }

  // ========== PORTS CRUD ==========
  async findAllPorts(user?: CurrentUserDto) {
    const ports = await this.portRepo.find({ where: this.getTenantOrSharedWhere(user, { isActive: true }) as any, order: { name: 'ASC' } });
    return ports.map(p => ({ ...p, portId: p.id, portName: p.name, portCode: p.code }));
  }

  async findAllPortsPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const whereArr = this.getTenantOrSharedWhere(user, { isActive: true });
    if (search) {
      whereArr.forEach(w => w.name = ILike(`%${search}%`));
    }
    return this.paginate(this.portRepo, page, limit, whereArr as any, { name: 'ASC' });
  }

  async createPort(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const port = this.portRepo.create({ ...dto, ...where });
    return this.portRepo.save(port);
  }

  async updatePort(id: string, dto: any, user?: CurrentUserDto) {
    const port = await this.portRepo.findOne({ where: { id } });
    if (!port) throw new NotFoundException('Port not found');
    this.validateAccess(user, port, 'Port');
    Object.assign(port, dto);
    return this.portRepo.save(port);
  }

  async deletePort(id: string, user?: CurrentUserDto) {
    const port = await this.portRepo.findOne({ where: { id } });
    if (!port) throw new NotFoundException('Port not found');
    this.validateAccess(user, port, 'Port');
    await this.portRepo.remove(port);
    return { deleted: true };
  }

  // ========== UOM CRUD ==========
  async findAllUomsPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) where.uomName = ILike(`%${search}%`);
    return this.paginate(this.uomRepo, page, limit, where, { uomName: 'ASC' });
  }

  async createUom(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const uom = this.uomRepo.create({ ...dto, ...where });
    return this.uomRepo.save(uom);
  }

  async updateUom(id: string, dto: any, user?: CurrentUserDto) {
    const uom = await this.uomRepo.findOne({ where: { uomId: id } });
    if (!uom) throw new NotFoundException('UOM not found');
    this.validateAccess(user, uom, 'UOM');
    Object.assign(uom, dto);
    return this.uomRepo.save(uom);
  }

  async deleteUom(id: string, user?: CurrentUserDto) {
    const uom = await this.uomRepo.findOne({ where: { uomId: id } });
    if (!uom) throw new NotFoundException('UOM not found');
    this.validateAccess(user, uom, 'UOM');
    await this.uomRepo.remove(uom);
    return { deleted: true };
  }

  // ========== FREIGHT RATES CRUD ==========
  async findAllFreightRates(user?: CurrentUserDto) {
    const where = this.getTenantWhere(user, { isActive: true });
    return this.freightRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findAllFreightRatesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) where.name = ILike(`%${search}%`);
    return this.paginate(this.freightRepo, page, limit, where, { createdAt: 'DESC' });
  }

  async createFreightRate(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const freight = this.freightRepo.create({ ...dto, ...where });
    return this.freightRepo.save(freight);
  }

  async updateFreightRate(id: string, dto: any, user?: CurrentUserDto) {
    const freight = await this.freightRepo.findOne({ where: { id } });
    if (!freight) throw new NotFoundException('Freight rate not found');
    this.validateAccess(user, freight, 'Freight rate');
    Object.assign(freight, dto);
    return this.freightRepo.save(freight);
  }

  async deleteFreightRate(id: string, user?: CurrentUserDto) {
    const freight = await this.freightRepo.findOne({ where: { id } });
    if (!freight) throw new NotFoundException('Freight rate not found');
    this.validateAccess(user, freight, 'Freight rate');
    await this.freightRepo.remove(freight);
    return { deleted: true };
  }

  // ========== HAULAGE CRUD ==========
  async findAllHaulage(user?: CurrentUserDto) {
    const where = this.getTenantWhere(user, { isActive: true });
    return this.haulageRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findAllHaulagePaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where = this.getTenantWhere(user, { isActive: true });
    if (search) (where as any).location = ILike(`%${search}%`);
    return this.paginate(this.haulageRepo, page, limit, where, { createdAt: 'DESC' });
  }


  async createHaulage(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const haulage = this.haulageRepo.create({ ...dto, ...where });
    return this.haulageRepo.save(haulage);
  }

  async updateHaulage(id: string, dto: any, user?: CurrentUserDto) {
    const haulage = await this.haulageRepo.findOne({ where: { id } });
    if (!haulage) throw new NotFoundException('Haulage charge not found');
    this.validateAccess(user, haulage, 'Haulage charge');
    Object.assign(haulage, dto);
    return this.haulageRepo.save(haulage);
  }

  async deleteHaulage(id: string, user?: CurrentUserDto) {
    const haulage = await this.haulageRepo.findOne({ where: { id } });
    if (!haulage) throw new NotFoundException('Haulage charge not found');
    this.validateAccess(user, haulage, 'Haulage charge');
    await this.haulageRepo.remove(haulage);
    return { deleted: true };
  }

  // ========== PACKING ==========
  private async ensurePackingTable() {
    await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS packing_master (
        "packingId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "companyId" VARCHAR(100),
        "packingCode" VARCHAR(160) UNIQUE NOT NULL,
        "packingName" VARCHAR(255) NOT NULL,
        "packingType" VARCHAR(100),
        "material" VARCHAR(255),
        "unitSize" VARCHAR(100),
        "unitsPerCase" NUMERIC(18, 3),
        "cbmPerBox" NUMERIC(18, 4),
        "weightKg" NUMERIC(18, 3),
        "dimensions" VARCHAR(255),
        "uom" VARCHAR(50),
        "size" VARCHAR(100),
        "purchasePersonName" VARCHAR(255),
        "vendorName" VARCHAR(255),
        "notes" TEXT,
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT now(),
        "updatedAt" TIMESTAMP DEFAULT now(),
        "deletedAt" TIMESTAMP NULL
      )
    `);
    await this.dataSource.query(`
      ALTER TABLE packing_master
        ADD COLUMN IF NOT EXISTS "companyId" VARCHAR(100),
        ALTER COLUMN "packingCode" TYPE VARCHAR(160),
        ADD COLUMN IF NOT EXISTS "packingType" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "material" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "unitSize" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "unitsPerCase" NUMERIC(18, 3),
        ADD COLUMN IF NOT EXISTS "cbmPerBox" NUMERIC(18, 4),
        ADD COLUMN IF NOT EXISTS "weightKg" NUMERIC(18, 3),
        ADD COLUMN IF NOT EXISTS "dimensions" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "uom" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "size" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "purchasePersonName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "vendorName" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "notes" TEXT,
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL
    `);
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS idx_packing_master_company ON packing_master("companyId");
      CREATE INDEX IF NOT EXISTS idx_packing_master_type ON packing_master("packingType");
    `);

    await this.dataSource.query(`
      UPDATE packing_master
      SET "deletedAt" = now(), "isActive" = FALSE, "updatedAt" = now()
      WHERE "packingCode" IN ('PKG-001', 'PKG-002', 'PKG-003')
        AND "packingName" IN ('Standard 12 Pcs Carton', 'Standard 24 Pcs Carton', 'Tin 12 Pcs Carton')
        AND "deletedAt" IS NULL
    `);
  }

  private mapPacking(row: any) {
    return {
      ...row,
      id: row.packingId,
      packingId: row.packingId,
      name: row.packingName,
      code: row.packingCode,
      unitsPerCase: row.unitsPerCase !== null ? Number(row.unitsPerCase) : null,
      cbmPerBox: row.cbmPerBox !== null ? Number(row.cbmPerBox) : null,
      weightKg: row.weightKg !== null ? Number(row.weightKg) : null,
    };
  }

  async findAllPacking(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    await this.ensurePackingTable();
    const { page = 1, limit = 20, search } = params;
    const offset = (page - 1) * limit;
    const companyId = this.tenantService.getCompanyId(user);
    const values: any[] = [];
    const conditions = [`"deletedAt" IS NULL`, `"isActive" = TRUE`];

    if (companyId) {
      values.push(companyId);
      conditions.push(`("companyId" = $${values.length} OR "companyId" IS NULL)`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`("packingName" ILIKE $${values.length} OR "packingCode" ILIKE $${values.length} OR "packingType" ILIKE $${values.length} OR "material" ILIKE $${values.length} OR "purchasePersonName" ILIKE $${values.length} OR "vendorName" ILIKE $${values.length})`);
    }

    const whereSql = conditions.join(' AND ');
    const totalRows = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM packing_master WHERE ${whereSql}`, values);
    const rows = await this.dataSource.query(
      `SELECT * FROM packing_master WHERE ${whereSql} ORDER BY "createdAt" DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );

    return {
      data: rows.map((row: any) => this.mapPacking(row)),
      total: Number(totalRows[0]?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(totalRows[0]?.count || 0) / limit),
    };
  }

  async findPackingById(id: string, user?: CurrentUserDto) {
    await this.ensurePackingTable();
    const companyId = this.tenantService.getCompanyId(user);
    const params = [id];
    let companySql = '';
    if (companyId) {
      params.push(companyId);
      companySql = ` AND ("companyId" = $2 OR "companyId" IS NULL)`;
    }
    const rows = await this.dataSource.query(
      `SELECT * FROM packing_master WHERE "packingId" = $1 AND "deletedAt" IS NULL${companySql} LIMIT 1`,
      params,
    );
    if (!rows[0]) throw new NotFoundException('Packing master not found');
    return this.mapPacking(rows[0]);
  }

  private generatePackingCode(dto: CreatePackingDto, serial: number): string {
    const typeMap: Record<string, string> = {
      'Pouch': 'PO', 'Jar': 'JAR', 'Pre-Printed-Pouch': 'PPP', 'Pre-Printed-Box': 'PPB',
      'Box': 'BOX', 'Glass Bottle': 'GB', 'Tin Pack': 'TP', 'Tray': 'TRY',
      'Printed Mono Carton': 'PMC', 'Carton': 'CTN', 'TUB': 'TUB', 'PET': 'PET',
      'HDPE JAR': 'HJ', 'Plastic Box': 'PB', 'Others': 'OTH',
      'Branded': 'BR', 'Pvt Label': 'PVT',
    };
    const unitMap: Record<string, string> = {
      'gram': 'GM', 'kilogram': 'KG', 'ton': 'T', 'gm': 'GM', 'g': 'GM',
      'kg': 'KG', 't': 'T', 'ml': 'ML', 'ltr': 'LTR', 'pcs': 'PCS',
    };

    const typeShort = typeMap[dto.packingType || ''] || (dto.packingType || 'OTH').substring(0, 3).toUpperCase();
    const nameSlug = (dto.packingName || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');

    let unitPart = '';
    if (dto.unitSize) {
      const match = dto.unitSize.trim().match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        const unitShort = unitMap[match[2].trim().toLowerCase()] || match[2].trim().toUpperCase().substring(0, 3);
        unitPart = `${match[1]}${unitShort}`;
      } else {
        unitPart = dto.unitSize.toUpperCase().replace(/\s+/g, '');
      }
    }

    const packPart = dto.unitsPerCase != null ? String(dto.unitsPerCase) : '';
    const serialStr = `P${String(serial).padStart(5, '0')}`;

    const parts = ['KOI', typeShort, nameSlug, unitPart, packPart, serialStr].filter(Boolean);
    return parts.join('-').substring(0, 160);
  }

  async createPacking(dto: CreatePackingDto, user?: CurrentUserDto) {
    await this.ensurePackingTable();
    const companyId = this.tenantService.getCompanyId(user);
    const [{ next }] = await this.dataSource.query(`SELECT COUNT(*)::int + 1 AS next FROM packing_master`);
    const packingCode = dto.packingCode?.trim() || this.generatePackingCode(dto, Number(next));
    const rows = await this.dataSource.query(
      `INSERT INTO packing_master (
        "companyId", "packingCode", "packingName", "packingType", "material",
        "unitSize", "unitsPerCase", "cbmPerBox", "weightKg", "dimensions",
        "uom", "size", "purchasePersonName", "vendorName", "notes"
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        companyId || null,
        packingCode,
        dto.packingName,
        dto.packingType || null,
        dto.material || null,
        dto.unitSize || null,
        dto.unitsPerCase ?? null,
        dto.cbmPerBox ?? null,
        dto.weightKg ?? null,
        dto.dimensions || null,
        dto.uom || null,
        dto.size || null,
        dto.purchasePersonName || null,
        dto.vendorName || null,
        dto.notes || null,
      ],
    );
    return this.mapPacking(rows[0]);
  }

  async updatePacking(id: string, dto: UpdatePackingDto, user?: CurrentUserDto) {
    await this.findPackingById(id, user);
    const fields = ['packingCode', 'packingName', 'packingType', 'material', 'unitSize', 'unitsPerCase', 'cbmPerBox', 'weightKg', 'dimensions', 'uom', 'size', 'purchasePersonName', 'vendorName', 'notes', 'isActive'];
    const sets: string[] = [];
    const values: any[] = [];
    for (const field of fields) {
      if ((dto as any)[field] !== undefined) {
        values.push((dto as any)[field]);
        sets.push(`"${field}" = $${values.length}`);
      }
    }
    if (!sets.length) return this.findPackingById(id, user);
    values.push(id);
    const rows = await this.dataSource.query(
      `UPDATE packing_master SET ${sets.join(', ')}, "updatedAt" = now() WHERE "packingId" = $${values.length} RETURNING *`,
      values,
    );
    const row = Array.isArray(rows[0]) ? rows[0][0] : rows[0];
    return this.mapPacking(row);
  }

  async deletePacking(id: string, user?: CurrentUserDto) {
    await this.findPackingById(id, user);
    await this.dataSource.query(`DELETE FROM packing_master WHERE "packingId" = $1`, [id]);
    return { deleted: true };
  }

  async findAllCountries(user?: CurrentUserDto) {
    const countries = await this.countryRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return countries.map(c => ({
      ...c,
      countryId: c.id,
      countryName: c.name,
      countryCode: c.code
    }));
  }

  async findAllCountriesPaginated(params: { page?: number; limit?: number; search?: string } = {}, user?: CurrentUserDto) {
    const { page = 1, limit = 20, search } = params;
    const where: any = { isActive: true };
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    return this.paginate(this.countryRepo, page, limit, where, { name: 'ASC' });
  }

  async createCountry(dto: any, user?: CurrentUserDto) {
    const country = this.countryRepo.create(dto);
    return this.countryRepo.save(country);
  }

  async updateCountry(id: string, dto: any, user?: CurrentUserDto) {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new NotFoundException('Country not found');
    Object.assign(country, dto);
    return this.countryRepo.save(country);
  }

  async deleteCountry(id: string, user?: CurrentUserDto) {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new NotFoundException('Country not found');
    await this.countryRepo.remove(country);
    return { deleted: true };
  }

  async createCurrencyRate(dto: any, user?: CurrentUserDto) {
    const where = this.getTenantWhere(user);
    const rate = this.currencyRateRepo.create({ ...dto, ...where });
    return this.currencyRateRepo.save(rate);
  }

  async updateCurrencyRate(id: string, dto: any, user?: CurrentUserDto) {
    const rate = await this.currencyRateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Currency rate not found');
    this.validateAccess(user, rate, 'CurrencyRate');
    Object.assign(rate, dto);
    return this.currencyRateRepo.save(rate);
  }

  async deleteCurrencyRate(id: string, user?: CurrentUserDto) {
    const rate = await this.currencyRateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Currency rate not found');
    this.validateAccess(user, rate, 'CurrencyRate');
    return this.currencyRateRepo.remove(rate);
  }
}
