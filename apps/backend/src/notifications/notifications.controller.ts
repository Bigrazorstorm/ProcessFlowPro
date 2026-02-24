import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferencesDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get user's notifications
   */
  @Get()
  async getNotifications(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const userId = (req as any).user.userId;
    return this.notificationsService.getUserNotifications(userId, limit);
  }

  /**
   * Get unread notification count
   */
  @Get('unread/count')
  async getUnreadCount(
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  /**
   * Mark notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const result = await this.notificationsService.markAsRead(notificationId, userId);
    return result || { message: 'Notification not found' };
  }

  /**
   * Mark all notifications as read
   */
  @Post('read-all')
  async markAllAsRead(
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const count = await this.notificationsService.markAllAsRead(userId);
    return { markedAsReadCount: count };
  }

  /**
   * Delete notification
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const deleted = await this.notificationsService.deleteNotification(notificationId, userId);
    return { deleted, message: deleted ? 'Notification deleted' : 'Notification not found' };
  }

  /**
   * Get notification preferences
   */
  @Get('preferences')
  async getPreferences(
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    return this.notificationsService.getPreferences(userId);
  }

  /**
   * Update notification preferences
   */
  @Patch('preferences')
  async updatePreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    return this.notificationsService.updatePreferences(userId, dto);
  }

  /**
   * Clear old notifications (30+ days)
   */
  @Post('clear-old')
  async clearOld(
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const count = await this.notificationsService.clearOldNotifications(userId);
    return { clearedCount: count };
  }
}
