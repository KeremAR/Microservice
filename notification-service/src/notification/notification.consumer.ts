import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  onModuleInit() {
    console.log('NotificationConsumer initialized');
  }

  @RabbitSubscribe({
    exchange: 'issue_exchange',
    routingKey: 'issue.created',
    queue: 'notification_queue',
    queueOptions: {
      durable: true,
    },
  })
  async handleIssueCreated(message: any) {
    console.log('Received issue.created event:', message);
    try {
      // Mesaj yapısını kontrol et
      if (!message || !message.UserId || !message.Title) {
        console.error('Invalid message format:', message);
        return;
      }

      const { UserId: userId, Title: title } = message;
      
      // Aynı issue için daha önce bildirim var mı kontrol et
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          userId: userId,
          title: 'Yeni Rapor Oluşturuldu',
          message: `${title} başlıklı rapor başarıyla oluşturuldu.`,
        },
      });

      if (existingNotification) {
        console.log('Notification already exists for this issue creation');
        return;
      }

      await this.notificationService.createNotification({
        userId,
        title: 'Yeni Rapor Oluşturuldu',
        message: `${title} başlıklı rapor başarıyla oluşturuldu.`,
        type: 'issue.created',
        data: { issueId: message.Id },
      });
    } catch (error) {
      console.error('Error handling issue.created event:', error);
    }
  }

  @RabbitSubscribe({
    exchange: 'issue_exchange',
    routingKey: 'issue.status_changed',
    queue: 'notification_queue',
    queueOptions: {
      durable: true,
    },
  })
  async handleIssueStatusChanged(message: any) {
    console.log('Received issue.status_changed event:', message);
    try {
      // Mesaj yapısını kontrol et
      if (!message || !message.UserId || !message.Title || !message.Status) {
        console.error('Invalid message format:', message);
        return;
      }

      const { UserId: userId, Title: title, Status: newStatus } = message;
      
      // Aynı issue ve status için daha önce bildirim var mı kontrol et
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          userId: userId,
          title: this.getStatusTitle(newStatus),
          message: this.getStatusMessage(title, newStatus),
        },
      });

      if (existingNotification) {
        console.log('Notification already exists for this status change');
        return;
      }

      await this.notificationService.createNotification({
        userId,
        title: this.getStatusTitle(newStatus),
        message: this.getStatusMessage(title, newStatus),
        type: 'issue.status_changed',
        data: { issueId: message.Id, newStatus },
      });
    } catch (error) {
      console.error('Error handling issue.status_changed event:', error);
    }
  }

  private getStatusTitle(status: string): string {
    switch (status) {
      case 'InProgress':
        return 'Rapor İşleme Alındı';
      case 'Resolved':
        return 'Rapor Çözüldü';
      case 'Closed':
        return 'Rapor Kapatıldı';
      default:
        return 'Rapor Durumu Güncellendi';
    }
  }

  private getStatusMessage(title: string, status: string): string {
    switch (status) {
      case 'InProgress':
        return `${title} başlıklı raporunuz işleme alındı.`;
      case 'Resolved':
        return `${title} başlıklı raporunuz çözüldü.`;
      case 'Closed':
        return `${title} başlıklı raporunuz kapatıldı.`;
      default:
        return `${title} başlıklı raporunuzun durumu güncellendi.`;
    }
  }
} 