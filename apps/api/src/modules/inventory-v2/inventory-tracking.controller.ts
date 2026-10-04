import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryTrackingService } from './inventory-tracking.service';
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
} from './dto/inventory-tracking.dto';

@ApiTags('Inventory Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory-tracking')
export class InventoryTrackingController {
  constructor(private readonly inventoryService: InventoryTrackingService) {}

  // ============ Batch Operations ============

  @Post('batches')
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiResponse({ status: 201, description: 'Batch created successfully' })
  async createBatch(
    @Body() dto: CreateBatchDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createBatch(dto, req.user.userId);
  }

  @Get('batches')
  @ApiOperation({ summary: 'Query batches with filters' })
  @ApiResponse({ status: 200, description: 'List of batches' })
  async findAllBatches(@Query() query: BatchQueryDto, @Request() req: any) {
    return this.inventoryService.findAllBatches({ ...query, companyId: req.user.companyId });
  }

  @Get('batches/expiring')
  @ApiOperation({ summary: 'Get batches expiring within days' })
  @ApiResponse({ status: 200, description: 'List of expiring batches' })
  async getExpiringBatches(
    @Query('days') days: number,
    @Query('warehouseId') warehouseId: string,
    @Request() req: any,
  ) {
    return this.inventoryService.getExpiringBatches(
      days || 30,
      warehouseId,
      req.user.companyId,
    );
  }

  @Get('batches/:batchId')
  @ApiOperation({ summary: 'Get batch by ID' })
  @ApiResponse({ status: 200, description: 'Batch details' })
  async getBatch(@Param('batchId') batchId: string) {
    return this.inventoryService.findBatchById(batchId);
  }

  // ============ Serial Number Operations ============

  @Post('serial-numbers')
  @ApiOperation({ summary: 'Create a single serial number' })
  @ApiResponse({ status: 201, description: 'Serial number created' })
  async createSerialNumber(
    @Body() dto: CreateSerialNumberDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createSerialNumber(dto, req.user.userId);
  }

  @Post('serial-numbers/bulk')
  @ApiOperation({ summary: 'Bulk create serial numbers' })
  @ApiResponse({ status: 201, description: 'Serial numbers created' })
  async bulkCreateSerialNumbers(
    @Body() dto: BulkCreateSerialDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.bulkCreateSerialNumbers(dto, req.user.userId);
  }

  @Get('serial-numbers')
  @ApiOperation({ summary: 'Query serial numbers' })
  @ApiResponse({ status: 200, description: 'List of serial numbers' })
  async findAllSerials(
    @Query() query: PaginationDto & { productId?: string; status?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.findAllSerials({
      ...query,
      companyId: req.user.companyId,
    });
  }

  @Get('serial-numbers/:serialId')
  @ApiOperation({ summary: 'Get serial number by ID' })
  @ApiResponse({ status: 200, description: 'Serial number details' })
  async getSerialNumber(@Param('serialId') serialId: string) {
    return this.inventoryService.findSerialById(serialId);
  }

  @Put('serial-numbers/:serialId/status')
  @ApiOperation({ summary: 'Update serial number status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateSerialStatus(
    @Param('serialId') serialId: string,
    @Body('status') status: string,
    @Body('additionalData') additionalData?: any,
  ) {
    return this.inventoryService.updateSerialStatus(serialId, status, additionalData);
  }

  @Get('serial-numbers/product/:productId')
  @ApiOperation({ summary: 'Get serial numbers by product' })
  @ApiResponse({ status: 200, description: 'List of serial numbers' })
  async getSerialsByProduct(
    @Param('productId') productId: string,
    @Query('status') status?: string,
  ) {
    return this.inventoryService.findAllSerials({ productId, status });
  }

  // ============ Stock Reservation Operations ============

  @Post('reservations')
  @ApiOperation({ summary: 'Create stock reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  async createReservation(
    @Body() dto: CreateReservationDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createReservation(dto, req.user.userId);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Query reservations' })
  @ApiResponse({ status: 200, description: 'List of reservations' })
  async findAllReservations(
    @Query() query: PaginationDto & { productId?: string; orderId?: string; status?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.findAllReservations({
      ...query,
      companyId: req.user.companyId,
    });
  }

  @Get('reservations/:reservationId')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  async getReservation(@Param('reservationId') reservationId: string) {
    return this.inventoryService.findReservationById(reservationId);
  }

  @Put('reservations/:reservationId/fulfill')
  @ApiOperation({ summary: 'Fulfill reservation' })
  @ApiResponse({ status: 200, description: 'Reservation fulfilled' })
  async fulfillReservation(
    @Param('reservationId') reservationId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.inventoryService.fulfillReservation(reservationId, quantity);
  }

  @Put('reservations/:reservationId/cancel')
  @ApiOperation({ summary: 'Cancel reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  async cancelReservation(@Param('reservationId') reservationId: string) {
    return this.inventoryService.cancelReservation(reservationId);
  }

  // ============ Stock Transfer Operations ============

  @Post('transfers')
  @ApiOperation({ summary: 'Create stock transfer' })
  @ApiResponse({ status: 201, description: 'Transfer created' })
  async createStockTransfer(
    @Body() dto: CreateStockTransferDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createStockTransfer(dto, req.user.userId);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Query transfers' })
  @ApiResponse({ status: 200, description: 'List of transfers' })
  async findAllTransfers(
    @Query() query: PaginationDto & { status?: string; sourceWarehouseId?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.findAllTransfers({
      ...query,
      companyId: req.user.companyId,
    });
  }

  @Get('transfers/:transferId')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiResponse({ status: 200, description: 'Transfer details' })
  async getTransfer(@Param('transferId') transferId: string) {
    return this.inventoryService.findTransferById(transferId);
  }

  @Put('transfers/:transferId/receive')
  @ApiOperation({ summary: 'Receive stock transfer' })
  @ApiResponse({ status: 200, description: 'Transfer received' })
  async receiveTransfer(
    @Param('transferId') transferId: string,
    @Body('receivedBy') receivedBy: string,
  ) {
    return this.inventoryService.receiveTransfer(transferId, receivedBy);
  }

  // ============ Stock Count Operations ============

  @Post('counts')
  @ApiOperation({ summary: 'Create stock count' })
  @ApiResponse({ status: 201, description: 'Stock count created' })
  async createStockCount(
    @Body() dto: CreateStockCountDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createStockCount(dto, req.user.userId);
  }

  @Get('counts')
  @ApiOperation({ summary: 'Query stock counts' })
  @ApiResponse({ status: 200, description: 'List of stock counts' })
  async findAllCounts(
    @Query() query: PaginationDto & { warehouseId?: string; status?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.findAllCounts({
      ...query,
      companyId: req.user.companyId,
    });
  }

  @Get('counts/:countId')
  @ApiOperation({ summary: 'Get stock count by ID' })
  @ApiResponse({ status: 200, description: 'Stock count details' })
  async getStockCount(@Param('countId') countId: string) {
    return this.inventoryService.findCountById(countId);
  }

  @Put('counts/:countId/items')
  @ApiOperation({ summary: 'Add/update count items' })
  @ApiResponse({ status: 200, description: 'Items updated' })
  async addCountItems(
    @Param('countId') countId: string,
    @Body('items') items: any[],
    @Request() req: any,
  ) {
    return this.inventoryService.addCountItems(countId, items, req.user.userId);
  }

  @Put('counts/:countId/post-variances')
  @ApiOperation({ summary: 'Post count variances to inventory' })
  @ApiResponse({ status: 200, description: 'Variances posted' })
  async postVariances(
    @Param('countId') countId: string,
    @Request() req: any,
  ) {
    return this.inventoryService.postVariances(countId, req.user.userId);
  }

  // ============ Reorder Point Operations ============

  @Post('reorder-points')
  @ApiOperation({ summary: 'Create reorder point' })
  @ApiResponse({ status: 201, description: 'Reorder point created' })
  async createReorderPoint(
    @Body() dto: CreateReorderPointDto,
    @Request() req: any,
  ) {
    dto.companyId = req.user.companyId;
    return this.inventoryService.createReorderPoint(dto, req.user.userId);
  }

  @Get('reorder-points')
  @ApiOperation({ summary: 'Query reorder points' })
  @ApiResponse({ status: 200, description: 'List of reorder points' })
  async findAllReorderPoints(
    @Query() query: PaginationDto & { productId?: string; warehouseId?: string },
    @Request() req: any,
  ) {
    return this.inventoryService.findAllReorderPoints({
      ...query,
      companyId: req.user.companyId,
    });
  }

  @Get('reorder-points/low-stock')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Low stock items' })
  async getLowStockAlerts(@Request() req: any) {
    return this.inventoryService.getLowStockAlerts(req.user.companyId);
  }

  // ============ Stock Valuation ============

  @Get('valuation')
  @ApiOperation({ summary: 'Get stock valuation' })
  @ApiResponse({ status: 200, description: 'Stock valuation report' })
  async getStockValuation(
    @Query() query: StockValuationQueryDto,
    @Request() req: any,
  ) {
    return this.inventoryService.getStockValuation({
      ...query,
      companyId: req.user.companyId,
    });
  }

  // ============ Utility ============

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({ status: 200, description: 'Inventory summary' })
  async getInventorySummary(@Request() req: any) {
    return this.inventoryService.getInventorySummary(req.user.companyId);
  }
}
