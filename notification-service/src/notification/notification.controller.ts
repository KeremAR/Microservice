import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(
    @Body() body: { userId: string; title: string; message: string }
  ): Promise<Notification> {
    return this.notificationService.createNotification(
      body.userId,
      body.title,
      body.message
    );
  }

  @Get(':userId')
  async getNotifications(@Param('userId') userId: string): Promise<Notification[]> {
    return this.notificationService.getNotifications(userId);
  }

  @Put(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Body() body: { userId: string }
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, body.userId);
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') id: string,
    @Body() body: { userId: string }
  ): Promise<void> {
    return this.notificationService.deleteNotification(id, body.userId);
  }
} 