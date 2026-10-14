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
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with pagination' })
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('moduleName') moduleName?: string,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    const result = await this.notificationsService.getUserNotifications(userId, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      unreadOnly: unreadOnly === 'true',
      moduleName,
    });

    return {
      success: true,
      data: result.data,
      total: result.total,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return {
      success: true,
      count,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  async createNotification(
    @Request() req: any,
    @Body() body: {
      userId?: string;
      title: string;
      message: string;
      moduleName?: string;
      recordId?: string;
      notificationType?: string;
    },
  ) {
    const companyId = req.user?.companyId;
    const targetUserId = body.userId || req.user?.sub || req.user?.userId;

    const notification = await this.notificationsService.createNotification({
      companyId,
      userId: targetUserId,
      title: body.title,
      message: body.message,
      moduleName: body.moduleName,
      recordId: body.recordId,
      notificationType: body.notificationType || 'in_app',
    });

    // Send real-time notification
    this.notificationsGateway.sendToUser(targetUserId, 'notification', {
      id: notification.notificationId,
      title: notification.title,
      message: notification.message,
      moduleName: notification.moduleName,
      recordId: notification.recordId,
      type: notification.notificationType,
    });

    return {
      success: true,
      data: notification,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    await this.notificationsService.markAsRead(id);
    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub || req.user?.userId;
    await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.userId;
    await this.notificationsService.deleteNotification(id, userId);
    return {
      success: true,
      message: 'Notification deleted',
    };
  }
}
