import { Permissions } from '../auth/decorators/permissions.decorator';
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { RateService } from './rate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PriceAnalysisStatus } from './entities/price-analysis.entity';
import { CreatePriceAnalysisDto, UpdatePriceAnalysisDto, UpdatePriceAnalysisItemDto } from '../../common/dto/create-rate.dto';
import { CreateHaulageRateDto, UpdateHaulageRateDto, CreateCurrencyRateDto, UpdateCurrencyRateDto } from '../../common/dto/create-rate.dto';

@Controller('rate')
@UseGuards(JwtAuthGuard)
export class RateController {
  constructor(private readonly rateService: RateService) {}

  // ========== PRICE ANALYSIS ==========
  @Permissions('RATE_CREATE')
  @Post('analysis')
  createAnalysis(@Body() dto: CreatePriceAnalysisDto, @Request() req: any) {
    return this.rateService.createAnalysis(dto, req.user?.userId);
  }

  @Permissions('RATE_CREATE')
  @Post('analysis/from-quote/:quoteId')
  createAnalysisFromQuote(@Param('quoteId') quoteId: string, @Body() dto: CreatePriceAnalysisDto, @Request() req: any) {
    return this.rateService.createAnalysisFromPurchaseQuote(quoteId, dto, req.user?.userId);
  }

  // ========== BULK OPERATIONS (must be before :id routes) ==========
  @Permissions('RATE_CREATE')
  @Post('analysis/bulk-calculate')
  bulkCalculate(@Body() body: { analysisIds: string[] }, @Request() req: any) {
    return this.rateService.bulkCalculate(body.analysisIds, req.user?.userId);
  }

  // ========== ANALYSIS CURRENCY (for frontend compatibility, must be before :id route) ==========
  @Permissions('RATE_VIEW')
  @Get('analysis/currency')
  getAnalysisCurrencyRates() {
    return this.rateService.findAllCurrencyRates();
  }

  @Permissions('RATE_VIEW')
  @Get('analysis')
  findAllAnalysis(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: PriceAnalysisStatus,
    @Query('customerId') customerId?: string,
    @Query('enquiryOrderId') enquiryOrderId?: string,
  ) {
    return this.rateService.findAllAnalysis({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      customerId,
      enquiryOrderId
    });
  }

  @Permissions('RATE_VIEW')
  @Get('analysis/number/:analysisNo')
  findAnalysisByNumber(@Param('analysisNo') analysisNo: string) {
    return this.rateService.findAnalysisByNumber(analysisNo);
  }

  @Permissions('RATE_VIEW')
  @Get('analysis/:id')
  findAnalysis(@Param('id') id: string) {
    return this.rateService.findAnalysisById(id);
  }

  @Permissions('RATE_EDIT')
  @Patch('analysis/:id')
  updateAnalysis(@Param('id') id: string, @Body() dto: UpdatePriceAnalysisDto, @Request() req: any) {
    return this.rateService.updateAnalysis(id, dto, req.user?.userId);
  }

  @Permissions('RATE_EDIT')
  @Patch('analysis/:id/status')
  updateAnalysisStatus(
    @Param('id') id: string,
    @Body('status') status: PriceAnalysisStatus,
    @Body('remarks') remarks?: string,
    @Request() req?: any,
  ) {
    return this.rateService.updateAnalysisStatus(id, status, remarks, req?.user?.userId);
  }

  @Permissions('RATE_CREATE')
  @Post('analysis/:id/calculate')
  calculateAnalysis(@Param('id') id: string, @Request() req: any) {
    return this.rateService.calculateAnalysis(id, req.user?.userId);
  }

  @Permissions('RATE_EDIT')
  @Post('analysis/:id/submit')
  submitAnalysis(@Param('id') id: string, @Request() req: any) {
    return this.rateService.updateAnalysisStatus(id, PriceAnalysisStatus.SUBMITTED, undefined, req.user?.userId);
  }

  @Permissions('RATE_APPROVE')
  @Post('analysis/:id/approve')
  approveAnalysis(@Param('id') id: string, @Body('remarks') remarks?: string, @Request() req?: any) {
    return this.rateService.updateAnalysisStatus(id, PriceAnalysisStatus.APPROVED, remarks, req?.user?.userId);
  }

  @Permissions('RATE_EDIT')
  @Post('analysis/:id/reject')
  rejectAnalysis(@Param('id') id: string, @Body('remarks') remarks?: string, @Request() req?: any) {
    return this.rateService.updateAnalysisStatus(id, PriceAnalysisStatus.REJECTED, remarks, req?.user?.userId);
  }

  @Permissions('RATE_LOCK')
  @Post('analysis/:id/lock')
  lockAnalysis(@Param('id') id: string, @Request() req: any) {
    return this.rateService.updateAnalysisStatus(id, PriceAnalysisStatus.LOCKED, undefined, req.user?.userId);
  }

  @Permissions('RATE_DELETE')
  @Delete('analysis/:id')
  deleteAnalysis(@Param('id') id: string, @Request() req: any) {
    return this.rateService.deleteAnalysis(id, req.user?.userId);
  }

  // ========== VERSION HISTORY ==========
  @Permissions('RATE_VIEW')
  @Get('analysis/:id/versions')
  getVersionHistory(@Param('id') id: string) {
    return this.rateService.getVersionHistory(id);
  }

  @Permissions('RATE_CREATE')
  @Post('analysis/:id/requote')
  createRequote(@Param('id') id: string, @Body() body: { reason: string; remarks?: string }, @Request() req: any) {
    return this.rateService.createRequote(id, body.reason, body.remarks, req.user?.userId);
  }

  // ========== PREVIOUS YEAR COMPARISON ==========
  @Permissions('RATE_VIEW')
  @Get('analysis/:id/previous-year')
  getPreviousYearComparison(@Param('id') id: string) {
    return this.rateService.getPreviousYearComparison(id);
  }

  // ========== ANALYSIS ITEMS ==========
  @Permissions('RATE_CREATE')
  @Post('analysis/:id/items')
  addAnalysisItems(@Param('id') id: string, @Body() items: any[], @Request() req: any) {
    return this.rateService.createAnalysisItem(id, items, 1, req.user?.userId);
  }

  @Permissions('RATE_EDIT')
  @Patch('items/:itemId')
  updateAnalysisItem(@Param('itemId') itemId: string, @Body() dto: UpdatePriceAnalysisItemDto, @Request() req: any) {
    return this.rateService.updateAnalysisItem(itemId, dto, req.user?.userId);
  }

  @Permissions('RATE_DELETE')
  @Delete('items/:itemId')
  deleteAnalysisItem(@Param('itemId') itemId: string) {
    return this.rateService.deleteAnalysisItem(itemId);
  }

  // ========== HAULAGE RATES ==========
  @Permissions('ADMIN_SETTINGS')
  @Post('haulage')
  createHaulageRate(@Body() dto: CreateHaulageRateDto, @Request() req: any) {
    return this.rateService.createHaulageRate(dto, req.user?.userId);
  }

  @Permissions('RATE_VIEW')
  @Get('haulage')
  findAllHaulageRates() {
    return this.rateService.findAllHaulageRates();
  }

  @Permissions('ADMIN_SETTINGS')
  @Patch('haulage/:id')
  updateHaulageRate(@Param('id') id: string, @Body() dto: UpdateHaulageRateDto, @Request() req: any) {
    return this.rateService.updateHaulageRate(id, dto, req.user?.userId);
  }

  @Permissions('ADMIN_SETTINGS')
  @Delete('haulage/:id')
  deleteHaulageRate(@Param('id') id: string) {
    return this.rateService.deleteHaulageRate(id);
  }

  // ========== CURRENCY RATES ==========
  @Permissions('ADMIN_SETTINGS')
  @Post('currency/sync')
  syncCurrencyRates() {
    return this.rateService.syncCurrencyRates();
  }

  @Permissions('ADMIN_SETTINGS')
  @Post('currency')
  createCurrencyRate(@Body() dto: CreateCurrencyRateDto, @Request() req: any) {
    return this.rateService.createCurrencyRate(dto, req.user?.userId);
  }

  @Permissions('RATE_VIEW')
  @Get('currency')
  findAllCurrencyRates() {
    return this.rateService.findAllCurrencyRates();
  }

  @Permissions('ADMIN_SETTINGS')
  @Patch('currency/:id')
  updateCurrencyRate(@Param('id') id: string, @Body() dto: UpdateCurrencyRateDto, @Request() req: any) {
    return this.rateService.updateCurrencyRate(id, dto, req.user?.userId);
  }

  @Permissions('ADMIN_SETTINGS')
  @Delete('currency/:id')
  deleteCurrencyRate(@Param('id') id: string) {
    return this.rateService.deleteCurrencyRate(id);
  }

  // ========== FINAL CURRENCY RATES ==========
  @Permissions('RATE_VIEW')
  @Get('final-currency-rates')
  getFinalCurrencyRates() {
    return this.rateService.getFinalCurrencyRateMasters();
  }

  @Permissions('RATE_EDIT')
  @Patch('final-currency-rates/:id')
  updateFinalCurrencyRate(
    @Param('id') id: string,
    @Body('marginBuffer') margin: number,
    @Request() req: any,
  ) {
    return this.rateService.updateFinalCurrencyRateMaster(id, margin, req.user?.userId);
  }

  // ========== VERSION BY ID ==========
  @Permissions('RATE_VIEW')
  @Get('versions/:versionId')
  getVersionById(@Param('versionId') versionId: string) {
    return this.rateService.getVersionById(versionId);
  }

  // ========== AUDIT LOGS ==========
  @Permissions('REPORTS_VIEW')
  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.rateService.getAuditLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      entityType,
      entityId,
    });
  }

  // ========== FORMULA MASTER ==========
  @Permissions('RATE_VIEW')
  @Get('formulas')
  getFormulas(@Query('type') type?: string) {
    return this.rateService.getFormulas(type);
  }

  @Permissions('ADMIN_SETTINGS')
  @Post('formulas')
  createFormula(@Body() dto: any, @Request() req: any) {
    return this.rateService.createFormula(dto, req.user?.userId);
  }

  @Permissions('ADMIN_SETTINGS')
  @Patch('formulas/:id')
  updateFormula(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.rateService.updateFormula(id, dto, req.user?.userId);
  }
}
