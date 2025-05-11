import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../../src/notification/notification.service';
import { Notification } from '../../src/notification/entities/notification.entity';
import { NotificationEventPublisher } from '../../src/notification/domain/events/notification.event.publisher';

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
  });

  afterEach(() => {
    jest.clearAllMocks();
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
  });

  describe('deleteNotification', () => {
    it('should delete notification and publish event', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      await service.deleteNotification(notificationId, userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(notificationId);
      expect(mockEventPublisher.publish).toHaveBeenCalled();
    });
  });
}); 