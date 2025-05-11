export interface NotificationEvent {
  type: string;
  timestamp: Date;
}

export class NotificationCreatedEvent implements NotificationEvent {
  type = 'NotificationCreated';
  timestamp: Date;
  
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string
  ) {
    this.timestamp = new Date();
  }
}

export class NotificationReadEvent implements NotificationEvent {
  type = 'NotificationRead';
  timestamp: Date;
  
  constructor(
    public readonly notificationId: string,
    public readonly userId: string
  ) {
    this.timestamp = new Date();
  }
}

export class NotificationDeletedEvent implements NotificationEvent {
  type = 'NotificationDeleted';
  timestamp: Date;
  
  constructor(
    public readonly notificationId: string,
    public readonly userId: string
  ) {
    this.timestamp = new Date();
  }
} 