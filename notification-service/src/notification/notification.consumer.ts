import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: '',
    routingKey: 'issue_created',
    queue: 'issue_created',
  })
  async handleIssueCreated(message: any) {
    console.log('Received issue created event:', message);
    await this.notificationService.createNotification({
      userId: message.UserId,
      title: 'Yeni Issue Oluşturuldu',
      message: `${message.Title} başlıklı issue oluşturuldu.`,
      type: 'ISSUE_CREATED',
      data: message,
    });
  }

  @RabbitSubscribe({
    exchange: 'amq.direct',
    routingKey: 'issue_status_changed',
    queue: 'notification_issue_status_changed_queue',
  })
  async handleIssueStatusChanged(message: any) {
    console.log('Received issue status changed event:', message);
    await this.notificationService.createNotification({
      userId: message.UserId,
      title: 'Issue Durumu Güncellendi',
      message: `Issue durumu ${message.NewStatus} olarak güncellendi.`,
      type: 'ISSUE_STATUS_CHANGED',
      data: message,
    });
  }
} 