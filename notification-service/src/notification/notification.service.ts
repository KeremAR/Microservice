import { Injectable, NotFoundException } from '@nestjs/common';
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

  private async sendEmail(userId: string, title: string, message: string): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userId, // Assuming userId is an email address
        subject: title,
        text: message,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw the error to prevent notification creation failure
    }
  }

  async createNotification(userId: string, title: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    try {
      await this.eventPublisher.publish(
        new NotificationCreatedEvent(
          savedNotification.id,
          userId,
          title,
          message
        )
      );
    } catch (error) {
      console.error('Failed to publish notification created event:', error);
    }

    // Send email notification asynchronously
    this.sendEmail(userId, title, message).catch(error => {
      console.error('Failed to send email notification:', error);
    });

    return savedNotification;
  }

  async getNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepository.update(notificationId, { isRead: true });
    
    const notification = await this.notificationRepository.findOne({ 
      where: { id: notificationId } 
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }

    try {
      await this.eventPublisher.publish(
        new NotificationReadEvent(notificationId, userId)
      );
    } catch (error) {
      console.error('Failed to publish notification read event:', error);
    }

    return notification;
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.notificationRepository.delete(notificationId);
    
    try {
      await this.eventPublisher.publish(
        new NotificationDeletedEvent(notificationId, userId)
      );
    } catch (error) {
      console.error('Failed to publish notification deleted event:', error);
    }
  }
} 