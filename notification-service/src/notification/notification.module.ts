import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationConsumer } from './notification.consumer';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService],
})
export class NotificationModule {} 