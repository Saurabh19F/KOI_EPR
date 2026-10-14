import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FmsService } from './fms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FmsTaskStatus } from './entities/fms-task.entity';
import { QualityStatus } from './entities/quality-fms-task.entity';
import { PoTrackingStatus } from './entities/po-tracking.entity';

@ApiTags('fms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fms')
export class FmsController {
  constructor(private readonly fmsService: FmsService) {}

  // ========== WORKFLOWS ==========
  @Get('workflows')
  @ApiOperation({ summary: 'Get workflow definitions' })
  getWorkflows(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @CurrentUser() user?: any,
  ) {
    return this.fmsService.findAllWorkflows({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      companyId: user?.companyId,
    });
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow definition by ID' })
  getWorkflow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.fmsService.findWorkflowById(id, user?.companyId);
  }

  @Post('workflows')
  @ApiOperation({ summary: 'Create a workflow definition' })
  createWorkflow(@Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.createWorkflow(data, user);
  }

  @Patch('workflows/:id')
  @ApiOperation({ summary: 'Update a workflow definition' })
  updateWorkflow(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.updateWorkflow(id, data, user);
  }

  @Delete('workflows/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a workflow definition' })
  deleteWorkflow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.fmsService.deleteWorkflow(id, user);
  }

  // ========== TASKS ==========
  @Post('tasks')
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.createTask({ ...data, createdBy: user?.userId });
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Get all tasks with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: FmsTaskStatus })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: FmsTaskStatus,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.fmsService.findAllTasks({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      assignedTo,
    });
  }

  @Get('tasks/my')
  @ApiOperation({ summary: 'Get my tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyTasks(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fmsService.getMyTasks(user?.userId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('tasks/delayed')
  @ApiOperation({ summary: 'Get all delayed tasks' })
  getDelayedTasks() {
    return this.fmsService.getDelayedTasks();
  }

  @Get('tasks/enquiry/:enquiryId')
  @ApiOperation({ summary: 'Get tasks for an enquiry' })
  getTasksByEnquiry(@Param('enquiryId') enquiryId: string) {
    return this.fmsService.getTasksByEnquiry(enquiryId);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(@Param('id') id: string) {
    return this.fmsService.findTaskById(id);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.fmsService.updateTask(id, data);
  }

  @Patch('tasks/:id/assign')
  @ApiOperation({ summary: 'Assign task to user' })
  assign(
    @Param('id') id: string,
    @Body() body: { assignedTo: string },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.assignTask(id, body.assignedTo, user?.userId);
  }

  @Patch('tasks/:id/start')
  @ApiOperation({ summary: 'Start a task' })
  start(@Param('id') id: string) {
    return this.fmsService.startTask(id);
  }

  @Patch('tasks/:id/complete')
  @ApiOperation({ summary: 'Complete a task' })
  complete(
    @Param('id') id: string,
    @Body() body: { remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.completeTask(id, body.remarks, user?.userId);
  }

  @Patch('tasks/:id/escalate')
  @ApiOperation({ summary: 'Escalate a task' })
  escalate(
    @Param('id') id: string,
    @Body() body: { escalatedTo: string; reason: string },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.escalateTask(id, body.escalatedTo, body.reason, user?.userId);
  }

  @Get('tasks/:id/history')
  @ApiOperation({ summary: 'Get task step history' })
  getTaskHistory(@Param('id') id: string) {
    return this.fmsService.getTaskHistory(id);
  }

  @Post('tasks/enquiry/:enquiryId/create-tasks')
  @ApiOperation({ summary: 'Create tasks for enquiry items' })
  createTasksForEnquiry(
    @Param('enquiryId') enquiryId: string,
    @Body() body: { items: Array<{ sku: string; productName: string; quantity: number }> },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.createTasksForEnquiry(
      enquiryId,
      enquiryId, // Will be updated with real enquiry number
      body.items,
      user?.companyId,
      user?.userId,
    );
  }

  @Post('tasks/update-overdue')
  @ApiOperation({ summary: 'Update overdue tasks (cron job)' })
  updateOverdueTasks() {
    return this.fmsService.updateOverdueTasks();
  }

  // ========== DASHBOARD ==========
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  getStats(@Query('userId') userId?: string) {
    return this.fmsService.getDashboardStats(userId);
  }

  // ========== STEPS ==========
  @Get('steps')
  @ApiOperation({ summary: 'Get all FMS steps' })
  getSteps() {
    return this.fmsService.findAllSteps();
  }

  // ========== MASTERS ==========
  @Get('masters')
  @ApiOperation({ summary: 'Get all FMS masters' })
  getMasters() {
    return this.fmsService.findAllMasters();
  }

  // ========== MAIL QUEUE ==========
  @Get('mail-queue/pending')
  @ApiOperation({ summary: 'Get pending emails' })
  getPendingMails() {
    return this.fmsService.getPendingMails();
  }

  @Post('mail-queue')
  @ApiOperation({ summary: 'Add email to queue' })
  addMail(@Body() data: any) {
    return this.fmsService.addMailQueue(data);
  }

  @Patch('mail-queue/:id/sent')
  @ApiOperation({ summary: 'Mark email as sent' })
  markMailSent(@Param('id') id: string) {
    return this.fmsService.markMailSent(id);
  }

  // ========== QUALITY FMS ==========
  @Post('quality')
  @ApiOperation({ summary: 'Create a quality FMS task' })
  createQualityTask(@Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.createQualityTask({ ...data, createdBy: user?.userId, companyId: user?.companyId });
  }

  @Get('quality')
  @ApiOperation({ summary: 'Get all quality FMS tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: QualityStatus })
  @ApiQuery({ name: 'inspectorId', required: false, type: String })
  findAllQualityTasks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: QualityStatus,
    @Query('inspectorId') inspectorId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.fmsService.findAllQualityTasks({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      inspectorId,
      companyId: user?.companyId,
    });
  }

  @Get('quality/:id')
  @ApiOperation({ summary: 'Get quality task by ID' })
  findQualityTask(@Param('id') id: string) {
    return this.fmsService.findQualityTaskById(id);
  }

  @Patch('quality/:id')
  @ApiOperation({ summary: 'Update a quality task' })
  updateQualityTask(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.updateQualityTask(id, { ...data, updatedBy: user?.userId });
  }

  @Patch('quality/:id/status')
  @ApiOperation({ summary: 'Update quality task status' })
  updateQualityStatus(
    @Param('id') id: string,
    @Body() body: { status: QualityStatus; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.updateQualityTask(id, {
      status: body.status,
      remarks: body.remarks,
      updatedBy: user?.userId,
    });
  }

  // ========== PO TRACKING ==========
  @Post('po-tracking')
  @ApiOperation({ summary: 'Create a PO tracking entry' })
  createPoTracking(@Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.createPoTracking({ ...data, createdBy: user?.userId, companyId: user?.companyId });
  }

  @Get('po-tracking')
  @ApiOperation({ summary: 'Get all PO tracking entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PoTrackingStatus })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  findAllPoTracking(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PoTrackingStatus,
    @Query('vendorId') vendorId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.fmsService.findAllPoTracking({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      vendorId,
      companyId: user?.companyId,
    });
  }

  @Get('po-tracking/:id')
  @ApiOperation({ summary: 'Get PO tracking entry by ID' })
  findPoTracking(@Param('id') id: string) {
    return this.fmsService.findPoTrackingById(id);
  }

  @Patch('po-tracking/:id')
  @ApiOperation({ summary: 'Update a PO tracking entry' })
  updatePoTracking(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.fmsService.updatePoTracking(id, { ...data, updatedBy: user?.userId });
  }

  @Patch('po-tracking/:id/status')
  @ApiOperation({ summary: 'Update PO tracking status' })
  updatePoTrackingStatus(
    @Param('id') id: string,
    @Body() body: { status: PoTrackingStatus; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.fmsService.updatePoTracking(id, {
      status: body.status,
      remarks: body.remarks,
      updatedBy: user?.userId,
    });
  }
}
