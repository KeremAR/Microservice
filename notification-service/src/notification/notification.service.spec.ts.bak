import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationEventPublisher } from './domain/events/notification.event.publisher';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: Repository<Notification>;
  let eventPublisher: NotificationEventPublisher;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventPublisher = {
    publish: jest.fn(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockRepository,
        },
        {
          provide: NotificationEventPublisher,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    eventPublisher = module.get<NotificationEventPublisher>(NotificationEventPublisher);

    // Mock process.env
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'testpass';
    process.env.SMTP_PORT = '587';

    // Mock nodemailer
    jest.mock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue(mockTransporter),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_PORT;
  });

  describe('createNotification', () => {
    it('should create a notification and publish event', async () => {
      const userId = 'test-user';
      const title = 'Test Title';
      const message = 'Test Message';
      
      const mockNotification = {
        id: 'test-id',
        userId,
        title,
        message,
        isRead: false,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);

      const result = await service.createNotification(userId, title, message);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        title,
        message,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should handle database errors during creation', async () => {
      const userId = 'test-user';
      const title = 'Test Title';
      const message = 'Test Message';

      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createNotification(userId, title, message))
        .rejects
        .toThrow('Database error');
    });

    it('should handle event publishing errors', async () => {
      const userId = 'test-user';
      const title = 'Test Title';
      const message = 'Test Message';
      
      const mockNotification = {
        id: 'test-id',
        userId,
        title,
        message,
        isRead: false,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockNotification);
      mockRepository.save.mockResolvedValue(mockNotification);
      mockEventPublisher.publish.mockRejectedValue(new Error('Event publishing error'));

      const result = await service.createNotification(userId, title, message);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 'test-user';
      const mockNotifications = [
        {
          id: 'test-id-1',
          userId,
          title: 'Test Title 1',
          message: 'Test Message 1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no notifications found', async () => {
      const userId = 'test-user';
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getNotifications(userId);
      expect(result).toEqual([]);
    });

    it('should handle database errors when fetching notifications', async () => {
      const userId = 'test-user';
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getNotifications(userId))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read and publish event', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';
      const mockNotification = {
        id: notificationId,
        userId,
        title: 'Test Title',
        message: 'Test Message',
        isRead: true,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.markAsRead(notificationId, userId);

      expect(mockRepository.update).toHaveBeenCalledWith(notificationId, { isRead: true });
      expect(mockEventPublisher.publish).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });

    it('should handle non-existent notification', async () => {
      const notificationId = 'non-existent-id';
      const userId = 'test-user';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, userId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should handle database errors when marking as read', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      mockRepository.update.mockRejectedValue(new Error('Database error'));

      await expect(service.markAsRead(notificationId, userId))
        .rejects
        .toThrow('Database error');
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification and publish event', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      await service.deleteNotification(notificationId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(notificationId);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });

    it('should handle database errors when deleting', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteNotification(notificationId, userId))
        .rejects
        .toThrow('Database error');
    });

    it('should handle event publishing errors during deletion', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      mockRepository.delete.mockResolvedValue(undefined);
      mockEventPublisher.publish.mockRejectedValue(new Error('Event publishing error'));

      await service.deleteNotification(notificationId, userId);
      expect(mockRepository.delete).toHaveBeenCalled();
    });
  });
}); 