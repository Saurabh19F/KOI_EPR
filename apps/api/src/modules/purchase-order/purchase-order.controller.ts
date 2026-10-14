import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderPdfService } from './purchase-order-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreateGoodsReceiptNoteDto,
  CreatePurchaseInvoiceDto,
  CreateDebitNoteDto,
  CreateVendorMasterDto,
  UpdateVendorMasterDto,
  SubmitForApprovalDto,
  ApproveRejectDto,
} from './dto/purchase-order.dto';
import { PurchaseOrderStatus } from './entities/purchase-order.entity';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly purchaseOrderPdfService: PurchaseOrderPdfService,
  ) {}

  // ============ PURCHASE ORDERS ============

  @Post()
  @Permissions('PURCHASE_CREATE')
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.createPurchaseOrder(dto, user?.userId, user?.companyId);
  }

  @Get()
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  @ApiQuery({ name: 'purchasePersonId', required: false, type: String })
  @ApiQuery({ name: 'myOrders', required: false, type: Boolean })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('purchasePersonId') purchasePersonId?: string,
    @Query('myOrders') myOrders?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.sub || user?.userId;
    const userRoles: string[] = (user?.roles || []).map((r: string) => r.toUpperCase());
    const isPurchaseUser = userRoles.includes('PURCHASE_USER');
    const canViewAll = user?.isSuperAdmin || userRoles.includes('ADMIN') || userRoles.includes('PURCHASE_MANAGER') || userRoles.includes('MANAGEMENT');

    let effectivePurchasePersonId = purchasePersonId;
    if (myOrders === 'true') {
      effectivePurchasePersonId = userId;
    } else if (isPurchaseUser && !canViewAll) {
      effectivePurchasePersonId = userId;
    }

    return this.purchaseOrderService.findAllPurchaseOrders({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      purchasePersonId: effectivePurchasePersonId,
      companyId: user?.companyId,
    });
  }

  @Get('by-vendor/:vendorId')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all orders for a specific vendor' })
  findByVendor(@Param('vendorId') vendorId: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findOrdersByVendor(vendorId, user?.companyId);
  }

  @Get('stats')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get purchase statistics' })
  getStats(@CurrentUser() user: any) {
    return this.purchaseOrderService.getPurchaseStatistics(user?.companyId);
  }

  // ============ GOODS RECEIPT NOTES ============

  @Post('grns')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Create a goods receipt note' })
  createGrn(@Body() dto: CreateGoodsReceiptNoteDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.createGoodsReceiptNote(dto, user?.userId, user?.companyId);
  }

  @Get('grns')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all GRNs' })
  getGrns(@Query() query: any, @CurrentUser() user: any) {
    return this.purchaseOrderService.findAllGrns({ ...query, companyId: user?.companyId });
  }

  @Get('grns/:id')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get GRN by ID' })
  getGrn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findGrnById(id, user?.companyId);
  }

  // ============ PURCHASE INVOICES ============

  @Post('invoices')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Create a purchase invoice' })
  createInvoice(@Body() dto: CreatePurchaseInvoiceDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.createPurchaseInvoice(dto, user?.userId, user?.companyId);
  }

  @Get('invoices')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all purchase invoices' })
  getInvoices(@Query() query: any, @CurrentUser() user: any) {
    return this.purchaseOrderService.findAllPurchaseInvoices({ ...query, companyId: user?.companyId });
  }

  @Get('invoices/:id')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get purchase invoice by ID' })
  getInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findPurchaseInvoiceById(id, user?.companyId);
  }

  // ============ DEBIT NOTES ============

  @Post('debit-notes')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Create a debit note' })
  createDebitNote(@Body() dto: CreateDebitNoteDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.createDebitNote(dto, user?.userId, user?.companyId);
  }

  // ============ VENDOR MASTER ============

  @Post('vendors')
  @Permissions('PURCHASE_CREATE')
  @ApiOperation({ summary: 'Create a vendor' })
  createVendor(@Body() dto: CreateVendorMasterDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.createVendor(dto, user?.userId, user?.companyId);
  }

  @Get('vendors')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all vendors' })
  findAllVendors(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrderService.findAllVendors({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      category,
      companyId: user?.companyId,
    });
  }

  @Get('vendors/:id')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get vendor by ID' })
  findVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findVendorById(id, user?.companyId);
  }

  @Patch('vendors/:id')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Update vendor' })
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorMasterDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.updateVendor(id, dto, user?.userId, user?.companyId);
  }

  @Delete('vendors/:id')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Soft delete vendor' })
  deleteVendor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.deleteVendor(id, user?.companyId);
  }

  // ============ PO APPROVAL WORKFLOW ============

  @Post('approvals/submit')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Submit PO for approval' })
  submitForApproval(@Body() dto: SubmitForApprovalDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.submitForApproval(dto, user?.userId, user?.name || user?.email, user?.companyId);
  }

  @Get('approvals')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get all approval requests' })
  findAllApprovals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrderService.findAllApprovals({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      companyId: user?.companyId,
    });
  }

  @Patch('approvals/:id/approve')
  @Permissions('PURCHASE_APPROVE')
  @ApiOperation({ summary: 'Approve a PO' })
  approveOrderApproval(@Param('id') id: string, @Body() dto: ApproveRejectDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.approveOrder(id, dto, user?.userId, user?.name || user?.email, user?.companyId);
  }

  @Patch('approvals/:id/reject')
  @Permissions('PURCHASE_APPROVE')
  @ApiOperation({ summary: 'Reject a PO' })
  rejectOrderApproval(@Param('id') id: string, @Body() dto: ApproveRejectDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.rejectOrder(id, dto, user?.userId, user?.name || user?.email, user?.companyId);
  }

  // ============ ORDER SHEET / TRACKING ============

  @Get('order-sheet')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get order sheet view' })
  getOrderSheet(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('purchasePerson') purchasePerson?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrderService.getOrderSheet({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      purchasePerson,
      fromDate,
      toDate,
      companyId: user?.companyId,
    });
  }

  @Get('tracking-fms')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get PO tracking FMS summary' })
  getTrackingFMS(@CurrentUser() user: any) {
    return this.purchaseOrderService.getPOTrackingFMS(user?.companyId);
  }

  @Get('database')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get database view of all PO items' })
  getDatabaseView(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrderService.getDatabaseView({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
      search,
      fromDate,
      toDate,
      companyId: user?.companyId,
    });
  }

  // ============ ACCOUNTANT REVIEW ============

  @Get('accountant-review')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get POs for accountant review (approved POs)' })
  getAccountantReview(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('activityStatus') activityStatus?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseOrderService.getAccountantReviewList({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      activityStatus,
      companyId: user?.companyId,
    });
  }

  @Patch('accountant-review/:id/activity1')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Update Activity-01 (Accountant) fields' })
  updateActivity1(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrderService.updateActivity1(id, dto, user?.userId, user?.companyId);
  }

  @Patch('accountant-review/:id/activity2')
  @Permissions('ACCOUNTS_APPROVE')
  @ApiOperation({ summary: 'Update Activity-02 (Chief Accountant) fields' })
  updateActivity2(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrderService.updateActivity2(id, dto, user?.userId, user?.companyId);
  }

  @Get(':id/pdf')
  @Permissions('PURCHASE_VIEW')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download purchase order PDF' })
  async getPdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.purchaseOrderPdfService.generatePurchaseOrderPdf(id, user?.companyId);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  @Get(':id')
  @Permissions('PURCHASE_VIEW')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.findPurchaseOrderById(id, user?.companyId);
  }

  @Patch(':id')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Update purchase order' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto, @CurrentUser() user: any) {
    return this.purchaseOrderService.updatePurchaseOrder(id, dto, user?.companyId);
  }

  @Patch(':id/approve')
  @Permissions('PURCHASE_APPROVE')
  @ApiOperation({ summary: 'Approve purchase order' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.approvePurchaseOrder(id, user?.userId, user?.companyId);
  }

  @Patch(':id/cancel')
  @Permissions('PURCHASE_EDIT')
  @ApiOperation({ summary: 'Cancel purchase order' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseOrderService.cancelPurchaseOrder(id, user?.companyId);
  }
}
