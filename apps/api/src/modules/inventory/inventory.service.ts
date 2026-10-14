import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In, IsNull, Not, Like, DataSource } from 'typeorm';
import { InventoryStock } from '../masters/entities/inventory-stock.entity';
import { Warehouse } from '../masters/entities/warehouse.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Product } from '../masters/entities/product.entity';
import { PaginatedResult } from '../../common/types';

export interface StockFilters {
  search?: string;
  warehouseId?: string;
  status?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface StockSummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  totalMovements: number;
  warehouseBreakdown: any[];
}

export interface StockAdjustmentDto {
  productId: string;
  warehouseId: string;
  locationId?: string;
  quantity: number;
  type: 'increase' | 'decrease';
  reason: string;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

export interface StockTransferDto {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryStock)
    private stockRepo: Repository<InventoryStock>,
    @InjectRepository(Warehouse)
    private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(StockMovement)
    private movementRepo: Repository<StockMovement>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  // ========== WAREHOUSES ==========

  async findAllWarehouses(): Promise<Warehouse[]> {
    return this.warehouseRepo.find({
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findWarehouseById(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async findWarehouseByWarehouseId(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepo.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
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

    // Check if warehouse has stock
    const stockCount = await this.stockRepo.count({
      where: { warehouseId: id },
    });

    if (stockCount > 0) {
      throw new Error('Cannot delete warehouse with existing stock. Transfer stock first.');
    }

    await this.warehouseRepo.remove(warehouse);
  }

  // ========== STOCK OVERVIEW ==========

  async getStockOverview(filters: StockFilters): Promise<PaginatedResult<any>> {
    const { search, warehouseId, status, categoryId, page = 1, limit = 20 } = filters;

    // Simple query without joins to avoid UUID type mismatch issues
    const queryBuilder = this.stockRepo
      .createQueryBuilder('stock')
      .where('stock.stockId IS NOT NULL');

    if (search) {
      // Search by productId or sku directly
      queryBuilder.andWhere('stock.sku LIKE :search', { search: `%${search}%` });
    }

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    // Status filtering
    if (status && status !== 'all') {
      switch (status) {
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
          queryBuilder.andWhere(
            'stock.currentStock > stock.reorderLevel AND stock.currentStock <= stock.maxStockLevel'
          );
          break;
      }
    }

    const [data, total] = await queryBuilder
      .orderBy('stock.currentStock', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStockSummary(warehouseId?: string): Promise<StockSummary> {
    const stockRows = await this.stockRepo.find({
      where: warehouseId ? { warehouseId } : {},
    });
    const totalMovements = await this.movementRepo.count({
      where: {
        ...(warehouseId ? { warehouseId } : {}),
        createdAt: MoreThanOrEqual(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      },
    });
    const warehouses = await this.warehouseRepo.find();
    const warehouseNames = new Map(warehouses.map(warehouse => [warehouse.id, warehouse.name]));
    const breakdown = new Map<string, { warehouseId: string; warehouseName: string; productIds: Set<string>; totalStock: number }>();

    for (const stock of stockRows) {
      const currentStock = Number(stock.currentStock || 0);
      const existing = breakdown.get(stock.warehouseId) || {
        warehouseId: stock.warehouseId,
        warehouseName: warehouseNames.get(stock.warehouseId) || stock.warehouseId || 'Unknown',
        productIds: new Set<string>(),
        totalStock: 0,
      };
      existing.productIds.add(stock.productId);
      existing.totalStock += currentStock;
      breakdown.set(stock.warehouseId, existing);
    }

    const lowStockCount = stockRows.filter(stock => {
      const current = Number(stock.currentStock || 0);
      return current > 0 && current <= Number(stock.reorderLevel || 0);
    }).length;
    const outOfStockCount = stockRows.filter(stock => Number(stock.currentStock || 0) <= 0).length;
    const overstockedCount = stockRows.filter(stock => {
      const max = Number(stock.maxStockLevel || 0);
      return max > 0 && Number(stock.currentStock || 0) > max;
    }).length;
    const warehouseBreakdown = Array.from(breakdown.values()).map(row => ({
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      productCount: row.productIds.size,
      totalStock: row.totalStock,
    }));

    return {
      totalProducts: new Set(stockRows.map(stock => stock.productId)).size,
      totalValue: 0,
      lowStockCount,
      outOfStockCount,
      overstockedCount,
      totalMovements,
      warehouseBreakdown,
    };
  }

  // ========== STOCK MOVEMENTS ==========

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

    const queryBuilder = this.movementRepo
      .createQueryBuilder('movement')
      .orderBy('movement.createdAt', 'DESC');

    if (productId) {
      queryBuilder.andWhere('movement.productId = :productId', { productId });
    }
    if (warehouseId) {
      queryBuilder.andWhere('movement.warehouseId = :warehouseId', { warehouseId });
    }
    if (movementType) {
      queryBuilder.andWhere('movement.movementType = :movementType', { movementType });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('movement.createdAt >= :startDate', { startDate: new Date(startDate) });
    } else if (endDate) {
      queryBuilder.andWhere('movement.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async recordMovement(
    productId: string,
    warehouseId: string,
    movementType: MovementType,
    quantity: number,
    userId?: string,
    data?: Partial<StockMovement>,
  ): Promise<StockMovement> {
    // Get or create stock record
    let stock = await this.stockRepo.findOne({
      where: { productId, warehouseId },
    });

    const quantityBefore = stock?.currentStock || 0;
    let quantityAfter: number;

    // Calculate new quantity based on movement type
    switch (movementType) {
      case MovementType.PURCHASE_RECEIPT:
      case MovementType.TRANSFER_IN:
      case MovementType.ADJUSTMENT_IN:
      case MovementType.RETURN_IN:
        quantityAfter = quantityBefore + quantity;
        break;
      case MovementType.SALES_ISSUE:
      case MovementType.TRANSFER_OUT:
      case MovementType.ADJUSTMENT_OUT:
      case MovementType.DAMAGE:
      case MovementType.RETURN_OUT:
        quantityAfter = Math.max(0, quantityBefore - quantity);
        break;
      default:
        quantityAfter = quantityBefore;
    }

    // Update or create stock
    if (stock) {
      stock.currentStock = quantityAfter;
      stock.lastMovementDate = new Date();
      await this.stockRepo.save(stock);
    } else {
      stock = this.stockRepo.create({
        productId,
        warehouseId,
        currentStock: quantityAfter,
        reorderLevel: 0,
        maxStockLevel: 1000,
        lastMovementDate: new Date(),
      });
      await this.stockRepo.save(stock);
    }

    // Create movement record
    const movement = this.movementRepo.create({
      productId,
      warehouseId,
      movementType,
      quantity,
      quantityBefore,
      quantityAfter,
      performedBy: userId,
      ...data,
    });

    return this.movementRepo.save(movement);
  }

  // ========== STOCK ADJUSTMENT ==========

  async adjustStock(dto: StockAdjustmentDto, userId?: string): Promise<StockMovement> {
    const { productId, warehouseId, quantity, type, reason, referenceType, referenceId, remarks } = dto;

    // Verify product exists
    const product = await this.productRepo.findOne({ where: { productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify warehouse exists
    const warehouse = await this.warehouseRepo.findOne({ where: { id: warehouseId } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    const movementType = type === 'increase'
      ? MovementType.ADJUSTMENT_IN
      : MovementType.ADJUSTMENT_OUT;

    return this.recordMovement(productId, warehouseId, movementType, quantity, userId, {
      referenceType,
      referenceId,
      remarks,
    });
  }

  // ========== STOCK TRANSFER ==========

  async transferStock(dto: StockTransferDto, userId?: string): Promise<{ out: StockMovement; in: StockMovement }> {
    const { productId, fromWarehouseId, toWarehouseId, quantity, referenceType, referenceId, remarks } = dto;

    // Use transaction for atomicity
    return this.dataSource.transaction(async manager => {
      // Get source stock
      const sourceStock = await manager.findOne(InventoryStock, {
        where: { productId, warehouseId: fromWarehouseId },
      });

      if (!sourceStock || sourceStock.currentStock < quantity) {
        throw new Error('Insufficient stock for transfer');
      }

      // Deduct from source
      sourceStock.currentStock -= quantity;
      sourceStock.lastMovementDate = new Date();
      await manager.save(sourceStock);

      // Record outgoing movement
      const outMovement = manager.create(StockMovement, {
        productId,
        warehouseId: fromWarehouseId,
        movementType: MovementType.TRANSFER_OUT,
        quantity,
        quantityBefore: sourceStock.currentStock + quantity,
        quantityAfter: sourceStock.currentStock,
        performedBy: userId,
        referenceType,
        referenceId,
        remarks,
      });
      await manager.save(outMovement);

      // Add to destination
      let destStock = await manager.findOne(InventoryStock, {
        where: { productId, warehouseId: toWarehouseId },
      });

      if (destStock) {
        destStock.currentStock += quantity;
        destStock.lastMovementDate = new Date();
        await manager.save(destStock);
      } else {
        destStock = manager.create(InventoryStock, {
          productId,
          warehouseId: toWarehouseId,
          currentStock: quantity,
          reorderLevel: 0,
          maxStockLevel: 1000,
          lastMovementDate: new Date(),
        });
        await manager.save(destStock);
      }

      // Record incoming movement
      const inMovement = manager.create(StockMovement, {
        productId,
        warehouseId: toWarehouseId,
        movementType: MovementType.TRANSFER_IN,
        quantity,
        quantityBefore: destStock.currentStock - quantity,
        quantityAfter: destStock.currentStock,
        performedBy: userId,
        referenceType,
        referenceId,
        remarks,
      });
      await manager.save(inMovement);

      return { out: outMovement, in: inMovement };
    });
  }

  // ========== LOW STOCK & ALERTS ==========

  async getLowStockAlerts(warehouseId?: string): Promise<any[]> {
    const queryBuilder = this.stockRepo
      .createQueryBuilder('stock')
      .where('stock.currentStock <= stock.reorderLevel')
      .andWhere('stock.currentStock > 0')
      .orderBy('stock.currentStock', 'ASC');

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    const items = await queryBuilder.getMany();

    return items.map(stock => ({
      stockId: stock.stockId,
      productId: stock.productId,
      sku: stock.sku,
      currentStock: stock.currentStock,
      reorderLevel: stock.reorderLevel,
      maxStockLevel: stock.maxStockLevel,
      shortfall: Number(stock.reorderLevel) - Number(stock.currentStock),
      severity: Number(stock.currentStock) === 0 ? 'critical' : 'warning',
    }));
  }

  async getOutOfStockProducts(warehouseId?: string): Promise<any[]> {
    const queryBuilder = this.stockRepo
      .createQueryBuilder('stock')
      .where('stock.currentStock <= 0')
      .orderBy('stock.lastMovementDate', 'ASC', 'NULLS FIRST');

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    const items = await queryBuilder.getMany();

    return items.map(stock => ({
      stockId: stock.stockId,
      productId: stock.productId,
      sku: stock.sku,
      lastMovementDate: stock.lastMovementDate,
      reorderLevel: stock.reorderLevel,
    }));
  }

  // ========== STOCK BY PRODUCT ==========

  async getStockByProduct(productId: string): Promise<any[]> {
    const stocks = await this.stockRepo
      .createQueryBuilder('stock')
      .where('stock.productId = :productId', { productId })
      .andWhere('stock.currentStock > 0')
      .orderBy('stock.currentStock', 'DESC')
      .getMany();

    return stocks.map(stock => ({
      stockId: stock.stockId,
      warehouseId: stock.warehouseId,
      currentStock: stock.currentStock,
      reorderLevel: stock.reorderLevel,
      maxStockLevel: stock.maxStockLevel,
      stockStatus: stock.stockStatus,
    }));
  }

  // ========== VALUATION ==========

  async getStockValuation(warehouseId?: string): Promise<any[]> {
    const queryBuilder = this.stockRepo
      .createQueryBuilder('stock')
      .where('stock.currentStock > 0');

    if (warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId });
    }

    const items = await queryBuilder.getMany();

    return items.map(stock => {
      const currentStock = parseFloat(String(stock.currentStock)) || 0;

      return {
        stockId: stock.stockId,
        productId: stock.productId,
        sku: stock.sku,
        currentStock,
        lastUpdated: stock.updatedAt,
      };
    }).sort((a, b) => b.currentStock - a.currentStock);
  }
}
