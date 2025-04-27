import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(
    @Body('userId') userId: string,
    @Body('title') title: string,
    @Body('message') message: string,
  ): Promise<Notification> {
    return this.notificationService.createNotification(userId, title, message);
  }

  @Get(':userId')
  async getNotifications(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationService.getNotifications(userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.markAsRead(id);
  }
} 