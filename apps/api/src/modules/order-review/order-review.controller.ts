import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrderReviewService } from './order-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('order-review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order-review')
export class OrderReviewController {
  constructor(private readonly orderReviewService: OrderReviewService) {}

  @Post('orders/batch-items')
  @ApiOperation({ summary: 'Get items for multiple selected orders at once' })
  getBatchOrderItems(
    @Body() body: { orderIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.getBatchOrderItems(body.orderIds || [], user?.companyId, user?.userId, user?.roles || []);
  }

  @Post('orders/lifecycle')
  @ApiOperation({ summary: 'Get order summary and lifecycle journey for selected orders' })
  getOrderLifecycle(
    @Body() body: { orderIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.getOrderLifecycle(body.orderIds || [], user?.companyId, user?.userId, user?.roles || []);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get sales orders for ORDP review' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  getOrdersForReview(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.orderReviewService.getOrdersForReview(user?.companyId, user?.userId, user?.roles || [], { search, status });
  }

  @Get('orders/:orderId/items')
  @ApiOperation({ summary: 'Get order items with review data, draft state, lock status' })
  getOrderItemsForReview(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.getOrderItemsForReview(orderId, user?.companyId, user?.userId, user?.roles || []);
  }

  @Post('orders/:orderId/draft')
  @ApiOperation({ summary: 'Save review draft (cumulative append)' })
  saveDraft(
    @Param('orderId') orderId: string,
    @Body() body: { items: any[] },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.saveDraft(
      orderId,
      user?.companyId,
      user?.userId,
      user?.name || user?.email,
      body.items,
      user?.roles || [],
    );
  }

  @Post('orders/:orderId/submit')
  @ApiOperation({ summary: 'Final submission — validates, persists, locks after 2' })
  submitFinal(
    @Param('orderId') orderId: string,
    @Body() body: { itemIds: string[] },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.submitFinal(
      orderId,
      user?.companyId,
      user?.userId,
      user?.name || user?.email,
      body.itemIds,
      user?.roles || [],
    );
  }

  @Post('orders/:orderId/items/:itemId/cancel')
  @ApiOperation({ summary: 'Cancel an order item from review' })
  cancelItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.cancelItem(
      orderId, itemId, user?.companyId, user?.userId, user?.name || user?.email, body.reason, user?.roles || [],
    );
  }

  @Patch('cancellations/:cancellationId/restore')
  @ApiOperation({ summary: 'Restore a cancelled item' })
  restoreItem(
    @Param('cancellationId') cancellationId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.restoreItem(cancellationId, user?.companyId, user?.userId, user?.roles || []);
  }

  @Post('orders/:orderId/close')
  @ApiOperation({ summary: 'Close an order for review' })
  closeOrder(
    @Param('orderId') orderId: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.closeOrder(
      orderId, user?.companyId, user?.userId, user?.name || user?.email, body.notes, user?.roles || [],
    );
  }

  @Post('orders/:orderId/reopen')
  @ApiOperation({ summary: 'Reopen a closed order' })
  reopenOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.reopenOrder(orderId, user?.companyId, user?.userId, body.reason, user?.roles || []);
  }

  @Get('orders/:orderId/logs')
  @ApiOperation({ summary: 'Get review submission logs for an order' })
  getReviewLogs(
    @Param('orderId') orderId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.getReviewLogs(orderId, user?.companyId, user?.userId, user?.roles || []);
  }

  @Get('orders/:orderId/items/:itemId/history')
  @ApiOperation({ summary: 'Get submission history for a specific item' })
  getSubmissionHistory(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.orderReviewService.getSubmissionHistory(orderId, itemId, user?.companyId, user?.userId, user?.roles || []);
  }

  @Get('lookup/departments')
  @ApiOperation({ summary: 'Get departments for task assignment dropdowns' })
  getLookupDepartments(@CurrentUser() user: any) {
    return this.orderReviewService.getLookupDepartments(user?.companyId);
  }

  @Get('lookup/users')
  @ApiOperation({ summary: 'Get users for task assignment dropdowns' })
  @ApiQuery({ name: 'departmentId', required: false })
  getLookupUsers(
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.orderReviewService.getLookupUsers(user?.companyId, departmentId);
  }
}
