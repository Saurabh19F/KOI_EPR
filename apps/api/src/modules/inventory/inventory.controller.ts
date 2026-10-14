import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MovementType } from './entities/stock-movement.entity';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ========== WAREHOUSES ==========

  @Get('warehouses')
  @ApiOperation({ summary: 'Get all warehouses' })
  getWarehouses() {
    return this.inventoryService.findAllWarehouses();
  }

  @Get('warehouses/:id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  getWarehouse(@Param('id') id: string) {
    return this.inventoryService.findWarehouseById(id);
  }

  @Post('warehouses')
  @ApiOperation({ summary: 'Create a new warehouse' })
  createWarehouse(@Body() data: any, @CurrentUser() user: any) {
    return this.inventoryService.createWarehouse(data);
  }

  @Patch('warehouses/:id')
  @ApiOperation({ summary: 'Update a warehouse' })
  updateWarehouse(@Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateWarehouse(id, data);
  }

  @Delete('warehouses/:id')
  @ApiOperation({ summary: 'Delete a warehouse' })
  deleteWarehouse(@Param('id') id: string) {
    return this.inventoryService.deleteWarehouse(id);
  }

  // ========== STOCK OVERVIEW ==========

  @Get('stock')
  @ApiOperation({ summary: 'Get stock overview with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStock(
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getStockOverview({
      search,
      warehouseId,
      status: status as any,
      categoryId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('stock/summary')
  @ApiOperation({ summary: 'Get stock summary' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getStockSummary(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getStockSummary(warehouseId);
  }

  @Get('stock/product/:productId')
  @ApiOperation({ summary: 'Get stock by product' })
  getStockByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getStockByProduct(productId);
  }

  @Get('stock/valuation')
  @ApiOperation({ summary: 'Get stock valuation' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getStockValuation(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getStockValuation(warehouseId);
  }

  // ========== STOCK MOVEMENTS ==========

  @Get('movements')
  @ApiOperation({ summary: 'Get stock movements' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'movementType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: MovementType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getMovements({
      productId,
      warehouseId,
      movementType,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // ========== STOCK ADJUSTMENT ==========

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock levels' })
  adjustStock(@Body() data: any, @CurrentUser() user: any) {
    return this.inventoryService.adjustStock(data, user?.userId);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  transferStock(@Body() data: any, @CurrentUser() user: any) {
    return this.inventoryService.transferStock(data, user?.userId);
  }

  // ========== ALERTS ==========

  @Get('alerts/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getLowStockAlerts(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getLowStockAlerts(warehouseId);
  }

  @Get('alerts/out-of-stock')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiQuery({ name: 'warehouseId', required: false })
  getOutOfStockProducts(@Query('warehouseId') warehouseId?: string) {
    return this.inventoryService.getOutOfStockProducts(warehouseId);
  }
}
