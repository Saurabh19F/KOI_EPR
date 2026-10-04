import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, Delete, Res, Header, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { PurchaseService } from './purchase.service';
import { PurchaseIndentService } from './purchase-indent.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchaseStatus } from './entities/purchase-quote.entity';
import { CreatePurchaseQuoteDto, UpdatePurchaseQuoteDto, CreatePurchaseQuoteItemDto } from '../../common/dto/create-purchase.dto';
import { CreateVendorQuoteEntryDto } from '../../common/dto/create-purchase.dto';
import { CreatePurchaseLabelDto, UpdatePurchaseLabelDto } from '../../common/dto/create-purchase.dto';
import { AutoSelectDto } from './dto/vendor-comparison.dto';
import { GenerateQuotationDto } from './dto/quotation.dto';
import {
  CreatePurchaseIndentItemDto,
  UpdatePurchaseIndentItemDto,
  BulkCreateIndentDto,
  MarkIndentRaisedDto,
  IndentDashboardQueryDto,
} from './dto/purchase-indent.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('purchase')
@UseGuards(JwtAuthGuard)
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly purchaseIndentService: PurchaseIndentService,
    private readonly quotationPdfService: QuotationPdfService,
  ) {}

  // ========== PURCHASE QUOTES ==========
  @Post('quotes')
  createQuote(@Body() dto: CreatePurchaseQuoteDto, @CurrentUser() user: any) {
    return this.purchaseService.createQuote(dto, user?.userId, user);
  }

  @Post('quotes/from-enquiry/:enquiryId')
  createQuoteFromEnquiry(@Param('enquiryId') enquiryId: string, @Body() dto: CreatePurchaseQuoteDto, @CurrentUser() user: any) {
    return this.purchaseService.createQuoteFromEnquiry(enquiryId, dto, user?.userId, user);
  }

  @Get('quotes')
  findAllQuotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: PurchaseStatus,
    @Query('customerId') customerId?: string,
    @Query('enquiryOrderId') enquiryOrderId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseService.findAllQuotes({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      customerId,
      enquiryOrderId,
      currentUser: user,
    });
  }

  @Get('quotes/:id')
  findQuote(@Param('id') id: string) {
    return this.purchaseService.findQuoteById(id);
  }

  @Get('quotes/number/:quoteNo')
  findQuoteByNumber(@Param('quoteNo') quoteNo: string) {
    return this.purchaseService.findQuoteByNumber(quoteNo);
  }

  @Patch('quotes/:id')
  updateQuote(@Param('id') id: string, @Body() dto: UpdatePurchaseQuoteDto, @Request() req: any) {
    return this.purchaseService.updateQuote(id, dto, req.user?.userId);
  }

  @Patch('quotes/:id/status')
  updateQuoteStatus(
    @Param('id') id: string,
    @Body('status') status: PurchaseStatus,
    @Body('remarks') remarks?: string,
    @Request() req?: any,
  ) {
    return this.purchaseService.updateQuoteStatus(id, status, remarks, req?.user?.userId);
  }

  @Post('quotes/:id/submit')
  submitQuote(@Param('id') id: string, @Request() req: any) {
    return this.purchaseService.updateQuoteStatus(id, PurchaseStatus.SUBMITTED, undefined, req.user?.userId);
  }

  @Post('quotes/:id/approve')
  approveQuote(@Param('id') id: string, @Body('remarks') remarks?: string, @Request() req?: any) {
    return this.purchaseService.updateQuoteStatus(id, PurchaseStatus.APPROVED, remarks, req?.user?.userId);
  }

  @Post('quotes/:id/convert-to-po')
  convertToPO(
    @Param('id') id: string,
    @Body() body: { vendorId: string; vendorName: string; vendorCode?: string; vendorGstin?: string; billingAddress?: string; shippingAddress?: string; expectedDeliveryDate?: Date; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.purchaseService.convertQuoteToPO(id, body, user);
  }

  @Delete('quotes/:id')
  deleteQuote(@Param('id') id: string) {
    return this.purchaseService.deleteQuote(id);
  }

  // ========== PURCHASE QUOTE ITEMS ==========
  @Post('quotes/:id/items')
  addItems(@Param('id') id: string, @Body() items: CreatePurchaseQuoteItemDto[], @CurrentUser() user: any) {
    return this.purchaseService.addItemsToQuote(id, items, user?.userId || user?.sub, user);
  }

  @Patch('items/:itemId')
  updateQuoteItem(@Param('itemId') itemId: string, @Body() data: any, @CurrentUser() user: any) {
    return this.purchaseService.updateQuoteItem(itemId, data, user?.userId || user?.sub, user);
  }

  @Delete('items/:itemId')
  deleteQuoteItem(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.purchaseService.deleteQuoteItem(itemId, user);
  }

  // ========== VENDOR QUOTES ==========
  @Post('vendor-quotes')
  createVendorQuote(@Body() dto: CreateVendorQuoteEntryDto, @Request() req: any) {
    return this.purchaseService.createVendorQuote(dto, req.user?.userId);
  }

  @Get('quotes/:quoteId/vendor-quotes')
  getVendorQuotesForQuote(@Param('quoteId') quoteId: string) {
    return this.purchaseService.compareVendorQuotes(quoteId);
  }

  @Get('items/:itemId/vendor-quotes')
  getVendorQuotesForItem(@Param('itemId') itemId: string) {
    return this.purchaseService.findVendorQuotesByItem(itemId);
  }

  @Post('vendor-quotes/:vendorQuoteId/select')
  selectVendorQuote(@Param('vendorQuoteId') vendorQuoteId: string, @Request() req: any) {
    return this.purchaseService.selectVendorQuote(vendorQuoteId, req.user?.userId);
  }

  @Get('quotes/:quoteId/compare')
  compareVendors(@Param('quoteId') quoteId: string) {
    return this.purchaseService.compareVendorQuotes(quoteId);
  }

  @Get('quotes/:quoteId/compare/enhanced')
  getEnhancedComparison(@Param('quoteId') quoteId: string) {
    return this.purchaseService.getEnhancedComparison(quoteId);
  }

  @Get('quotes/:quoteId/compare/export')
  exportComparison(
    @Param('quoteId') quoteId: string,
    @Query('format') format?: 'pdf' | 'excel',
  ) {
    return this.purchaseService.exportComparison(quoteId, format || 'pdf');
  }

  @Post('quotes/:quoteId/auto-select')
  autoSelectVendors(
    @Param('quoteId') quoteId: string,
    @Body() dto: AutoSelectDto,
  ) {
    return this.purchaseService.autoSelectVendors({ ...dto, quoteId });
  }

  // ========== LABELS ==========
  @Post('labels')
  createLabel(@Body() dto: CreatePurchaseLabelDto, @Request() req: any) {
    return this.purchaseService.createLabel(dto, req.user?.userId);
  }

  @Get('labels')
  findAllLabels(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.purchaseService.findAllLabels({ page, limit, search, status });
  }

  @Get('labels/:id')
  findLabel(@Param('id') id: string) {
    return this.purchaseService.findLabelById(id);
  }

  @Patch('labels/:id')
  updateLabel(@Param('id') id: string, @Body() dto: UpdatePurchaseLabelDto, @Request() req: any) {
    return this.purchaseService.updateLabel(id, dto, req.user?.userId);
  }

  @Delete('labels/:id')
  deleteLabel(@Param('id') id: string) {
    return this.purchaseService.deleteLabel(id);
  }

  @Post('labels/:id/assign-designer')
  assignDesigner(
    @Param('id') id: string,
    @Body('designerId') designerId: string,
    @Body('designerName') designerName: string,
    @Request() req: any,
  ) {
    return this.purchaseService.updateLabel(id, { designerId, designerName, status: 'assigned' }, req.user?.userId);
  }

  @Post('labels/:id/complete')
  completeLabel(@Param('id') id: string, @Body() dto: UpdatePurchaseLabelDto, @Request() req: any) {
    return this.purchaseService.updateLabel(id, { ...dto, status: 'final_uploaded', actualDate: new Date() }, req.user?.userId);
  }

  // ========== QUOTATION PDF ==========
  @Get('quotes/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async generateQuotationPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, filename } = await this.quotationPdfService.generateQuotationPdfStream(id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream as any);
  }

  @Get('quotes/:id/cost-breakdown')
  getCostBreakdown(@Param('id') id: string) {
    return this.quotationPdfService.generateCostBreakdown(id);
  }

  // ========== PURCHASE INDENT DASHBOARD ==========
  @Get('indent/dashboard')
  getIndentDashboard(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('salesPersonName') salesPersonName?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.getIndentDashboard(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        search,
        salesPersonName,
        status,
        fromDate,
        toDate,
      },
      user?.companyId,
    );
  }

  @Get('indent/report')
  getIndentReport(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('salesPersonName') salesPersonName?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.getIndentReport(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 100,
        search,
        salesPersonName,
        assignedTo,
        status,
        fromDate,
        toDate,
      },
      user?.companyId,
    );
  }

  @Get('indent/pendancy')
  getIndentPendancy(@CurrentUser() user?: any) {
    return this.purchaseIndentService.getIndentPendancy(user?.companyId);
  }

  @Get('indent/stats')
  getIndentStats(@CurrentUser() user?: any) {
    return this.purchaseIndentService.getIndentStats(user?.companyId);
  }

  @Get('indent/items/order/:orderNo')
  getIndentItemsByOrder(@Param('orderNo') orderNo: string, @CurrentUser() user?: any) {
    return this.purchaseIndentService.findIndentItemsByOrder(orderNo, user?.companyId);
  }

  @Get('indent/items/assignee/:assignedTo')
  getIndentItemsByAssignee(@Param('assignedTo') assignedTo: string, @CurrentUser() user?: any) {
    return this.purchaseIndentService.findIndentItemsByAssignee(assignedTo, user?.companyId);
  }

  @Post('indent/items')
  createIndentItem(@Body() dto: CreatePurchaseIndentItemDto, @CurrentUser() user?: any) {
    return this.purchaseIndentService.createIndentItem(dto, user?.userId, user?.companyId);
  }

  @Post('indent/bulk-create')
  bulkCreateIndents(@Body() dto: BulkCreateIndentDto, @CurrentUser() user?: any) {
    return this.purchaseIndentService.bulkCreateIndents(dto, user?.userId, user?.companyId);
  }

  @Patch('indent/items/:id')
  updateIndentItem(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseIndentItemDto,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.updateIndentItem(id, dto, user?.userId);
  }

  @Post('indent/mark-raised/:id')
  markIndentRaised(
    @Param('id') id: string,
    @Body() dto: MarkIndentRaisedDto,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.markIndentRaised(id, dto, user?.userId);
  }

  @Post('indent/sync/:enquiryOrderId')
  syncFromSalesEnquiry(
    @Param('enquiryOrderId') enquiryOrderId: string,
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.syncFromSalesEnquiry(enquiryOrderId, user?.userId, user?.companyId);
  }

  @Post('indent/assign')
  assignItemsToPerson(
    @Body() body: { itemIds: string[]; assignedTo: string; assignedToName: string },
    @CurrentUser() user?: any,
  ) {
    return this.purchaseIndentService.assignItemsToPerson(
      body.itemIds,
      body.assignedTo,
      body.assignedToName,
      user?.userId,
    );
  }
}
