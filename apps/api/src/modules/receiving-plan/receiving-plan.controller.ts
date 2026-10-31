import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReceivingPlanService } from './receiving-plan.service';
import { ReceivingPlanPdfService } from './receiving-plan-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreateReceivingPlanDto,
  UpdateReceivingPlanDto,
  BulkCreateReceivingPlanDto,
  UpdateReceivedQtyDto,
  SubmitGoodsReceivingDto,
  SubmitBulkGoodsReceivingDto,
  SubmitMultiGoodsReceivingDto,
  AllocateToWarehousesDto,
  BulkAllocateDto,
} from './dto/receiving-plan.dto';
import { ReceivingPlanStatus } from './entities/receiving-plan.entity';

@ApiTags('receiving-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('receiving-plans')
export class ReceivingPlanController {
  constructor(
    private readonly receivingPlanService: ReceivingPlanService,
    private readonly receivingPlanPdfService: ReceivingPlanPdfService,
  ) {}

  @Post()
  @Permissions('RECEIVING_PLAN_CREATE')
  @ApiOperation({ summary: 'Create a new receiving plan' })
  create(@Body() dto: CreateReceivingPlanDto, @CurrentUser() user: any) {
    return this.receivingPlanService.create(dto, user?.userId, user?.companyId);
  }

  @Post('bulk')
  @Permissions('RECEIVING_PLAN_CREATE')
  @ApiOperation({ summary: 'Bulk create receiving plans from a purchase order' })
  bulkCreate(@Body() dto: BulkCreateReceivingPlanDto, @CurrentUser() user: any) {
    return this.receivingPlanService.bulkCreate(dto, user?.userId, user?.companyId);
  }

  @Get()
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get all receiving plans' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ReceivingPlanStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'poNumber', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: ReceivingPlanStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('poNumber') poNumber?: string,
    @CurrentUser() user?: any,
  ) {
    return this.receivingPlanService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      warehouseId,
      poNumber,
      companyId: user?.companyId,
    });
  }

  @Get('planner-data')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get planner dashboard data: PO items with planned/unplanned quantities' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPlannerData(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.receivingPlanService.getPlannerData(
      {
        userId: user?.userId,
        companyId: user?.companyId,
        warehouseId: user?.warehouseId,
        name: user?.name,
      },
      { search, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 100 },
    );
  }

  @Get('workflow-tracker')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get workflow tracker data: plan → PO → GRN → production pipeline' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWorkflowTracker(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ) {
    return this.receivingPlanService.getWorkflowTracker(
      user?.companyId,
      { search, page: page ? Number(page) : 1, limit: limit ? Number(limit) : 50 },
    );
  }

  @Get('grn-list')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'List all GRNs with search/filter/pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  listAllGrns(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.receivingPlanService.listAllGrns({
      companyId: user?.companyId,
      search,
      warehouseId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('grn/:grnId')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get GRN details with items' })
  getGrnDetails(@Param('grnId') grnId: string, @CurrentUser() user: any) {
    return this.receivingPlanService.getGrnWithItems(grnId, user?.companyId);
  }

  @Get(':id/pdf')
  @Permissions('RECEIVING_PLAN_VIEW')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download receiving plan PDF' })
  async getPdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.receivingPlanPdfService.generateReceivingPlanPdf(id, user?.companyId);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    (stream as any).pipe(res);
  }

  @Get(':id')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get receiving plan by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receivingPlanService.findOne(id, user?.companyId);
  }

  @Patch(':id')
  @Permissions('RECEIVING_PLAN_EDIT')
  @ApiOperation({ summary: 'Update receiving plan' })
  update(@Param('id') id: string, @Body() dto: UpdateReceivingPlanDto, @CurrentUser() user: any) {
    return this.receivingPlanService.update(id, dto, user?.userId, user?.companyId);
  }

  @Patch(':id/receive')
  @Permissions('RECEIVING_PLAN_EDIT')
  @ApiOperation({ summary: 'Update received quantity for a receiving plan' })
  updateReceivedQty(@Param('id') id: string, @Body() dto: UpdateReceivedQtyDto, @CurrentUser() user: any) {
    return this.receivingPlanService.updateReceivedQty(id, dto, user?.companyId);
  }

  @Delete(':id')
  @Permissions('RECEIVING_PLAN_DELETE')
  @ApiOperation({ summary: 'Cancel a receiving plan' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receivingPlanService.cancel(id, user?.userId, user?.companyId);
  }

  @Post(':id/grn')
  @Permissions('RECEIVING_PLAN_EDIT')
  @ApiOperation({ summary: 'Submit goods receiving (GRN) against a receiving plan' })
  submitGoodsReceiving(
    @Param('id') id: string,
    @Body() dto: SubmitGoodsReceivingDto,
    @CurrentUser() user: any,
  ) {
    return this.receivingPlanService.submitGoodsReceiving(
      id,
      dto,
      user?.userId,
      user?.name || user?.email || user?.userId,
      user?.companyId,
    );
  }

  @Get(':id/grn-history')
  @Permissions('RECEIVING_PLAN_VIEW')
  @ApiOperation({ summary: 'Get GRN history for a receiving plan' })
  getGrnHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.receivingPlanService.getGrnHistory(id, user?.companyId);
  }

  @Post('bulk-grn')
  @Permissions('RECEIVING_PLAN_EDIT')
  @ApiOperation({ summary: 'Submit bulk goods receiving (multiple items, shared invoice/transport)' })
  submitBulkGoodsReceiving(
    @Body() dto: SubmitBulkGoodsReceivingDto,
    @CurrentUser() user: any,
  ) {
    return this.receivingPlanService.submitBulkGoodsReceiving(
      dto,
      user?.userId,
      user?.name || user?.email || user?.userId,
      user?.companyId,
    );
  }

  @Post('multi-grn')
  @Permissions('RECEIVING_PLAN_EDIT')
  @ApiOperation({ summary: 'Submit multi goods receiving (with duplicate detection and two-phase validation)' })
  submitMultiGoodsReceiving(
    @Body() dto: SubmitMultiGoodsReceivingDto,
    @CurrentUser() user: any,
  ) {
    return this.receivingPlanService.submitMultiGoodsReceiving(
      dto,
      user?.userId,
      user?.name || user?.email || user?.userId,
      user?.companyId,
    );
  }

  @Post('allocate')
  @Permissions('RECEIVING_PLAN_CREATE')
  @ApiOperation({ summary: 'Allocate a PO item to one or more warehouses (split allocation)' })
  allocateToWarehouses(@Body() dto: AllocateToWarehousesDto, @CurrentUser() user: any) {
    return this.receivingPlanService.allocateToWarehouses(
      dto,
      user?.userId,
      user?.name || user?.email || user?.userId,
      user?.companyId,
    );
  }

  @Post('bulk-allocate')
  @Permissions('RECEIVING_PLAN_CREATE')
  @ApiOperation({ summary: 'Bulk allocate multiple PO items to warehouses' })
  bulkAllocate(@Body() dto: BulkAllocateDto, @CurrentUser() user: any) {
    return this.receivingPlanService.bulkAllocate(
      dto,
      user?.userId,
      user?.name || user?.email || user?.userId,
      user?.companyId,
    );
  }

  @Post('sync-from-approved-pos')
  @Permissions('RECEIVING_PLAN_CREATE')
  @ApiOperation({ summary: 'Create receiving plans for all approved POs that do not have plans yet' })
  syncFromApprovedPOs(@CurrentUser() user: any) {
    return this.receivingPlanService.syncFromApprovedPOs(user?.userId, user?.companyId);
  }
}
