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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateEnquiryDto, UpdateEnquiryDto, UpdateEnquiryItemDto } from '../../common/dto/create-sales.dto';
import { EnquiryStatus } from './entities/sales-enquiry.entity';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales-enquiries')
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  // ========== ENQUIRIES ==========
  @Post()
  @ApiOperation({ summary: 'Create a new sales enquiry' })
  @ApiResponse({ status: 201, description: 'Enquiry created successfully' })
  create(@Body() dto: CreateEnquiryDto, @CurrentUser() user: any) {
    return this.salesService.createEnquiry(dto, user?.sub || user?.userId, null, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all enquiries with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: EnquiryStatus })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'createdBy', required: false, type: String })
  @ApiQuery({ name: 'unassigned', required: false, type: Boolean })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: EnquiryStatus,
    @Query('customerId') customerId?: string,
    @Query('createdBy') createdBy?: string,
    @Query('unassigned') unassigned?: string,
    @CurrentUser() user?: any,
  ) {
    return this.salesService.findAllEnquiries({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      status,
      customerId,
      createdBy,
      unassigned: unassigned === 'true',
      currentUser: user,
    });
  }

  @Get('lookup/purchase-users')
  @ApiOperation({ summary: 'Get users in the Purchase department (for dropdowns)' })
  getPurchaseUsers(@CurrentUser() user: any) {
    return this.salesService.getPurchaseUsers(user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get enquiry statistics' })
  getStats() {
    return this.salesService.getEnquiryStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enquiry by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.findEnquiryById(id);
  }

  @Get('number/:enquiryNumber')
  @ApiOperation({ summary: 'Get enquiry by enquiry number' })
  findByNumber(@Param('enquiryNumber') enquiryNumber: string) {
    return this.salesService.findEnquiryByNumber(enquiryNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an enquiry' })
  update(@Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    return this.salesService.updateEnquiry(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update enquiry status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: EnquiryStatus; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.salesService.updateEnquiryStatus(
      id,
      body.status,
      user?.sub || user?.userId,
      body.remarks,
      user?.companyId,
      user?.roles,
    );
  }

  @Post(':id/convert-to-sales-order')
  @ApiOperation({ summary: 'Convert a won enquiry into a sales order' })
  convertToSalesOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.convertEnquiryToSalesOrder(
      id,
      user?.sub || user?.userId,
      user?.companyId,
    );
  }

  @Post(':id/mis-review')
  @ApiOperation({ summary: 'Submit MIS review: approve or request requote' })
  misReview(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'requote'; remarks: string; requoteItemIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.salesService.misReview(
      id,
      body.action,
      body.remarks,
      user?.sub || user?.userId,
      body.requoteItemIds,
    );
  }

  @Get(':id/status-transitions')
  @ApiOperation({ summary: 'Get available status transitions' })
  getStatusTransitions(@Param('id') id: string) {
    return this.salesService.findEnquiryById(id).then((e) =>
      this.salesService.getStatusTransitions(e.status),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an enquiry (soft delete)' })
  delete(@Param('id') id: string) {
    return this.salesService.deleteEnquiry(id);
  }

  // ========== ENQUIRY ITEMS ==========
  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to enquiry' })
  addItem(@Param('id') id: string, @Body() data: any) {
    return this.salesService.addEnquiryItem(id, data);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Get all items for an enquiry' })
  getItems(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesService.getEnquiryItems(id, user);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update an enquiry item' })
  updateItem(@Param('itemId') id: string, @Body() dto: UpdateEnquiryItemDto) {
    return this.salesService.updateEnquiryItem(id, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an enquiry item' })
  deleteItem(@Param('itemId') id: string) {
    return this.salesService.deleteEnquiryItem(id);
  }

  // ========== DOCUMENTS ==========
  @Post(':id/documents')
  @ApiOperation({ summary: 'Add document to enquiry' })
  addDocument(@Param('id') id: string, @Body() data: any) {
    return this.salesService.addDocument(id, data);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all documents for an enquiry' })
  getDocuments(@Param('id') id: string) {
    return this.salesService.getDocuments(id);
  }

  @Delete('documents/:documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a document' })
  deleteDocument(@Param('documentId') id: string) {
    return this.salesService.deleteDocument(id);
  }

  // ========== PUNCHING LOGS ==========
  @Get(':id/punching-logs')
  @ApiOperation({ summary: 'Get all punching logs for an enquiry' })
  getPunchingLogs(@Param('id') id: string) {
    return this.salesService.getPunchingLogs(id);
  }

  // ========== REMINDERS ==========
  @Get(':id/reminders')
  @ApiOperation({ summary: 'Get all reminders for an enquiry' })
  getReminders(@Param('id') id: string) {
    return this.salesService.getReminders(id);
  }

  @Post(':id/reminders')
  @ApiOperation({ summary: 'Add reminder to enquiry' })
  addReminder(@Param('id') id: string, @Body() data: any) {
    return this.salesService.addReminder(id, data);
  }

  @Get('reminders/pending')
  @ApiOperation({ summary: 'Get all pending reminders' })
  getPendingReminders() {
    return this.salesService.getPendingReminders();
  }

  @Patch('reminders/:reminderId/sent')
  @ApiOperation({ summary: 'Mark reminder as sent' })
  markReminderSent(@Param('reminderId') id: string) {
    return this.salesService.markReminderSent(id);
  }
}
