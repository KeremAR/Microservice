import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationConsumer } from './notification.consumer';
import { Notification } from './entities/notification.entity';
import { NotificationEventPublisher } from './domain/events/notification.event.publisher';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672'],
          queue: 'notification_events',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'amq.direct',
          type: 'direct',
        },
      ],
      uri: process.env.RABBITMQ_URI || 'amqp://user:password@rabbitmq:5672',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationConsumer,
    NotificationEventPublisher,
  ],
  exports: [NotificationService],
})
export class NotificationModule {} 