import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './notification.service';

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let service: NotificationService;

  const mockNotificationService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConsumer,
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleIssueStatusUpdated', () => {
    it('should create a notification when issue status is updated', async () => {
      const mockData = {
        userId: 'test-user',
        issueId: 'test-issue',
        status: 'COMPLETED',
      };

      await consumer.handleIssueStatusUpdated(mockData);

      expect(service.createNotification).toHaveBeenCalledWith(
        mockData.userId,
        'Sorun Durumu Güncellendi',
        `ID: ${mockData.issueId} olan sorununuzun durumu "${mockData.status}" olarak güncellendi.`,
      );
    });

    it('should handle missing data gracefully', async () => {
      const mockData = {
        userId: undefined,
        issueId: undefined,
        status: undefined,
      };

      await consumer.handleIssueStatusUpdated(mockData);

      expect(service.createNotification).toHaveBeenCalledWith(
        mockData.userId,
        'Sorun Durumu Güncellendi',
        `ID: ${mockData.issueId} olan sorununuzun durumu "${mockData.status}" olarak güncellendi.`,
      );
    });
  });
}); 