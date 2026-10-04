import { Permissions } from '../auth/decorators/permissions.decorator';
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  CreatePaymentDto,
  PaginationDto,
} from './dto/financial.dto';
import { AccountType } from './entities/account.entity';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ============ ACCOUNTS ============

  @Permissions('ADMIN_SETTINGS')
  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account' })
  createAccount(@Body() dto: CreateAccountDto, @CurrentUser() user: any) {
    return this.financialService.createAccount(dto, user?.userId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'accountType', required: false, enum: AccountType })
  getAccounts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('accountType') accountType?: AccountType,
  ) {
    return this.financialService.findAllAccounts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      accountType,
      companyId: undefined,
    });
  }

  @Permissions('REPORTS_VIEW')
  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  getAccount(@Param('id') id: string) {
    return this.financialService.findAccountById(id);
  }

  @Permissions('REPORTS_VIEW')
  @Get('accounts/code/:code')
  @ApiOperation({ summary: 'Get account by code' })
  getAccountByCode(@Param('code') code: string) {
    return this.financialService.findAccountByCode(code);
  }

  @Permissions('ADMIN_SETTINGS')
  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.financialService.updateAccount(id, dto);
  }

  @Permissions('ADMIN_SETTINGS')
  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete account' })
  deleteAccount(@Param('id') id: string) {
    return this.financialService.deleteAccount(id);
  }

  @Permissions('REPORTS_VIEW')
  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  getAccountBalance(@Param('id') id: string, @Query('asOfDate') asOfDate?: string) {
    return this.financialService.getAccountBalance(
      id,
      asOfDate ? new Date(asOfDate) : undefined
    );
  }

  @Permissions('ADMIN_SETTINGS')
  @Post('accounts/default')
  @ApiOperation({ summary: 'Create default chart of accounts' })
  createDefaultAccounts(@CurrentUser() user: any) {
    return this.financialService.createDefaultAccounts(user?.companyId, user?.userId);
  }

  // ============ JOURNAL ENTRIES ============

  @Permissions('FINANCE_USER')
  @Post('journal-entries')
  @ApiOperation({ summary: 'Create a journal entry' })
  createJournalEntry(@Body() dto: CreateJournalEntryDto, @CurrentUser() user: any) {
    return this.financialService.createJournalEntry(dto, user?.userId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('journal-entries')
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'voucherType', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getJournalEntries(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('voucherType') voucherType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.financialService.findAllJournalEntries({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      voucherType: voucherType as any,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Permissions('REPORTS_VIEW')
  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  getJournalEntry(@Param('id') id: string) {
    return this.financialService.findJournalEntryById(id);
  }

  @Permissions('FINANCE_USER')
  @Patch('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post a journal entry' })
  postJournalEntry(@Param('id') id: string, @CurrentUser() user: any) {
    return this.financialService.postJournalEntry(id, user?.userId);
  }

  @Permissions('FINANCE_USER')
  @Patch('journal-entries/:id')
  @ApiOperation({ summary: 'Update journal entry' })
  updateJournalEntry(@Param('id') id: string, @Body() dto: UpdateJournalEntryDto) {
    return this.financialService.updateJournalEntry(id, dto);
  }

  @Permissions('FINANCE_USER')
  @Delete('journal-entries/:id')
  @ApiOperation({ summary: 'Delete journal entry' })
  deleteJournalEntry(@Param('id') id: string) {
    return this.financialService.deleteJournalEntry(id);
  }

  // ============ PAYMENTS ============

  @Permissions('FINANCE_USER')
  @Post('payments')
  @ApiOperation({ summary: 'Create a payment' })
  createPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.financialService.createPayment(dto, user?.userId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  getPayments(@Query() query: any) {
    return this.financialService.findAllJournalEntries({
      ...query,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  // ============ ACCOUNTS PAYABLE/RECEIVABLE ============

  @Permissions('REPORTS_VIEW')
  @Get('accounts-payable')
  @ApiOperation({ summary: 'Get accounts payable' })
  getAccountsPayable(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.financialService.getAccountsPayable(user?.companyId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
  }

  @Permissions('REPORTS_VIEW')
  @Get('accounts-receivable')
  @ApiOperation({ summary: 'Get accounts receivable' })
  getAccountsReceivable(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.financialService.getAccountsReceivable(user?.companyId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
    });
  }

  // ============ REPORTS ============

  @Permissions('REPORTS_VIEW')
  @Get('reports/ledger/:accountId')
  @ApiOperation({ summary: 'Get ledger report' })
  @ApiQuery({ name: 'fromDate', required: true, type: String })
  @ApiQuery({ name: 'toDate', required: true, type: String })
  getLedgerReport(
    @Param('accountId') accountId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.financialService.getLedgerReport(accountId, new Date(fromDate), new Date(toDate));
  }

  @Permissions('REPORTS_VIEW')
  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  @ApiQuery({ name: 'fromDate', required: true, type: String })
  @ApiQuery({ name: 'toDate', required: true, type: String })
  getTrialBalance(
    @CurrentUser() user: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.financialService.getTrialBalance(new Date(fromDate), new Date(toDate), user?.companyId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  @ApiQuery({ name: 'asOfDate', required: true, type: String })
  getBalanceSheet(
    @CurrentUser() user: any,
    @Query('asOfDate') asOfDate: string,
  ) {
    return this.financialService.getBalanceSheet(new Date(asOfDate), user?.companyId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Get profit and loss statement' })
  @ApiQuery({ name: 'fromDate', required: true, type: String })
  @ApiQuery({ name: 'toDate', required: true, type: String })
  getProfitAndLoss(
    @CurrentUser() user: any,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.financialService.getProfitAndLoss(new Date(fromDate), new Date(toDate), user?.companyId);
  }

  // ============ COST CENTERS ============

  @Permissions('ADMIN_SETTINGS')
  @Post('cost-centers')
  @ApiOperation({ summary: 'Create a cost center' })
  createCostCenter(@Body() dto: any, @CurrentUser() user: any) {
    return this.financialService.createCostCenter(dto, user?.userId);
  }

  @Permissions('REPORTS_VIEW')
  @Get('cost-centers')
  @ApiOperation({ summary: 'Get all cost centers' })
  getCostCenters(@CurrentUser() user: any) {
    return this.financialService.findAllCostCenters(user?.companyId);
  }

  // ============ UTILITIES ============

  @Get('calculate/gst')
  @ApiOperation({ summary: 'Calculate GST' })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  @ApiQuery({ name: 'gstRate', required: true, type: Number })
  calculateGst(@Query('amount') amount: number, @Query('gstRate') gstRate: number) {
    return this.financialService.calculateGst(amount, gstRate);
  }

  @Get('calculate/tds')
  @ApiOperation({ summary: 'Calculate TDS' })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  @ApiQuery({ name: 'tdsRate', required: true, type: Number })
  calculateTds(@Query('amount') amount: number, @Query('tdsRate') tdsRate: number) {
    return this.financialService.calculateTds(amount, tdsRate);
  }
}
