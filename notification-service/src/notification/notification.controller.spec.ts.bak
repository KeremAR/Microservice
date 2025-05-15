import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    createNotification: jest.fn(),
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const createNotificationDto = {
        userId: 'test-user',
        title: 'Test Title',
        message: 'Test Message',
      };

      const mockNotification: Notification = {
        id: 'test-id',
        ...createNotificationDto,
        isRead: false,
        createdAt: new Date(),
      };

      mockNotificationService.createNotification.mockResolvedValue(mockNotification);

      const result = await controller.createNotification(createNotificationDto);

      expect(service.createNotification).toHaveBeenCalledWith(
        createNotificationDto.userId,
        createNotificationDto.title,
        createNotificationDto.message,
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 'test-user';
      const mockNotifications: Notification[] = [
        {
          id: 'test-id',
          userId,
          title: 'Test Title',
          message: 'Test Message',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      mockNotificationService.getNotifications.mockResolvedValue(mockNotifications);

      const result = await controller.getNotifications(userId);

      expect(service.getNotifications).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';
      const mockNotification: Notification = {
        id: notificationId,
        userId,
        title: 'Test Title',
        message: 'Test Message',
        isRead: true,
        createdAt: new Date(),
      };

      mockNotificationService.markAsRead.mockResolvedValue(mockNotification);

      const result = await controller.markAsRead(notificationId, { userId });

      expect(service.markAsRead).toHaveBeenCalledWith(notificationId, userId);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      const notificationId = 'test-id';
      const userId = 'test-user';

      await controller.deleteNotification(notificationId, { userId });

      expect(service.deleteNotification).toHaveBeenCalledWith(notificationId, userId);
    });
  });
}); 