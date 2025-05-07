import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../src/notification/entities/notification.entity';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;
  let notificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'postgres',
          password: 'postgres',
          database: 'notification_test_db',
          entities: [Notification],
          synchronize: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/notification (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/notification')
      .send({
        userId: 'test-user',
        title: 'Test Notification',
        message: 'This is a test notification',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.userId).toBe('test-user');
    expect(response.body.title).toBe('Test Notification');
    expect(response.body.message).toBe('This is a test notification');
    expect(response.body.isRead).toBe(false);

    notificationId = response.body.id;
  }, 10000);

  it('/notification/:userId (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/notification/test-user')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0].userId).toBe('test-user');
  }, 10000);

  it('/notification/:id/read (PUT)', async () => {
    const response = await request(app.getHttpServer())
      .put(`/notification/${notificationId}/read`)
      .send({ userId: 'test-user' })
      .expect(200);

    expect(response.body.id).toBe(notificationId);
    expect(response.body.isRead).toBe(true);
  }, 10000);

  it('/notification/:id (DELETE)', async () => {
    await request(app.getHttpServer())
      .delete(`/notification/${notificationId}`)
      .send({ userId: 'test-user' })
      .expect(200);

    // Verify the notification is deleted
    const response = await request(app.getHttpServer())
      .get('/notification/test-user')
      .expect(200);

    const deletedNotification = response.body.find(
      (notification) => notification.id === notificationId
    );
    expect(deletedNotification).toBeUndefined();
  }, 10000);
}); 