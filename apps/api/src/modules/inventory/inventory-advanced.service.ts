import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, Not } from 'typeorm';
import {
  InventoryBatch,
  InventorySerialNumber,
  StockReservation,
  StockValuation,
  StockCount,
  StockCountItem,
  StockTransfer,
  StockTransferItem,
  ReorderPoint,
  ValuationMethod,
  StockLocationTransferLog,
} from './entities';
import {
  CreateBatchDto,
  BatchQueryDto,
  CreateSerialNumberDto,
  BulkCreateSerialDto,
  CreateReservationDto,
  CreateStockTransferDto,
  CreateStockCountDto,
  CreateReorderPointDto,
  StockValuationQueryDto,
  PaginationDto,
  MoveStockLocationDto,
  RequestMaterialDto,
  DispatchMaterialDto,
  ReceiveTransferMaterialDto,
} from './dto/inventory-tracking.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaginatedResult } from '../../common/types';

@Injectable()
export class InventoryAdvancedService {
  private readonly logger = new Logger(InventoryAdvancedService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepository: Repository<InventoryBatch>,
    @InjectRepository(InventorySerialNumber)
    private readonly serialRepository: Repository<InventorySerialNumber>,
    @InjectRepository(StockReservation)
    private readonly reservationRepository: Repository<StockReservation>,
    @InjectRepository(StockValuation)
    private readonly valuationRepository: Repository<StockValuation>,
    @InjectRepository(StockCount)
    private readonly stockCountRepository: Repository<StockCount>,
    @InjectRepository(StockCountItem)
    private readonly stockCountItemRepository: Repository<StockCountItem>,
    @InjectRepository(StockTransfer)
    private readonly transferRepository: Repository<StockTransfer>,
    @InjectRepository(StockTransferItem)
    private readonly transferItemRepository: Repository<StockTransferItem>,
    @InjectRepository(ReorderPoint)
    private readonly reorderRepository: Repository<ReorderPoint>,
    @InjectRepository(StockLocationTransferLog)
    private readonly locationTransferLogRepository: Repository<StockLocationTransferLog>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============ BATCH OPERATIONS ============

  async createBatch(dto: CreateBatchDto, userId: string): Promise<InventoryBatch> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = queryRunner.manager.create(InventoryBatch, {
        ...dto,
        totalCost: dto.quantity * dto.unitCost,
        createdBy: userId,
      });

      const savedBatch = await queryRunner.manager.save(batch);

      await this.updateStockValuation(
        dto.productId,
        dto.warehouseId,
        dto.quantity,
        dto.unitCost,
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('batch.created', { batchId: savedBatch.batchId, companyId: dto.companyId });

      return savedBatch;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllBatches(params: BatchQueryDto & { companyId?: string; page?: number; limit?: number }): Promise<PaginatedResult<InventoryBatch>> {
    const { page = 1, limit = 20, productId, warehouseId, batchNumber, includeExpired, search, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.batchRepository.createQueryBuilder('batch');

    if (companyId) queryBuilder.andWhere('batch.companyId = :companyId', { companyId });
    if (productId) queryBuilder.andWhere('batch.productId = :productId', { productId });
    if (warehouseId) queryBuilder.andWhere('batch.warehouseId = :warehouseId', { warehouseId });
    if (batchNumber) queryBuilder.andWhere('batch.batchNumber ILIKE :batchNumber', { batchNumber: `%${batchNumber}%` });
    if (!includeExpired || includeExpired === 'false') {
      queryBuilder.andWhere('(batch.expiryDate IS NULL OR batch.expiryDate > :now)', { now: new Date() });
    }
    if (search) {
      queryBuilder.andWhere('(batch.batchNumber ILIKE :search OR batch.productName ILIKE :search)', { search: `%${search}%` });
    }

    queryBuilder.andWhere('batch.isActive = true');

    const [data, total] = await queryBuilder
      .orderBy('batch.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBatchById(id: string): Promise<InventoryBatch> {
    const batch = await this.batchRepository.findOne({ where: { batchId: id } });
    if (!batch) throw new NotFoundException(`Batch not found: ${id}`);
    return batch;
  }

  async getExpiringBatches(daysAhead: number, warehouseId?: string, companyId?: string): Promise<InventoryBatch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const whereClause: any = {
      isActive: true,
      expiryDate: LessThanOrEqual(futureDate),
    };

    if (companyId) whereClause.companyId = companyId;
    if (warehouseId) whereClause.warehouseId = warehouseId;

    return this.batchRepository.find({
      where: whereClause,
      order: { expiryDate: 'ASC' },
    });
  }

  // ============ SERIAL NUMBER OPERATIONS ============

  async createSerialNumber(dto: CreateSerialNumberDto, userId: string): Promise<InventorySerialNumber> {
    const serial = this.serialRepository.create({
      ...dto,
      companyId: dto.companyId,
      createdBy: userId,
    });
    return this.serialRepository.save(serial);
  }

  async bulkCreateSerialNumbers(dto: BulkCreateSerialDto, userId: string): Promise<InventorySerialNumber[]> {
    const serials: InventorySerialNumber[] = [];
    const prefix = dto.prefix || `SN-${dto.productId.substring(0, 4).toUpperCase()}-`;

    for (let i = 0; i < dto.quantity; i++) {
      const serialNumber = `${prefix}${Date.now()}${String(i).padStart(4, '0')}`;
      const serial = this.serialRepository.create({
        serialNumber,
        productId: dto.productId,
        productName: dto.productName,
        sku: dto.sku,
        batchId: dto.batchId,
        warehouseId: dto.warehouseId,
        unitCost: dto.unitCost,
        status: 'available',
        companyId: dto.companyId,
        createdBy: userId,
      });
      serials.push(serial);
    }

    return this.serialRepository.save(serials);
  }

  async findAllSerials(params: PaginationDto & { companyId?: string; productId?: string; status?: string }): Promise<PaginatedResult<InventorySerialNumber>> {
    const { page = 1, limit = 20, search, productId, status, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.serialRepository.createQueryBuilder('serial');

    if (companyId) queryBuilder.andWhere('serial.companyId = :companyId', { companyId });
    if (productId) queryBuilder.andWhere('serial.productId = :productId', { productId });
    if (status) queryBuilder.andWhere('serial.status = :status', { status });
    if (search) {
      queryBuilder.andWhere('(serial.serialNumber ILIKE :search OR serial.productName ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('serial.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateSerialStatus(serialId: string, status: string, additionalData?: any): Promise<InventorySerialNumber> {
    const serial = await this.serialRepository.findOne({ where: { serialId } });
    if (!serial) throw new NotFoundException(`Serial number not found: ${serialId}`);

    await this.serialRepository.update(serialId, { status, ...additionalData });
    return this.serialRepository.findOne({ where: { serialId } });
  }

  async findSerialById(id: string): Promise<InventorySerialNumber> {
    const serial = await this.serialRepository.findOne({ where: { serialId: id } });
    if (!serial) throw new NotFoundException(`Serial number not found: ${id}`);
    return serial;
  }

  // ============ STOCK RESERVATION OPERATIONS ============

  async createReservation(dto: CreateReservationDto, userId: string): Promise<StockReservation> {
    const availableQty = await this.getAvailableStock(dto.productId, dto.warehouseId);
    if (availableQty < dto.quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${availableQty}, Requested: ${dto.quantity}`);
    }

    const reservation = this.reservationRepository.create({
      ...dto,
      companyId: dto.companyId,
      createdBy: userId,
    });

    return this.reservationRepository.save(reservation);
  }

  async findAllReservations(params: PaginationDto & { companyId?: string; productId?: string; orderId?: string }): Promise<PaginatedResult<StockReservation>> {
    const { page = 1, limit = 20, search, productId, orderId, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reservationRepository.createQueryBuilder('reservation');

    if (companyId) queryBuilder.andWhere('reservation.companyId = :companyId', { companyId });
    if (productId) queryBuilder.andWhere('reservation.productId = :productId', { productId });
    if (orderId) queryBuilder.andWhere('reservation.orderId = :orderId', { orderId });
    if (search) {
      queryBuilder.andWhere('reservation.productName ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('reservation.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async fulfillReservation(reservationId: string, quantity: number): Promise<StockReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { reservationId } });
    if (!reservation) throw new NotFoundException(`Reservation not found: ${reservationId}`);

    const newFulfilled = Number(reservation.fulfilledQuantity) + quantity;
    const status = newFulfilled >= Number(reservation.quantity) ? 'fulfilled' : 'partial';

    await this.reservationRepository.update(reservationId, {
      fulfilledQuantity: newFulfilled,
      status,
    });

    return this.reservationRepository.findOne({ where: { reservationId } });
  }

  async cancelReservation(reservationId: string): Promise<StockReservation> {
    await this.reservationRepository.update(reservationId, { status: 'cancelled' });
    return this.reservationRepository.findOne({ where: { reservationId } });
  }

  async findReservationById(id: string): Promise<StockReservation> {
    const reservation = await this.reservationRepository.findOne({ where: { reservationId: id } });
    if (!reservation) throw new NotFoundException(`Reservation not found: ${id}`);
    return reservation;
  }

  private async getAvailableStock(productId: string, warehouseId?: string): Promise<number> {
    const valuation = await this.valuationRepository.findOne({
      where: { productId, warehouseId: warehouseId || undefined },
    });
    return valuation ? Number(valuation.quantity) : 0;
  }

  // ============ STOCK TRANSFER OPERATIONS ============

  async createStockTransfer(dto: CreateStockTransferDto, userId: string): Promise<StockTransfer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transferNumber = await this.generateTransferNumberForTransfer(queryRunner.manager, dto.companyId);

      const transfer = queryRunner.manager.create(StockTransfer, {
        transferNumber,
        transferDate: dto.transferDate,
        sourceWarehouseId: dto.sourceWarehouseId,
        sourceWarehouseName: dto.sourceWarehouseName,
        sourceLocationId: dto.sourceLocationId,
        destinationWarehouseId: dto.destinationWarehouseId,
        destinationWarehouseName: dto.destinationWarehouseName,
        destinationLocationId: dto.destinationLocationId,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        totalQuantity: dto.items.reduce((sum, item) => sum + item.quantity, 0),
        companyId: dto.companyId,
        createdBy: userId,
      });

      const savedTransfer = await queryRunner.manager.save(transfer);

      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const item = queryRunner.manager.create(StockTransferItem, {
          transferId: savedTransfer.transferId,
          productId: itemDto.productId,
          productName: itemDto.productName,
          batchId: itemDto.batchId,
          quantity: itemDto.quantity,
          unitCost: itemDto.unitCost,
          sourceLocationId: itemDto.sourceLocationId,
          destinationLocationId: itemDto.destinationLocationId,
          notes: itemDto.notes,
          companyId: dto.companyId,
          createdBy: userId,
        });
        await queryRunner.manager.save(item);

        await this.updateStockValuation(
          itemDto.productId,
          dto.sourceWarehouseId,
          -itemDto.quantity,
          itemDto.unitCost,
          queryRunner.manager
        );
      }

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('stock.transfer.created', { transferId: savedTransfer.transferId, companyId: dto.companyId });

      return this.findTransferById(savedTransfer.transferId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async receiveTransfer(transferId: string, userId: string): Promise<StockTransfer> {
    const transfer = await this.findTransferById(transferId);
    if (transfer.status !== 'in_transit') {
      throw new BadRequestException('Transfer must be in transit to receive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const items = await this.transferItemRepository.find({ where: { transferId } });
      for (const item of items) {
        await this.updateStockValuation(
          item.productId,
          transfer.destinationWarehouseId,
          item.quantity,
          item.unitCost,
          queryRunner.manager
        );
      }

      await queryRunner.manager.update(StockTransfer, transferId, {
        status: 'received',
        receivedBy: userId,
        receivedAt: new Date(),
      });

      await queryRunner.commitTransaction();

      return this.findTransferById(transferId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllTransfers(params: PaginationDto & { companyId?: string; status?: string; sourceWarehouseId?: string }): Promise<PaginatedResult<StockTransfer>> {
    const { page = 1, limit = 20, search, status, companyId, sourceWarehouseId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transferRepository.createQueryBuilder('transfer');

    if (companyId) {
      queryBuilder.andWhere('transfer.companyId = :companyId', { companyId });
    } else {
      queryBuilder.andWhere('(transfer.companyId IS NULL OR transfer.companyId = :companyId)', { companyId: '' });
    }
    if (status) queryBuilder.andWhere('transfer.status = :status', { status });
    if (sourceWarehouseId) queryBuilder.andWhere('transfer.sourceWarehouseId = :sourceWarehouseId', { sourceWarehouseId });
    if (search) {
      queryBuilder.andWhere('(transfer.transferNumber ILIKE :search OR transfer.referenceNumber ILIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('transfer.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findTransferById(id: string): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { transferId: id },
      relations: ['items'],
    });
    if (!transfer) throw new NotFoundException(`Transfer not found: ${id}`);
    return transfer;
  }

  async approveTransfer(transferId: string, userId: string): Promise<StockTransfer> {
    const transfer = await this.findTransferById(transferId);
    if (transfer.status !== 'pending') {
      throw new BadRequestException('Only pending transfers can be approved');
    }

    await this.transferRepository.update(transferId, {
      status: 'in_transit',
      sentBy: userId,
      sentAt: new Date(),
      updatedBy: userId,
    });

    return this.findTransferById(transferId);
  }

  async rejectTransfer(transferId: string, userId: string, reason?: string): Promise<StockTransfer> {
    const transfer = await this.findTransferById(transferId);
    if (transfer.status !== 'pending') {
      throw new BadRequestException('Only pending transfers can be rejected');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const items = await this.transferItemRepository.find({ where: { transferId } });
      for (const item of items) {
        await this.updateStockValuation(
          item.productId,
          transfer.sourceWarehouseId,
          item.quantity,
          item.unitCost,
          queryRunner.manager,
        );
      }

      await queryRunner.manager.update(StockTransfer, transferId, {
        status: 'cancelled',
        notes: reason ? `Rejected: ${reason}` : transfer.notes,
        updatedBy: userId,
      });

      await queryRunner.commitTransaction();
      return this.findTransferById(transferId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateTransferNumber(companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const fy = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    const lastTransfer = await this.transferRepository.findOne({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastTransfer) {
      const parts = lastTransfer.transferNumber.split('/');
      const numPart = parts[parts.length - 1];
      nextNumber = parseInt(numPart, 10) + 1;
    }

    return `ST/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  private async generateTransferNumberForTransfer(manager: any, companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const fy = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    const lastTransfer = await manager.findOne(StockTransfer, {
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastTransfer) {
      const parts = lastTransfer.transferNumber.split('/');
      const numPart = parts[parts.length - 1];
      nextNumber = parseInt(numPart, 10) + 1;
    }

    return `ST/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============ STOCK COUNT OPERATIONS ============

  async createStockCount(dto: CreateStockCountDto, userId: string): Promise<StockCount> {
    const countNumber = await this.generateCountNumber(dto.companyId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const count = queryRunner.manager.create(StockCount, {
        countNumber,
        countDate: dto.countDate,
        warehouseId: dto.warehouseId,
        warehouseName: dto.warehouseName,
        locationId: dto.locationId,
        locationName: dto.locationName,
        countedBy: dto.countedBy,
        notes: dto.notes,
        status: 'draft',
        companyId: dto.companyId,
        createdBy: userId,
      });

      const savedCount = await queryRunner.manager.save(count);

      if (dto.items && dto.items.length > 0) {
        for (let i = 0; i < dto.items.length; i++) {
          const itemDto = dto.items[i];

          const valuation = await this.valuationRepository.findOne({
            where: { productId: itemDto.productId, warehouseId: dto.warehouseId },
          });
          const systemQty = valuation ? Number(valuation.quantity) : 0;

          const item = queryRunner.manager.create(StockCountItem, {
            countId: savedCount.countId,
            productId: itemDto.productId,
            productName: itemDto.productName,
            batchId: itemDto.batchId,
            locationId: itemDto.locationId,
            locationName: itemDto.locationName,
            systemQuantity: systemQty,
            countedQuantity: itemDto.countedQuantity,
            variance: itemDto.countedQuantity - systemQty,
            reason: itemDto.reason,
            notes: itemDto.notes,
            companyId: dto.companyId,
            createdBy: userId,
          });
          await queryRunner.manager.save(item);
        }
      }

      await queryRunner.manager.update(StockCount, savedCount.countId, { status: 'in_progress' });

      await queryRunner.commitTransaction();

      return this.findCountById(savedCount.countId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async postVariances(countId: string, userId: string): Promise<StockCount> {
    const count = await this.findCountById(countId);
    if (count.status !== 'in_progress') {
      throw new BadRequestException('Count must be in progress to post variances');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const items = await this.stockCountItemRepository.find({ where: { countId } });

      for (const item of items) {
        if (item.variance !== 0) {
          await this.updateStockValuation(
            item.productId,
            count.warehouseId,
            item.variance,
            0,
            queryRunner.manager
          );
        }
      }

      await queryRunner.manager.update(StockCount, countId, {
        status: 'variances_posted',
      });

      await queryRunner.commitTransaction();

      return this.findCountById(countId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllCounts(params: PaginationDto & { companyId?: string; status?: string }): Promise<PaginatedResult<StockCount>> {
    const { page = 1, limit = 20, search, status, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.stockCountRepository.createQueryBuilder('count');

    if (companyId) queryBuilder.andWhere('count.companyId = :companyId', { companyId });
    if (status) queryBuilder.andWhere('count.status = :status', { status });
    if (search) {
      queryBuilder.andWhere('count.countNumber ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('count.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findCountById(id: string): Promise<StockCount> {
    const count = await this.stockCountRepository.findOne({
      where: { countId: id },
      relations: ['items'],
    });
    if (!count) throw new NotFoundException(`Stock count not found: ${id}`);
    return count;
  }

  async addCountItems(countId: string, items: any[], userId: string): Promise<StockCount> {
    const count = await this.findCountById(countId);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const itemDto of items) {
        const valuation = await this.valuationRepository.findOne({
          where: { productId: itemDto.productId, warehouseId: count.warehouseId },
        });
        const systemQty = valuation ? Number(valuation.quantity) : 0;

        const item = queryRunner.manager.create(StockCountItem, {
          countId,
          productId: itemDto.productId,
          productName: itemDto.productName,
          batchId: itemDto.batchId,
          locationId: itemDto.locationId,
          locationName: itemDto.locationName,
          systemQuantity: systemQty,
          countedQuantity: itemDto.countedQuantity,
          variance: itemDto.countedQuantity - systemQty,
          reason: itemDto.reason,
          notes: itemDto.notes,
          companyId: count.companyId,
          createdBy: userId,
        });
        await queryRunner.manager.save(item);
      }

      await queryRunner.commitTransaction();
      return this.findCountById(countId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generateCountNumber(companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const fy = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

    const lastCount = await this.stockCountRepository.findOne({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    let nextNumber = 1;
    if (lastCount) {
      const parts = lastCount.countNumber.split('/');
      const numPart = parts[parts.length - 1];
      nextNumber = parseInt(numPart, 10) + 1;
    }

    return `SC/${fy}/${nextNumber.toString().padStart(5, '0')}`;
  }

  // ============ REORDER POINT OPERATIONS ============

  async createReorderPoint(dto: CreateReorderPointDto, userId: string): Promise<ReorderPoint> {
    const reorder = this.reorderRepository.create({
      ...dto,
      companyId: dto.companyId,
      createdBy: userId,
    });
    return this.reorderRepository.save(reorder);
  }

  async findAllReorderPoints(params: PaginationDto & { companyId?: string }): Promise<PaginatedResult<ReorderPoint>> {
    const { page = 1, limit = 20, search, companyId } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reorderRepository.createQueryBuilder('reorder');

    if (companyId) queryBuilder.andWhere('reorder.companyId = :companyId', { companyId });
    if (search) {
      queryBuilder.andWhere('reorder.productName ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await queryBuilder
      .orderBy('reorder.productName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLowStockAlerts(companyId: string): Promise<any[]> {
    const reorders = await this.reorderRepository.find({ where: { companyId, isActive: true } });
    const alerts: any[] = [];

    for (const reorder of reorders) {
      const valuation = await this.valuationRepository.findOne({
        where: { productId: reorder.productId, warehouseId: reorder.warehouseId || undefined },
      });

      const currentStock = valuation ? Number(valuation.quantity) : 0;

      if (currentStock <= Number(reorder.reorderLevel)) {
        alerts.push({
          productId: reorder.productId,
          productName: reorder.productName,
          warehouseId: reorder.warehouseId,
          warehouseName: reorder.warehouseName,
          currentStock,
          reorderLevel: reorder.reorderLevel,
          reorderQuantity: reorder.reorderQuantity,
          maximumLevel: reorder.maximumLevel,
        });
      }
    }

    return alerts;
  }

  // ============ STOCK VALUATION OPERATIONS ============

  async getStockValuation(params: StockValuationQueryDto & { companyId?: string }): Promise<StockValuation[]> {
    const { productId, warehouseId, companyId } = params;

    const queryBuilder = this.valuationRepository.createQueryBuilder('valuation');

    if (companyId) queryBuilder.andWhere('valuation.companyId = :companyId', { companyId });
    if (productId) queryBuilder.andWhere('valuation.productId = :productId', { productId });
    if (warehouseId) queryBuilder.andWhere('valuation.warehouseId = :warehouseId', { warehouseId });

    return queryBuilder.getMany();
  }

  private async updateStockValuation(
    productId: string,
    warehouseId: string | undefined,
    quantityChange: number,
    unitCost: number,
    manager: any
  ): Promise<void> {
    let valuation = await manager.findOne(StockValuation, {
      where: { productId, warehouseId: warehouseId || undefined },
    });

    if (!valuation) {
      valuation = manager.create(StockValuation, {
        productId,
        warehouseId,
        warehouseName: '',
        quantity: 0,
        averageCost: unitCost,
        totalValue: 0,
        valuationMethod: ValuationMethod.AVERAGE,
      });
      await manager.save(valuation);
    }

    const oldQty = Number(valuation.quantity);
    const newQty = oldQty + quantityChange;
    const oldValue = Number(valuation.totalValue);
    const newValue = oldValue + (quantityChange * unitCost);

    valuation.quantity = newQty;
    valuation.averageCost = newQty > 0 ? newValue / newQty : 0;
    valuation.totalValue = newValue;

    await manager.save(valuation);
  }

  // ============ FIFO/LIFO CALCULATIONS ============

  async getFifoCost(productId: string, warehouseId?: string): Promise<number> {
    const batch = await this.batchRepository.findOne({
      where: {
        productId,
        warehouseId: warehouseId || undefined,
        isActive: true,
        quantity: Not(0),
      },
      order: { createdAt: 'ASC' },
    });

    return batch ? Number(batch.unitCost) : 0;
  }

  async getLifoCost(productId: string, warehouseId?: string): Promise<number> {
    const batch = await this.batchRepository.findOne({
      where: {
        productId,
        warehouseId: warehouseId || undefined,
        isActive: true,
        quantity: Not(0),
      },
      order: { createdAt: 'DESC' },
    });

    return batch ? Number(batch.unitCost) : 0;
  }

  // ============ SUMMARY REPORTS ============

  async getInventorySummary(companyId: string, warehouseId?: string) {
    const valuations = await this.valuationRepository.find({
      where: { companyId, warehouseId: warehouseId || undefined },
    });

    const totalProducts = valuations.length;
    const totalQuantity = valuations.reduce((sum, v) => sum + Number(v.quantity), 0);
    const totalValue = valuations.reduce((sum, v) => sum + Number(v.totalValue), 0);
    const averageValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    const lowStockCount = (await this.getLowStockAlerts(companyId)).length;

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      averageValue,
      lowStockCount,
    };
  }

  // ============ BIN-TO-BIN LOCATION MOVE ============

  async moveStockLocation(
    dto: MoveStockLocationDto,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<{ transferId: string; message: string }> {
    if (dto.qtyToMove <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (dto.currentBin === dto.newBin) {
      throw new BadRequestException('Source and destination bins cannot be the same');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const rand = String(Math.floor(100 + Math.random() * 900));
      const transferId = `LOC-${ts}-${rand}`;

      const log = queryRunner.manager.create(StockLocationTransferLog, {
        transferId,
        companyId,
        warehouseId: dto.warehouseId,
        productId: dto.productId,
        sourceLocation: dto.currentBin,
        destinationLocation: dto.newBin,
        transferredQty: dto.qtyToMove,
        transferredBy: userName,
        transferredByUserId: userId,
      });

      await queryRunner.manager.save(log);
      await queryRunner.commitTransaction();

      return {
        transferId,
        message: `Moved ${dto.qtyToMove} items from ${dto.currentBin} to ${dto.newBin}. Transfer logged successfully.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ MATERIAL REQUEST (with auto-approve for same-WH) ============

  async requestMaterial(
    dto: RequestMaterialDto,
    requestingWarehouseId: string,
    userId: string,
    userName: string,
    companyId: string,
  ): Promise<{ status: string; message: string; transfers: StockTransfer[] }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items provided in the request');
    }

    const isCrossWarehouse = requestingWarehouseId !== dto.sourceWarehouseId;
    const initialStatus = isCrossWarehouse ? 'pending' : 'in_transit';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stockMap = await this.getWarehouseStockMapInternal(dto.sourceWarehouseId, companyId, queryRunner.manager);

      const requestedByProduct: Record<string, number> = {};
      for (const item of dto.items) {
        requestedByProduct[item.productId] = (requestedByProduct[item.productId] || 0) + item.qty;
      }

      for (const [productId, requested] of Object.entries(requestedByProduct)) {
        const available = stockMap[productId] || 0;
        if (requested > available) {
          throw new BadRequestException(
            `Insufficient unreserved stock for ${productId}. Available: ${available}, Requested: ${requested}`,
          );
        }
      }

      const transfers: StockTransfer[] = [];

      for (const item of dto.items) {
        const transferNumber = await this.generateTransferNumberForTransfer(queryRunner.manager, companyId);

        const transfer = queryRunner.manager.create(StockTransfer, {
          transferNumber,
          transferDate: new Date(),
          sourceWarehouseId: dto.sourceWarehouseId,
          sourceWarehouseName: dto.sourceWarehouseName,
          destinationWarehouseId: requestingWarehouseId,
          destinationWarehouseName: '',
          orderNo: dto.orderNo,
          requestType: dto.requestType || 'material_request',
          productionId: dto.productionId,
          requestRemarks: dto.remarks,
          requestedByUsername: userName,
          status: initialStatus,
          totalQuantity: item.qty,
          companyId,
          createdBy: userId,
        });

        const savedTransfer = await queryRunner.manager.save(transfer);

        const transferItem = queryRunner.manager.create(StockTransferItem, {
          transferId: savedTransfer.transferId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.qty,
          requestedQty: item.qty,
          dispatchedQty: 0,
          receivedQty: 0,
          unitCost: 0,
          companyId,
          createdBy: userId,
        });

        await queryRunner.manager.save(transferItem);

        if (!isCrossWarehouse) {
          await this.updateStockValuation(
            item.productId,
            dto.sourceWarehouseId,
            -item.qty,
            0,
            queryRunner.manager,
          );

          await queryRunner.manager.update(StockTransfer, savedTransfer.transferId, {
            sentBy: userId,
            sentAt: new Date(),
          });
        }

        transfers.push(savedTransfer);
      }

      await queryRunner.commitTransaction();

      const message = isCrossWarehouse
        ? 'Cross-warehouse request logged. Sent for approval.'
        : `Internal material request created and auto-approved for ${dto.sourceWarehouseId}.`;

      return { status: 'success', message, transfers };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ DISPATCH MATERIAL ============

  async dispatchMaterial(
    dto: DispatchMaterialDto,
    userId: string,
    companyId: string,
  ): Promise<{ status: string; message: string }> {
    const transfer = await this.transferRepository.findOne({
      where: { transferId: dto.transferId, companyId },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${dto.transferId} not found`);
    }

    if (transfer.status !== 'in_transit') {
      throw new BadRequestException('Transfer must be in_transit (approved) to dispatch');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const items = await this.transferItemRepository.find({ where: { transferId: dto.transferId } });

      let totalDispatched = 0;
      for (const item of items) {
        const maxDispatch = Number(item.requestedQty || item.quantity);
        const itemDispatchQty = Math.min(dto.dispatchedQty, maxDispatch);

        await this.updateStockValuation(
          item.productId,
          transfer.sourceWarehouseId,
          -itemDispatchQty,
          0,
          queryRunner.manager,
        );

        await queryRunner.manager.update(StockTransferItem, item.itemId, {
          dispatchedQty: itemDispatchQty,
        });

        totalDispatched += itemDispatchQty;
      }

      await queryRunner.manager.update(StockTransfer, dto.transferId, {
        status: 'in_transit',
        sentBy: userId,
        sentAt: new Date(),
        updatedBy: userId,
      });

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: `Material dispatched! ${totalDispatched} units sent from ${transfer.sourceWarehouseName}.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ RECEIVE TRANSFERRED MATERIAL ============

  async receiveTransferredMaterial(
    dto: ReceiveTransferMaterialDto,
    userId: string,
    companyId: string,
  ): Promise<{ status: string; message: string }> {
    const transfer = await this.transferRepository.findOne({
      where: { transferId: dto.transferId, companyId },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${dto.transferId} not found`);
    }

    if (transfer.status !== 'in_transit') {
      throw new BadRequestException('Transfer must be in transit to receive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const items = await this.transferItemRepository.find({ where: { transferId: dto.transferId } });

      let totalReceived = 0;
      let totalDispatched = 0;
      for (const item of items) {
        const dispatched = Number(item.dispatchedQty || item.quantity);
        const itemReceiveQty = Math.min(dto.receivedQty, dispatched);

        await this.updateStockValuation(
          item.productId,
          transfer.destinationWarehouseId,
          itemReceiveQty,
          item.unitCost,
          queryRunner.manager,
        );

        await queryRunner.manager.update(StockTransferItem, item.itemId, {
          receivedQty: itemReceiveQty,
        });

        totalReceived += itemReceiveQty;
        totalDispatched += dispatched;
      }

      const finalStatus = totalReceived >= totalDispatched ? 'received' : 'partially_received';

      await queryRunner.manager.update(StockTransfer, dto.transferId, {
        status: finalStatus,
        receivedBy: userId,
        receivedAt: new Date(),
        updatedBy: userId,
      });

      await queryRunner.commitTransaction();

      if (transfer.productionId && finalStatus === 'received') {
        this.eventEmitter.emit('stock-transfer.received', {
          transferId: transfer.transferId,
          productionId: transfer.productionId,
          destinationWarehouseId: transfer.destinationWarehouseId,
          companyId,
          userId,
        });
      }

      const bin = dto.targetBin || 'Inward-Staging';
      return {
        status: 'success',
        message: `Material received (${finalStatus})! ${totalReceived} units added to destination (${bin}).`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ WAREHOUSE STOCK MAP (with reserved stock deduction) ============

  async getWarehouseStockMap(
    warehouseId: string,
    companyId: string,
  ): Promise<Record<string, number>> {
    return this.getWarehouseStockMapInternal(warehouseId, companyId);
  }

  private async getWarehouseStockMapInternal(
    warehouseId: string,
    companyId: string,
    manager?: any,
  ): Promise<Record<string, number>> {
    const repo = manager || this.dataSource.manager;

    const valuations = await repo.find(StockValuation, {
      where: { warehouseId, companyId },
    });

    const stockMap: Record<string, number> = {};
    for (const v of valuations) {
      stockMap[v.productId] = (stockMap[v.productId] || 0) + Number(v.quantity);
    }

    const outstandingTransfers = await repo
      .createQueryBuilder(StockTransfer, 'transfer')
      .innerJoin(StockTransferItem, 'item', 'item.transferId = transfer.transferId')
      .select([
        'item.productId AS "productId"',
        'SUM(GREATEST(0, COALESCE(item.requestedQty, item.quantity) - COALESCE(item.dispatchedQty, 0))) AS "outstanding"',
      ])
      .where('transfer.sourceWarehouseId = :warehouseId', { warehouseId })
      .andWhere('transfer.companyId = :companyId', { companyId })
      .andWhere('transfer.status NOT IN (:...completedStatuses)', {
        completedStatuses: ['received', 'cancelled', 'rejected'],
      })
      .groupBy('item.productId')
      .getRawMany();

    for (const row of outstandingTransfers) {
      const productId = row.productId;
      const outstanding = Number(row.outstanding) || 0;
      if (productId && outstanding > 0) {
        stockMap[productId] = Math.max(0, (stockMap[productId] || 0) - outstanding);
      }
    }

    return stockMap;
  }

  // ============ WAREHOUSE EMAIL LOOKUP ============

  async getWarehouseEmails(warehouseId: string, companyId: string): Promise<string[]> {
    if (!warehouseId || !companyId) return [];

    const rows = await this.dataSource.query(
      `SELECT DISTINCT email FROM users WHERE preferences->>'warehouseId' = $1 AND company_id = $2 AND is_active = true AND email IS NOT NULL AND email LIKE '%@%'`,
      [warehouseId, companyId],
    );

    return rows.map((r: any) => r.email);
  }

  // ============ BIN & RACK OPERATIONS ============

  async getBinRackStock(params: {
    warehouseId: string;
    companyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { warehouseId, companyId, search, page = 1, limit = 50 } = params;

    let query = `SELECT stock_id, product_id, sku, product_name, bin_location, current_stock, location_id
      FROM inventory_stock
      WHERE location_id = $1 AND current_stock > 0`;
    const queryParams: any[] = [warehouseId];
    let paramIdx = 2;

    if (companyId) {
      query += ` AND company_id = $${paramIdx}`;
      queryParams.push(companyId);
      paramIdx++;
    } else {
      query += ` AND (company_id IS NULL OR company_id = '')`;
    }

    if (search) {
      query += ` AND (sku ILIKE $${paramIdx} OR product_name ILIKE $${paramIdx})`;
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as cnt FROM');
    const countResult = await this.dataSource.query(countQuery, queryParams);
    const total = Number(countResult[0]?.cnt || 0);

    query += ` ORDER BY bin_location ASC, product_name ASC`;
    query += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    queryParams.push(limit, (page - 1) * limit);

    const data = await this.dataSource.query(query, queryParams);

    const companyFilter = companyId
      ? `AND company_id = $2`
      : `AND (company_id IS NULL OR company_id = '')`;
    const aggParams = companyId ? [warehouseId, companyId] : [warehouseId];

    const stagingTotal = await this.dataSource.query(
      `SELECT COALESCE(SUM(current_stock), 0) as total FROM inventory_stock WHERE location_id = $1 ${companyFilter} AND (bin_location = 'Inward-Staging' OR bin_location IS NULL) AND current_stock > 0`,
      aggParams,
    );

    const distinctBins = await this.dataSource.query(
      `SELECT COUNT(DISTINCT bin_location) as cnt FROM inventory_stock WHERE location_id = $1 ${companyFilter} AND bin_location IS NOT NULL AND current_stock > 0`,
      aggParams,
    );

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stagingTotal: Number(stagingTotal[0]?.total || 0),
      distinctBins: Number(distinctBins[0]?.cnt || 0),
    };
  }

  async assignBinRack(params: {
    stockId: string;
    newBin: string;
    companyId?: string;
    userId: string;
  }) {
    const { stockId, newBin, companyId, userId } = params;

    const tenantClause = companyId
      ? `AND company_id = $2`
      : `AND (company_id IS NULL OR company_id = '')`;
    const tenantParams = companyId ? [stockId, companyId] : [stockId];

    const stock = await this.dataSource.query(
      `SELECT * FROM inventory_stock WHERE stock_id = $1 ${tenantClause}`,
      tenantParams,
    );

    if (!stock.length) {
      throw new NotFoundException('Stock record not found');
    }

    await this.dataSource.query(
      `UPDATE inventory_stock SET bin_location = $1 WHERE stock_id = $2 ${tenantClause}`,
      companyId ? [newBin, stockId, companyId] : [newBin, stockId],
    );

    return { success: true, message: `Bin/Rack updated to ${newBin}` };
  }
}
