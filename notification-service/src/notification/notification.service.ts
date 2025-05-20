import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import * as nodemailer from 'nodemailer';
import { NotificationEventPublisher } from './domain/events/notification.event.publisher';
import { NotificationCreatedEvent, NotificationReadEvent, NotificationDeletedEvent } from './domain/events/notification.event';
import { Counter } from 'prom-client';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

const notificationSentCounter = new Counter({
  name: 'notification_sent_total',
  help: 'Toplam gönderilen bildirim sayısı',
});
const notificationFailedCounter = new Counter({
  name: 'notification_failed_total',
  help: 'Toplam başarısız bildirim sayısı',
});
const notificationReadCounter = new Counter({
  name: 'notification_read_total',
  help: 'Toplam okunan bildirim sayısı',
});
const notificationDeletedCounter = new Counter({
  name: 'notification_deleted_total',
  help: 'Toplam silinen bildirim sayısı',
});

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
      console.warn('SMTP transporter not configured. Email will not be sent.');
      notificationFailedCounter.inc();
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: userId, // Assuming userId is an email address
        subject: title,
        text: message,
      });
      console.log(`Email sent to ${userId} with title: ${title}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      notificationFailedCounter.inc();
      // Don't throw the error to prevent notification creation failure
    }
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    const { userId, title, message, type, data } = createNotificationDto;
    
    // Send email if type is 'email' or similar (logic can be expanded)
    // For simplicity, let's assume all notifications might try to send an email if transporter is configured.
    // You might want to make this conditional based on notification type or other logic.
    await this.sendEmail(userId, title, message); 

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
    notificationSentCounter.inc();
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
    if (!userNotifications) {
      return null;
    }

    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notificationReadCounter.inc();
      return notification;
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
      notificationDeletedCounter.inc();
      return true;
    }

    return false;
  }
} 