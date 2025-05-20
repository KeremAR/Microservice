import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import * as nodemailer from 'nodemailer';
import { NotificationEventPublisher } from './domain/events/notification.event.publisher';
import { NotificationCreatedEvent, NotificationReadEvent, NotificationDeletedEvent } from './domain/events/notification.event';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private notifications: Map<string, any[]> = new Map();

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

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const { userId, title, message, type, data } = createNotificationDto;
    
    // Entity oluştur
    const notificationEntity = this.notificationRepository.create({
      userId,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
    });
    // Veritabanına kaydet
    const savedNotification = await this.notificationRepository.save(notificationEntity);

    // Bellekte de tutmak istersen (opsiyonel, mevcut kodu koruyorum)
    const notification = {
      id: savedNotification.id,
      userId,
      title,
      message,
      type,
      data,
      createdAt: savedNotification.createdAt,
      read: false,
    };
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    this.notifications.get(userId).push(notification);
    console.log(`Notification created for user ${userId}:`, notification);
    return notification;
  }

  async getNotificationsByUserId(userId: string) {
    // Bildirimleri veritabanından userId'ye göre çek
    return this.notificationRepository.find({ where: { userId } });
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    // Önce veritabanında güncelle
    await this.notificationRepository.update(notificationId, { isRead: true });

    // Sonra bellekte de güncelle (varsa)
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
    // Sonucu döndürmek için veritabanından tekrar çekebilirsiniz
    return this.notificationRepository.findOne({ where: { id: notificationId } });
  }

  async deleteNotification(userId: string, notificationId: string) {
    // Önce veritabanından sil
    await this.notificationRepository.delete(notificationId);

    // Bellekten de sil (varsa)
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) {
      return false;
    }

    const initialLength = userNotifications.length;
    const filteredNotifications = userNotifications.filter(n => n.id !== notificationId);
    
    if (filteredNotifications.length !== initialLength) {
      this.notifications.set(userId, filteredNotifications);
      return true;
    }

    return false;
  }
} 