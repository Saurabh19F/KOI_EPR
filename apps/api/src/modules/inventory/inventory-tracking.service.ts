import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Between, LessThanOrEqual, MoreThanOrEqual, MoreThan, In } from 'typeorm';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { InventoryBatch, BatchStatus } from './entities/batch.entity';
import { Product } from '../masters/entities/product.entity';
import { PaginatedResult } from '../../common/types';

export interface BatchFilters {
  productId?: string;
  warehouseId?: string;
  status?: BatchStatus;
  expiringInDays?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StockReportFilters {
  warehouseId?: string;
  categoryId?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  includeZeroStock?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class InventoryTrackingService {
  constructor(
    @InjectRepository(InventoryStock)
    private stockRepo: Repository<InventoryStock>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
    @InjectRepository(InventoryBatch)
    private batchRepo: Repository<InventoryBatch>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  // ========== WAREHOUSE MANAGEMENT ==========

  async findAllWarehouses(): Promise<Warehouse[]> {
    return this.warehouseRepo.find({ order: { isDefault: 'DESC', name: 'ASC' } });
  }

  async findWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = this.warehouseRepo.create(data);
    return this.warehouseRepo.save(warehouse);
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findWarehouseById(id);
    Object.assign(warehouse, data);
    return this.warehouseRepo.save(warehouse);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const warehouse = await this.findWarehouseById(id);
    const stockCount = await this.stockRepo.count({ where: { warehouseId: id } });
    if (stockCount > 0) {
      throw new BadRequestException('Cannot delete warehouse with existing stock');
    }
    await this.warehouseRepo.remove(warehouse);
  }

  // ========== BATCH MANAGEMENT ==========

  async createBatch(data: Partial<InventoryBatch>): Promise<InventoryBatch> {
    // Check for duplicate batch number
    const existing = await this.batchRepo.findOne({
      where: { productId: data.productId, batchNumber: data.batchNumber },
    });
    if (existing) {
      throw new BadRequestException(`Batch ${data.batchNumber} already exists for this product`);
    }

    const batch = this.batchRepo.create({
      ...data,
      quantity: data.quantity || 0,
      availableQuantity: data.quantity || 0,
      status: BatchStatus.ACTIVE,
    });
    return this.batchRepo.save(batch);
  }

  async findBatchById(id: string): Promise<InventoryBatch> {
    const batch = await this.batchRepo.findOne({ where: { batchId: id } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async findBatches(filters: BatchFilters): Promise<PaginatedResult<InventoryBatch>> {
    const { productId, warehouseId, status, expiringInDays, search, page = 1, limit = 20 } = filters;

    const queryBuilder = this.batchRepo.createQueryBuilder('batch')
      .where('batch.deletedAt IS NULL');

    if (productId) queryBuilder.andWhere('batch.productId = :productId', { productId });
    if (warehouseId) queryBuilder.andWhere('batch.warehouseId = :warehouseId', { warehouseId });
    if (status) queryBuilder.andWhere('batch.status = :status', { status });
    if (search) {
      queryBuilder.andWhere(
        '(batch.batchNumber ILIKE :search OR batch.productId ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    if (expiringInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiringInDays);
      queryBuilder.andWhere('batch.expiryDate IS NOT NULL AND batch.expiryDate <= :expiryDate', { expiryDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('batch.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateBatchStatus(id: string, status: BatchStatus, remarks?: string): Promise<InventoryBatch> {
    const batch = await this.findBatchById(id);
    batch.status = status;
    if (remarks) batch.remarks = remarks;
    return this.batchRepo.save(batch);
  }

  async getExpiringBatches(warehouseId?: string, daysAhead: number = 30): Promise<InventoryBatch[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const queryBuilder = this.batchRepo.createQueryBuilder('batch')
      .where('batch.status = :status', { status: BatchStatus.ACTIVE })
      .andWhere('batch.expiryDate IS NOT NULL')
      .andWhere('batch.expiryDate <= :expiryDate', { expiryDate })
      .orderBy('batch.expiryDate', 'ASC');

    if (warehouseId) {
      queryBuilder.andWhere('batch.warehouseId = :warehouseId', { warehouseId });
    }

    return queryBuilder.getMany();
  }

  async getBatchByProduct(productId: string, warehouseId?: string): Promise<InventoryBatch[]> {
    const queryBuilder = this.batchRepo.createQueryBuilder('batch')
      .where('batch.productId = :productId', { productId })
      .andWhere('batch.status = :status', { status: BatchStatus.ACTIVE })
      .orderBy('batch.expiryDate', 'ASC'); // FIFO

    if (warehouseId) {
      queryBuilder.andWhere('batch.warehouseId = :warehouseId', { warehouseId });
    }

    return queryBuilder.getMany();
  }

  // ========== STOCK MOVEMENTS ==========

  async recordMovement(
    productId: string,
    warehouseId: string,
    movementType: MovementType,
    quantity: number,
    userId?: string,
    data?: {
      batchId?: string;
      batchNumber?: string;
      referenceType?: string;
      referenceId?: string;
      referenceNo?: string;
      unitCost?: number;
      remarks?: string;
    },
  ): Promise<StockMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update batch if batchId provided
      if (data?.batchId) {
        const batch = await queryRunner.manager.findOne(InventoryBatch, { where: { batchId: data.batchId } });
        if (!batch) throw new NotFoundException('Batch not found');

        const qtyBefore = batch.quantity;
        let qtyAfter: number;

        if ([MovementType.PURCHASE_RECEIPT, MovementType.TRANSFER_IN, MovementType.RETURN_IN, MovementType.ADJUSTMENT_IN].includes(movementType)) {
          qtyAfter = qtyBefore + quantity;
        } else {
          qtyAfter = Math.max(0, qtyBefore - quantity);
        }

        await queryRunner.manager.update(InventoryBatch, data.batchId, {
          quantity: qtyAfter,
          availableQuantity: qtyAfter - batch.reservedQuantity,
          lastMovementDate: new Date(),
        });
      }

      // Update stock summary
      let stock = await queryRunner.manager.findOne(InventoryStock, {
        where: { productId, warehouseId },
      });

      const qtyBefore = stock?.currentStock || 0;
      let qtyAfter: number;

      if ([MovementType.PURCHASE_RECEIPT, MovementType.TRANSFER_IN, MovementType.RETURN_IN, MovementType.ADJUSTMENT_IN].includes(movementType)) {
        qtyAfter = qtyBefore + quantity;
      } else {
        qtyAfter = Math.max(0, qtyBefore - quantity);
      }

      if (stock) {
        stock.currentStock = qtyAfter;
        stock.lastMovementDate = new Date();
        await queryRunner.manager.save(stock);
      } else {
        stock = queryRunner.manager.create(InventoryStock, {
          productId,
          warehouseId,
          sku: '',
          currentStock: qtyAfter,
          lastMovementDate: new Date(),
        });
        await queryRunner.manager.save(stock);
      }

      // Create movement record
      const movement = queryRunner.manager.create(StockMovement, {
        productId,
        warehouseId,
        movementType,
        quantity,
        quantityBefore: qtyBefore,
        quantityAfter: qtyAfter,
        batchId: data?.batchId,
        batchNumber: data?.batchNumber,
        referenceType: data?.referenceType,
        referenceId: data?.referenceId,
        referenceNo: data?.referenceNo,
        unitCost: data?.unitCost,
        remarks: data?.remarks,
        performedBy: userId,
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();
      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getMovements(params: {
    productId?: string;
    warehouseId?: string;
    movementType?: MovementType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<StockMovement>> {
    const { productId, warehouseId, movementType, startDate, endDate, page = 1, limit = 20 } = params;

    const queryBuilder = this.movementRepo.createQueryBuilder('movement')
      .orderBy('movement.createdAt', 'DESC');

    if (productId) queryBuilder.andWhere('movement.productId = :productId', { productId });
    if (warehouseId) queryBuilder.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    if (movementType) queryBuilder.andWhere('movement.movementType = :movementType', { movementType });
    if (startDate && endDate) {
      queryBuilder.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ========== STOCK TRANSFERS ==========

  async transferStock(
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    quantity: number,
    userId?: string,
    referenceId?: string,
  ): Promise<{ out: StockMovement; in: StockMovement }> {
    // Record OUT movement
    const out = await this.recordMovement(productId, fromWarehouseId, MovementType.TRANSFER_OUT, quantity, userId, {
      referenceType: 'transfer',
      referenceId,
    });

    // Record IN movement
    const incomingQuantity = quantity; // Could adjust for losses
    const batch = await this.batchRepo.findOne({
      where: { productId, warehouseId: fromWarehouseId, status: BatchStatus.ACTIVE },
      order: { expiryDate: 'ASC' },
    });

    const batchId = batch?.batchId;
    const batchNumber = batch?.batchNumber;

    const batchIn = await this.batchRepo.findOne({
      where: { productId, warehouseId: toWarehouseId, status: BatchStatus.ACTIVE },
      order: { expiryDate: 'ASC' },
    });

    if (batchIn) {
      // Update existing batch
      await this.batchRepo.update(batchIn.batchId, {
        quantity: batchIn.quantity + incomingQuantity,
        availableQuantity: batchIn.availableQuantity + incomingQuantity,
      });
    } else if (batch) {
      // Create new batch at destination
      await this.batchRepo.save(this.batchRepo.create({
        productId,
        batchNumber: batchNumber || `TRF-${Date.now()}`,
        warehouseId: toWarehouseId,
        quantity: incomingQuantity,
        availableQuantity: incomingQuantity,
        unitCost: batch.unitCost,
        grnId: batch.grnId,
        vendorId: batch.vendorId,
        vendorName: batch.vendorName,
        mfgDate: batch.mfgDate,
        expiryDate: batch.expiryDate,
      }));
    }

    const incoming = await this.recordMovement(productId, toWarehouseId, MovementType.TRANSFER_IN, incomingQuantity, userId, {
      referenceType: 'transfer',
      referenceId,
      batchId,
      batchNumber,
    });

    return { out, in: incoming };
  }

  // ========== STOCK OVERVIEW & REPORTS ==========

  async getStockOverview(filters: StockReportFilters): Promise<PaginatedResult<any>> {
    const { warehouseId, categoryId, stockStatus, includeZeroStock, page = 1, limit = 20 } = filters;

    const queryBuilder = this.stockRepo.createQueryBuilder('stock')
      .leftJoin('products', 'product', 'product.product_id = stock.product_id::uuid')
      .addSelect(['product.product_id', 'product.product_name', 'product.product_code', 'product.category_id']);

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'low_stock':
          queryBuilder.andWhere('stock.currentStock <= stock.reorderLevel AND stock.currentStock > 0');
          break;
        case 'out_of_stock':
          queryBuilder.andWhere('stock.currentStock <= 0');
          break;
        case 'overstocked':
          queryBuilder.andWhere('stock.currentStock > stock.maxStockLevel');
          break;
        case 'in_stock':
          queryBuilder.andWhere('stock.currentStock > stock.reorderLevel AND stock.currentStock <= stock.maxStockLevel');
          break;
      }
    } else if (!includeZeroStock) {
      queryBuilder.andWhere('stock.currentStock > 0');
    }

    const [data, total] = await queryBuilder
      .orderBy('stock.currentStock', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStockSummary(warehouseId?: string): Promise<any> {
    const conditions = warehouseId ? { warehouseId } : {};

    const [totalProducts, lowStock, outOfStock, overstocked, movements] = await Promise.all([
      this.stockRepo.count({ where: { ...conditions, currentStock: MoreThan(0) } }),
      this.stockRepo.createQueryBuilder().where(conditions).andWhere('currentStock <= reorderLevel AND currentStock > 0').getCount(),
      this.stockRepo.count({ where: { ...conditions, currentStock: LessThanOrEqual(0) } }),
      this.stockRepo.createQueryBuilder().where(conditions).andWhere('currentStock > maxStockLevel').getCount(),
      this.movementRepo.count({
        where: {
          warehouseId: warehouseId || undefined,
          createdAt: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        },
      }),
    ]);

    const warehouseBreakdown = await this.stockRepo.createQueryBuilder('stock')
      .select('stock.warehouseId', 'warehouseId')
      .addSelect('COUNT(DISTINCT stock.productId)', 'productCount')
      .addSelect('SUM(stock.currentStock)', 'totalQuantity')
      .groupBy('stock.warehouseId')
      .getRawMany();

    return {
      totalProducts,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      overstockedCount: overstocked,
      totalMovements: movements,
      warehouseBreakdown,
    };
  }

  async getLowStockAlerts(warehouseId?: string): Promise<any[]> {
    const queryBuilder = this.stockRepo.createQueryBuilder('stock')
      .where('stock.currentStock <= stock.reorderLevel')
      .andWhere('stock.currentStock > 0')
      .orderBy('stock.currentStock', 'ASC');

    if (warehouseId) queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });

    const items = await queryBuilder.getMany();

    return items.map(stock => ({
      stockId: stock.stockId,
      productId: stock.productId,
      currentStock: stock.currentStock,
      reorderLevel: stock.reorderLevel,
      shortfall: Number(stock.reorderLevel) - Number(stock.currentStock),
      severity: Number(stock.currentStock) === 0 ? 'critical' : 'warning',
    }));
  }

  async getStockByProduct(productId: string): Promise<{
    summary: InventoryStock[];
    batches: InventoryBatch[];
    totalQuantity: number;
  }> {
    const stocks = await this.stockRepo.find({
      where: { productId },
      order: { currentStock: 'DESC' },
    });

    const batches = await this.batchRepo.find({
      where: { productId, status: BatchStatus.ACTIVE },
      order: { expiryDate: 'ASC' },
    });

    return {
      summary: stocks,
      batches,
      totalQuantity: stocks.reduce((sum, s) => sum + Number(s.currentStock), 0),
    };
  }

  async getInventoryValuation(warehouseId?: string): Promise<any[]> {
    const queryBuilder = this.batchRepo.createQueryBuilder('batch')
      .where('batch.status = :status', { status: BatchStatus.ACTIVE })
      .andWhere('batch.quantity > 0');

    if (warehouseId) {
      queryBuilder.andWhere('batch.warehouseId = :warehouseId', { warehouseId });
    }

    const batches = await queryBuilder.getMany();

    const groupedByProduct: Record<string, any> = {};
    for (const batch of batches) {
      if (!groupedByProduct[batch.productId]) {
        groupedByProduct[batch.productId] = {
          productId: batch.productId,
          totalQuantity: 0,
          totalValue: 0,
          batches: [],
        };
      }
      groupedByProduct[batch.productId].totalQuantity += Number(batch.quantity);
      groupedByProduct[batch.productId].totalValue += Number(batch.quantity) * Number(batch.unitCost);
      groupedByProduct[batch.productId].batches.push(batch);
    }

    return Object.values(groupedByProduct).sort((a: any, b: any) => b.totalValue - a.totalValue);
  }

  async getMovementReport(params: {
    productId?: string;
    warehouseId?: string;
    movementType?: MovementType;
    fromDate?: string;
    toDate?: string;
    groupBy?: 'product' | 'date' | 'warehouse' | 'type';
  }): Promise<any> {
    const { productId, warehouseId, movementType, fromDate, toDate, groupBy = 'date' } = params;

    const queryBuilder = this.movementRepo.createQueryBuilder('movement')
      .select(`movement.${groupBy === 'date' ? 'createdAt' : groupBy}`, 'label')
      .addSelect('SUM(movement.quantity)', 'totalQuantity')
      .addSelect('COUNT(*)', 'movementCount');

    if (productId) queryBuilder.andWhere('movement.productId = :productId', { productId });
    if (warehouseId) queryBuilder.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    if (movementType) queryBuilder.andWhere('movement.movementType = :movementType', { movementType });
    if (fromDate && toDate) {
      queryBuilder.andWhere('movement.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
      });
    }

    if (groupBy === 'date') {
      queryBuilder.groupBy('DATE(movement.createdAt)');
    } else {
      queryBuilder.groupBy(`movement.${groupBy}`);
    }

    return queryBuilder.orderBy('label', 'DESC').getRawMany();
  }
}
