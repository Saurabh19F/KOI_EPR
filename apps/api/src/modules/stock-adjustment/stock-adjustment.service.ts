import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockAdjustmentLog } from './entities/stock-adjustment.entity';
import { CreateStockAdjustmentDto } from './dto/stock-adjustment.dto';
import { PaginatedResult } from '../../common/types';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/entities/stock-movement.entity';

@Injectable()
export class StockAdjustmentService {
  private readonly logger = new Logger(StockAdjustmentService.name);

  constructor(
    @InjectRepository(StockAdjustmentLog)
    private readonly adjustmentRepo: Repository<StockAdjustmentLog>,
    private readonly inventoryService: InventoryService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateStockAdjustmentDto,
    userId?: string,
    companyId?: string,
  ): Promise<StockAdjustmentLog> {
    if (!dto.adjustedQty || dto.adjustedQty === 0) {
      throw new BadRequestException('Adjusted quantity cannot be zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const log = this.adjustmentRepo.create({
        ...dto,
        date: new Date(dto.date),
        adjustedByUserId: userId,
        companyId,
        createdBy: userId,
      });
      const savedLog = await manager.save(StockAdjustmentLog, log);

      const movementType = dto.adjustedQty > 0
        ? MovementType.ADJUSTMENT_IN
        : MovementType.ADJUSTMENT_OUT;

      const absQty = Math.abs(dto.adjustedQty);

      await this.inventoryService.recordMovement(
        dto.productId,
        dto.warehouseId,
        movementType,
        absQty,
        userId,
        {
          referenceType: 'stock_adjustment',
          referenceId: savedLog.adjustmentId,
          remarks: dto.reason || 'Stock adjustment',
          companyId,
        },
      );

      this.logger.log(
        `Stock adjustment ${savedLog.adjustmentId}: ${movementType} ${absQty} units ` +
        `for product ${dto.productId} at warehouse ${dto.warehouseId}`,
      );

      return savedLog;
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    productId?: string;
    companyId?: string;
  }): Promise<PaginatedResult<StockAdjustmentLog>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.adjustmentRepo.createQueryBuilder('a');

    if (params.companyId) {
      qb.andWhere('a.companyId = :companyId', { companyId: params.companyId });
    }

    if (params.warehouseId) {
      qb.andWhere('a.warehouseId = :warehouseId', { warehouseId: params.warehouseId });
    }

    if (params.productId) {
      qb.andWhere('a.productId = :productId', { productId: params.productId });
    }

    if (params.search) {
      qb.andWhere(
        '(a.productName ILIKE :search OR a.reason ILIKE :search OR a.adjustedBy ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('a.date', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<StockAdjustmentLog> {
    return this.adjustmentRepo.findOneByOrFail({ adjustmentId: id });
  }
}
