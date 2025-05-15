import { Controller, Get, Post, Param, Body, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':userId')
  async getNotificationsByUserId(@Param('userId') userId: string) {
    return this.notificationService.getNotificationsByUserId(userId);
  }

  @Post(':userId/read/:notificationId')
  async markNotificationAsRead(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(userId, notificationId);
  }

  @Delete(':userId/:notificationId')
  async deleteNotification(
    @Param('userId') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(userId, notificationId);
  }
} 