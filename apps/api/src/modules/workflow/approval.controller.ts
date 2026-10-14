import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApprovalService, ApprovalContext } from './approval.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateApprovalRequestDto,
  ApproveDto,
  RejectDto,
  RequestRevisionDto,
  DelegateApprovalDto,
  ApprovalType,
} from './dto/approval.dto';
import { ApprovalStatus } from './entities/approval.entity';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  private getContext(request: any): ApprovalContext {
    return {
      userId: request.user?.userId,
      userName: request.user?.name || request.user?.email,
      userRole: request.user?.role || 'USER',
      userLevel: this.getUserLevel(request.user?.role),
    };
  }

  private getUserLevel(role: string): number {
    const levelMap: Record<string, number> = {
      'ADMIN': 4,
      'MANAGEMENT': 3,
      'COSTING_MANAGER': 2,
      'PURCHASE_MANAGER': 2,
      'PURCHASE_USER': 1,
      'SALES_MANAGER': 1,
      'SALES_USER': 1,
      'USER': 1,
    };
    return levelMap[role?.toUpperCase()] || 1;
  }

  @Post()
  createRequest(@Body() dto: CreateApprovalRequestDto, @Request() req: any) {
    return this.approvalService.createRequest(dto, this.getContext(req));
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ApprovalStatus,
    @Query('approvalType') approvalType?: ApprovalType,
    @Query('entityType') entityType?: string,
    @Query('search') search?: string,
    @Query('myApprovals') myApprovals?: string,
  ) {
    return this.approvalService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      approvalType,
      entityType,
      search,
      myApprovals: myApprovals === 'true',
      requesterId: myApprovals ? undefined : undefined,
    });
  }

  @Get('pending')
  getMyPendingApprovals(@Request() req: any) {
    const context = this.getContext(req);
    return this.approvalService.getPendingApprovals(
      context.userId,
      context.userRole,
      context.userLevel,
    );
  }

  @Get('summary')
  getSummary(@Request() req: any) {
    return this.approvalService.getSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalService.findById(id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveDto,
    @Request() req: any,
  ) {
    return this.approvalService.approve(id, this.getContext(req), dto.remarks);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @Request() req: any,
  ) {
    return this.approvalService.reject(id, dto.reason, this.getContext(req), dto.remarks);
  }

  @Post(':id/revision')
  requestRevision(
    @Param('id') id: string,
    @Body() dto: RequestRevisionDto,
    @Request() req: any,
  ) {
    return this.approvalService.requestRevision(
      id,
      dto.revisionNotes,
      this.getContext(req),
      dto.remarks,
    );
  }

  @Post(':id/resubmit')
  resubmit(@Param('id') id: string, @Request() req: any) {
    return this.approvalService.resubmit(id, this.getContext(req));
  }

  @Post(':id/delegate')
  delegate(
    @Param('id') id: string,
    @Body() dto: DelegateApprovalDto,
    @Request() req: any,
  ) {
    return this.approvalService.delegate(
      id,
      dto.toUserId,
      dto.toRoleId,
      dto.reason,
      this.getContext(req),
    );
  }

  @Post('purchase-quote/:quoteId/request')
  requestPurchaseQuoteApproval(
    @Param('quoteId') quoteId: string,
    @Body('amount') amount: number,
    @Request() req: any,
  ) {
    const context = this.getContext(req);
    return this.approvalService.linkToPurchaseQuote(
      quoteId,
      quoteId, // QuoteNo will be fetched by the service
      amount,
      context,
    );
  }
}
