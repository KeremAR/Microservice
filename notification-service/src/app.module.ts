import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'notification',
      entities: [],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 