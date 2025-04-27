import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createNotification(userId: string, title: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
    });

    await this.notificationRepository.save(notification);
    await this.sendEmail(userId, title, message);
    
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

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, { isRead: true });
    return this.notificationRepository.findOne({ where: { id } });
  }
} 