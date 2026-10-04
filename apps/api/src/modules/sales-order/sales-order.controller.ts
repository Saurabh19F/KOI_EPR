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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesOrderService } from './sales-order.service';
import { SalesInvoicePdfService } from './sales-invoice-pdf.service';
import { SalesQuotationPdfService } from './sales-quotation-pdf.service';
import { SalesOrderSheetPdfService } from './sales-order-sheet-pdf.service';
import { SalesOrderEventsListener } from './sales-order-events.listener';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  CreateDeliveryNoteDto,
  CreateSalesInvoiceDto,
  CreateCreditNoteDto,
  PaginationDto,
} from './dto/sales-order.dto';
import { SalesOrderStatus, InvoiceStatus } from './entities/sales-order.entity';

@ApiTags('sales-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales-orders')
export class SalesOrderController {
  constructor(
    private readonly salesOrderService: SalesOrderService,
    private readonly salesInvoicePdfService: SalesInvoicePdfService,
    private readonly salesQuotationPdfService: SalesQuotationPdfService,
    private readonly salesOrderSheetPdfService: SalesOrderSheetPdfService,
    private readonly salesOrderEventsListener: SalesOrderEventsListener,
  ) {}

  // ============ SALES ORDERS ============

  @Post()
  @Permissions('SALES_CREATE')
  @ApiOperation({ summary: 'Create a new sales order' })
  create(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: any) {
    return this.salesOrderService.createSalesOrder(dto, user?.userId, user?.companyId);
  }

  @Get()
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get all sales orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: SalesOrderStatus })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: SalesOrderStatus,
    @CurrentUser() user?: any,
  ) {
    return this.salesOrderService.findAllSalesOrders({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      companyId: user?.companyId,
    });
  }

  @Get('stats')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get sales statistics' })
  getStats(@CurrentUser() user: any) {
    return this.salesOrderService.getSalesStatistics(user?.companyId);
  }

  // ============ DELIVERY NOTES ============

  @Post('delivery-notes')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Create a delivery note' })
  createDeliveryNote(@Body() dto: CreateDeliveryNoteDto, @CurrentUser() user: any) {
    return this.salesOrderService.createDeliveryNote(dto, user?.userId, user?.companyId);
  }

  @Get('delivery-notes')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get all delivery notes' })
  getDeliveryNotes(@Query() query: any, @CurrentUser() user: any) {
    return this.salesOrderService.findAllDeliveryNotes({ ...query, companyId: user?.companyId });
  }

  @Get('delivery-notes/:id')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get delivery note by ID' })
  getDeliveryNote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderService.findDeliveryNoteById(id, user?.companyId);
  }

  // ============ SALES INVOICES ============

  @Post('invoices')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Create a sales invoice' })
  createInvoice(@Body() dto: CreateSalesInvoiceDto, @CurrentUser() user: any) {
    return this.salesOrderService.createSalesInvoice(dto, user?.userId, user?.companyId);
  }

  @Get('invoices')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get all sales invoices' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  getInvoices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: InvoiceStatus,
    @CurrentUser() user?: any,
  ) {
    return this.salesOrderService.findAllSalesInvoices({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      companyId: user?.companyId,
    });
  }

  @Get('invoices/:id')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get sales invoice by ID' })
  getInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderService.findSalesInvoiceById(id, user?.companyId);
  }

  @Get('invoices/:id/pdf')
  @Permissions('SALES_VIEW')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download sales invoice PDF' })
  async getInvoicePdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { stream, filename } = await this.salesInvoicePdfService.generateInvoicePdf(id, user?.companyId);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  // ============ CREDIT NOTES ============

  @Post('credit-notes')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Create a credit note' })
  createCreditNote(@Body() dto: CreateCreditNoteDto, @CurrentUser() user: any) {
    return this.salesOrderService.createCreditNote(dto, user?.userId, user?.companyId);
  }

  // ============ SALES QUOTATION PDF ============

  @Get(':id/quotation-pdf')
  @Permissions('SALES_VIEW')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download sales quotation PDF' })
  @ApiQuery({ name: 'showGst', required: false, type: Boolean })
  @ApiQuery({ name: 'showDiscount', required: false, type: Boolean })
  async getQuotationPdf(
    @Param('id') id: string,
    @Query('showGst') showGst?: string,
    @Query('showDiscount') showDiscount?: string,
    @CurrentUser() user?: any,
    @Res() res?: Response,
  ) {
    const { stream, filename } = await this.salesQuotationPdfService.generateQuotationPdf(
      id,
      user?.companyId,
      {
        showGst: showGst !== 'false',
        showDiscount: showDiscount !== 'false',
      },
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  @Get(':id/sheet-excel')
  @Permissions('SALES_VIEW')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOperation({ summary: 'Download sales order sheet Excel (with/without rate)' })
  @ApiQuery({ name: 'withRate', required: false, type: Boolean })
  async getSheetExcel(
    @Param('id') id: string,
    @Query('withRate') withRate?: string,
    @CurrentUser() user?: any,
    @Res() res?: Response,
  ) {
    const { buffer, filename } = await this.salesOrderSheetPdfService.generateSheetExcel(
      id,
      user?.companyId,
      withRate !== 'false',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  @Get('number/:orderNumber')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get sales order by number' })
  findByNumber(@Param('orderNumber') orderNumber: string, @CurrentUser() user: any) {
    return this.salesOrderService.findSalesOrderByNumber(orderNumber, user?.companyId);
  }

  @Get(':id')
  @Permissions('SALES_VIEW')
  @ApiOperation({ summary: 'Get sales order by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderService.findSalesOrderById(id, user?.companyId);
  }

  @Patch(':id')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Update sales order' })
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto, @CurrentUser() user: any) {
    return this.salesOrderService.updateSalesOrder(id, dto, user?.companyId);
  }

  @Patch(':id/confirm')
  @Permissions('SALES_APPROVE')
  @ApiOperation({ summary: 'Confirm sales order' })
  confirm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderService.confirmSalesOrder(id, user?.userId, user?.companyId);
  }

  @Patch(':id/cancel')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Cancel sales order' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderService.cancelSalesOrder(id, user?.userId, user?.companyId);
  }

  @Post(':id/generate-pos')
  @Permissions('SALES_APPROVE')
  @ApiOperation({ summary: 'Generate purchase orders from a confirmed sales order' })
  generatePOs(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesOrderEventsListener.generatePurchaseOrders(id, user?.companyId, user?.userId);
  }

  @Patch(':id/repunch')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Re-punch a confirmed sales order with updated data' })
  repunch(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto, @CurrentUser() user: any) {
    return this.salesOrderService.repunchSalesOrder(id, dto, user?.userId, user?.companyId);
  }

  @Post(':id/send-email')
  @Permissions('SALES_EDIT')
  @ApiOperation({ summary: 'Send quotation email to customer' })
  @ApiQuery({ name: 'reQuotation', required: false, type: Boolean })
  async sendEmail(
    @Param('id') id: string,
    @Query('reQuotation') reQuotation?: string,
    @CurrentUser() user?: any,
  ) {
    const order = await this.salesOrderService.findSalesOrderById(id, user?.companyId);
    await this.salesOrderService.sendQuotationEmail(order, reQuotation === 'true');
    return { message: 'Email sent successfully' };
  }

  @Get(':id/export-excel')
  @Permissions('SALES_VIEW')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiOperation({ summary: 'Export sales order as Excel file' })
  async exportExcel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.salesOrderService.exportSalesOrderToExcel(id, user?.companyId);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }
}
