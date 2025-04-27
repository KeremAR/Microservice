import { Injectable, Inject } from '@nestjs/common';
import { NotificationEvent } from './notification.event';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class NotificationEventPublisher {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy
  ) {}

  async publish(event: NotificationEvent): Promise<void> {
    await this.client.emit('notification.events', event);
  }
} 