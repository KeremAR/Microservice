import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import * as nodemailer from 'nodemailer';
import { NotificationEventPublisher } from './domain/events/notification.event.publisher';
import { NotificationCreatedEvent, NotificationReadEvent, NotificationDeletedEvent } from './domain/events/notification.event';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly eventPublisher: NotificationEventPublisher
  ) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async createNotification(userId: string, title: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
    });

    await this.notificationRepository.save(notification);
    
    if (this.transporter) {
      await this.sendEmail(userId, title, message);
    }
    
    // Event yayınla
    await this.eventPublisher.publish(
      new NotificationCreatedEvent(
        notification.id,
        userId,
        title,
        message
      )
    );
    
    return notification;
  }

  private async sendEmail(userId: string, title: string, message: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: userId, // Burada kullanıcının email adresi olmalı
        subject: title,
        text: message,
      });
    } catch (error) {
      console.error('Email gönderilemedi:', error);
    }
  }

  async getNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepository.update(notificationId, { isRead: true });
    await this.eventPublisher.publish(
      new NotificationReadEvent(notificationId, userId)
    );
    return this.notificationRepository.findOne({ where: { id: notificationId } });
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.notificationRepository.delete(notificationId);
    await this.eventPublisher.publish(
      new NotificationDeletedEvent(notificationId, userId)
    );
  }
} 