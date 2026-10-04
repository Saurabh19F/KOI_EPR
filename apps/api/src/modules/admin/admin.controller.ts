import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private getEffectiveCompanyId(user: any, requestedCompanyId?: string): string {
    const companyId = user?.isSuperAdmin ? requestedCompanyId : user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Company context is required');
    }
    return companyId;
  }

  // Settings
  @Get('settings')
  @Permissions('ADMIN_SETTINGS')
  getSettings(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    return this.adminService.getSetting(this.getEffectiveCompanyId(user, companyId), 'DEFAULT_SETTINGS');
  }

  @Post('settings')
  @Permissions('ADMIN_SETTINGS')
  setSetting(
    @Body() body: { companyId: string; key: string; value: string },
    @CurrentUser() user: any,
  ) {
    return this.adminService.setSetting(this.getEffectiveCompanyId(user, body.companyId), body.key, body.value);
  }

  // Number Series
  @Get('number-series')
  @Permissions('ADMIN_SETTINGS')
  getNumberSeries(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    return this.adminService.listNumberSeries(user, companyId);
  }

  @Get('number-series/next')
  @Permissions('ADMIN_SETTINGS')
  getNextNumber(
    @Query('companyId') companyId: string,
    @Query('module') module: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.getNextNumber(this.getEffectiveCompanyId(user, companyId), module);
  }

  @Get('number-series/next/:module')
  @Permissions('ADMIN_SETTINGS')
  getNextNumberByModule(
    @Param('module') module: string,
    @Query('companyId') companyId: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.getNextNumber(this.getEffectiveCompanyId(user, companyId), module);
  }

  @Get('number-series/:id')
  @Permissions('ADMIN_SETTINGS')
  getNumberSeriesById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.getNumberSeriesById(id, user);
  }

  @Post('number-series')
  @Permissions('ADMIN_SETTINGS')
  createNumberSeries(@Body() body: any, @CurrentUser() user: any) {
    return this.adminService.createNumberSeries(body, user);
  }

  @Patch('number-series/:id')
  @Permissions('ADMIN_SETTINGS')
  updateNumberSeries(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.adminService.updateNumberSeries(id, body, user);
  }

  @Post('number-series/:id/reset')
  @Permissions('ADMIN_SETTINGS')
  resetNumberSeries(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.resetNumberSeries(id, user);
  }

  @Delete('number-series/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('ADMIN_SETTINGS')
  deleteNumberSeries(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteNumberSeries(id, user);
  }

  // Email Templates
  @Get('email-templates')
  @Permissions('ADMIN_SETTINGS')
  getEmailTemplates(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    return this.adminService.listEmailTemplates(user, companyId);
  }

  @Get('email-templates/:id')
  @Permissions('ADMIN_SETTINGS')
  getEmailTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.getEmailTemplateById(id, user);
  }

  @Post('email-templates')
  @Permissions('ADMIN_SETTINGS')
  createEmailTemplate(@Body() body: any, @CurrentUser() user: any) {
    return this.adminService.createEmailTemplateConfig(body, user);
  }

  @Patch('email-templates/:id')
  @Permissions('ADMIN_SETTINGS')
  updateEmailTemplate(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.adminService.updateEmailTemplate(id, body, user);
  }

  @Post('email-templates/:id/test')
  @Permissions('ADMIN_SETTINGS')
  testEmailTemplate(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.adminService.testEmailTemplate(id, body, user);
  }

  @Delete('email-templates/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('ADMIN_SETTINGS')
  deleteEmailTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteEmailTemplate(id, user);
  }

  // Departments
  @Get('departments')
  @Permissions('ADMIN_SETTINGS')
  getDepartments(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    return this.adminService.listDepartments(user, companyId);
  }

  @Get('departments/:id/users')
  @Permissions('ADMIN_SETTINGS')
  getDepartmentUsers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.getDepartmentUsers(id, user);
  }

  @Get('departments/:id')
  @Permissions('ADMIN_SETTINGS')
  getDepartment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.getDepartmentById(id, user);
  }

  @Post('departments')
  @Permissions('ADMIN_SETTINGS')
  createDepartment(@Body() body: any, @CurrentUser() user: any) {
    return this.adminService.createDepartment(body, user);
  }

  @Patch('departments/:id')
  @Permissions('ADMIN_SETTINGS')
  updateDepartment(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.adminService.updateDepartment(id, body, user);
  }

  @Delete('departments/:id')
  @HttpCode(HttpStatus.OK)
  @Permissions('ADMIN_SETTINGS')
  deleteDepartment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.deleteDepartment(id, user);
  }

  // Approval Matrix
  @Get('approval-matrix')
  @Permissions('ADMIN_SETTINGS')
  getApprovalLevels(
    @Query('companyId') companyId: string,
    @Query('module') module: string,
    @Query('amount') amount: number,
    @CurrentUser() user: any,
  ) {
    return this.adminService.getApprovalChain(this.getEffectiveCompanyId(user, companyId), module, amount);
  }

  // Help Tickets
  @Get('tickets')
  @Permissions('ADMIN_SETTINGS')
  getTickets(@Query('companyId') companyId: string, @CurrentUser() user: any) {
    return this.adminService.getHelpTickets(this.getEffectiveCompanyId(user, companyId));
  }

  @Post('tickets')
  @Permissions('ADMIN_SETTINGS')
  createTicket(
    @Body() body: { companyId?: string; subject: string; description: string; priority?: string; reporterId?: string },
    @CurrentUser() user: any,
  ) {
    return this.adminService.createHelpTicket({
      ...body,
      companyId: this.getEffectiveCompanyId(user, body.companyId),
      reporterId: user?.userId || body.reporterId,
    });
  }
}
