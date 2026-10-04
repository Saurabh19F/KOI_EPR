import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UploadLedgerDto, UpdateLedgerDto, ApproveLedgerDto, RejectLedgerDto } from './dto/accounts.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('stats')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get accounts dashboard stats' })
  getStats(@CurrentUser() user: any) {
    return this.accountsService.getStats(user?.companyId);
  }

  @Get('pending-pos')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get approved POs pending ledger entry' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getPendingPOs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.accountsService.getPendingForLedger(user?.companyId, { page, limit, search });
  }

  @Get('ledger')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get all ledger entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  getLedgerEntries(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.accountsService.getLedgerEntries(user?.companyId, { page, limit, status, search });
  }

  @Get('indent-to-po')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get indent to PO tracking for accountant' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getIndentToPO(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.accountsService.getIndentToPO(user?.companyId, { page, limit, search });
  }

  @Get('po/:id')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get PO details with items for accountant view' })
  getPODetails(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.getPODetails(id, user?.companyId);
  }

  @Get('ledger/:id')
  @Permissions('ACCOUNTS_VIEW')
  @ApiOperation({ summary: 'Get single ledger entry' })
  getLedgerEntry(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.getLedgerEntry(id, user?.companyId);
  }

  @Post('ledger')
  @Permissions('ACCOUNTS_CREATE')
  @ApiOperation({ summary: 'Upload ledger for a PO (Accountant)' })
  uploadLedger(@Body() dto: UploadLedgerDto, @CurrentUser() user: any) {
    return this.accountsService.uploadLedger(
      dto,
      user?.userId,
      user?.name || user?.email,
      user?.companyId,
    );
  }

  @Patch('ledger/:id')
  @Permissions('ACCOUNTS_CREATE')
  @ApiOperation({ summary: 'Update ledger entry (Accountant)' })
  updateLedger(@Param('id') id: string, @Body() dto: UpdateLedgerDto, @CurrentUser() user: any) {
    return this.accountsService.updateLedger(id, dto, user?.userId, user?.companyId);
  }

  @Patch('ledger/:id/approve')
  @Permissions('ACCOUNTS_APPROVE')
  @ApiOperation({ summary: 'Approve ledger entry (Chief Accountant)' })
  approveLedger(@Param('id') id: string, @Body() dto: ApproveLedgerDto, @CurrentUser() user: any) {
    return this.accountsService.approveLedger(
      id,
      dto,
      user?.userId,
      user?.name || user?.email,
      user?.companyId,
    );
  }

  @Patch('ledger/:id/reject')
  @Permissions('ACCOUNTS_APPROVE')
  @ApiOperation({ summary: 'Reject ledger entry (Chief Accountant)' })
  rejectLedger(@Param('id') id: string, @Body() dto: RejectLedgerDto, @CurrentUser() user: any) {
    return this.accountsService.rejectLedger(
      id,
      dto,
      user?.userId,
      user?.name || user?.email,
      user?.companyId,
    );
  }
}
