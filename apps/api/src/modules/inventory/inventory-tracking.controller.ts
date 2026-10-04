import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InventoryTrackingService } from './inventory-tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { BatchStatus } from './entities/batch.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryTrackingController {
  constructor(private readonly service: InventoryTrackingService) {}

  // ========== WAREHOUSE MANAGEMENT ==========
  @Get('warehouses')
  getWarehouses() {
    return this.service.findAllWarehouses();
  }

  @Get('warehouses/:id')
  getWarehouse(@Param('id') id: string) {
    return this.service.findWarehouseById(id);
  }

  @Post('warehouses')
  createWarehouse(@Body() data: any) {
    return this.service.createWarehouse(data);
  }

  @Patch('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() data: any) {
    return this.service.updateWarehouse(id, data);
  }

  @Delete('warehouses/:id')
  deleteWarehouse(@Param('id') id: string) {
    return this.service.deleteWarehouse(id);
  }

  // ========== BATCH MANAGEMENT ==========
  @Get('batches')
  getBatches(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: BatchStatus,
    @Query('expiringInDays') expiringInDays?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findBatches({
      productId,
      warehouseId,
      status,
      expiringInDays: expiringInDays ? parseInt(expiringInDays) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('batches/expiring')
  getExpiringBatches(
    @Query('warehouseId') warehouseId?: string,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.service.getExpiringBatches(warehouseId, daysAhead ? parseInt(daysAhead) : 30);
  }

  @Get('batches/product/:productId')
  getBatchesByProduct(
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.service.getBatchByProduct(productId, warehouseId);
  }

  @Patch('batches/:id/status')
  updateBatchStatus(
    @Param('id') id: string,
    @Body('status') status: BatchStatus,
    @Body('remarks') remarks?: string,
  ) {
    return this.service.updateBatchStatus(id, status, remarks);
  }

  // ========== STOCK MOVEMENTS ==========
  @Get('movements')
  getMovements(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: MovementType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getMovements({
      productId,
      warehouseId,
      movementType,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('movements')
  recordMovement(
    @Body() data: {
      productId: string;
      warehouseId: string;
      movementType: MovementType;
      quantity: number;
      batchId?: string;
      batchNumber?: string;
      referenceType?: string;
      referenceId?: string;
      referenceNo?: string;
      unitCost?: number;
      remarks?: string;
    },
    @Request() req: any,
  ) {
    return this.service.recordMovement(
      data.productId,
      data.warehouseId,
      data.movementType,
      data.quantity,
      req.user?.userId,
      {
        batchId: data.batchId,
        batchNumber: data.batchNumber,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        referenceNo: data.referenceNo,
        unitCost: data.unitCost,
        remarks: data.remarks,
      },
    );
  }

  // ========== STOCK TRANSFERS ==========
  @Post('transfers')
  transferStock(
    @Body() data: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      referenceId?: string;
    },
    @Request() req: any,
  ) {
    return this.service.transferStock(
      data.productId,
      data.fromWarehouseId,
      data.toWarehouseId,
      data.quantity,
      req.user?.userId,
      data.referenceId,
    );
  }

  // ========== STOCK OVERVIEW & REPORTS ==========
  @Get('stock')
  getStockOverview(
    @Query('warehouseId') warehouseId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('includeZeroStock') includeZeroStock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getStockOverview({
      warehouseId,
      categoryId,
      stockStatus: stockStatus as any,
      includeZeroStock: includeZeroStock === 'true',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('stock/summary')
  getStockSummary(@Query('warehouseId') warehouseId?: string) {
    return this.service.getStockSummary(warehouseId);
  }

  @Get('stock/low-stock')
  getLowStockAlerts(@Query('warehouseId') warehouseId?: string) {
    return this.service.getLowStockAlerts(warehouseId);
  }

  @Get('stock/product/:productId')
  getStockByProduct(@Param('productId') productId: string) {
    return this.service.getStockByProduct(productId);
  }

  @Get('stock/valuation')
  getInventoryValuation(@Query('warehouseId') warehouseId?: string) {
    return this.service.getInventoryValuation(warehouseId);
  }

  // ========== MOVEMENT REPORTS ==========
  @Get('reports/movements')
  getMovementReport(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: MovementType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('groupBy') groupBy?: 'product' | 'date' | 'warehouse' | 'type',
  ) {
    return this.service.getMovementReport({
      productId,
      warehouseId,
      movementType,
      fromDate,
      toDate,
      groupBy,
    });
  }
}
