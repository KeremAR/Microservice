import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('issue.status.updated')
  async handleIssueStatusUpdated(@Payload() data: any) {
    const { userId, issueId, status } = data;
    
    await this.notificationService.createNotification(
      userId,
      'Sorun Durumu Güncellendi',
      `ID: ${issueId} olan sorununuzun durumu "${status}" olarak güncellendi.`,
    );
  }
} 