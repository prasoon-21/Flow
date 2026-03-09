export type NotificationType =
  | 'ticket.assigned'
  | 'ticket.status_changed'
  | 'ticket.comment'
  | 'ticket.comment_mention';

export interface NotificationMetadata {
  ticketId?: string;
  ticketNumber?: string;
  actorId?: string;
  status?: string;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  metadata?: NotificationMetadata;
  createdAt: Date | string;
  readAt: Date | string | null;
}

export type PushPlatform = 'web';

export interface PushToken {
  id: string;
  tenantId: string;
  userId: string;
  token: string;
  platform: PushPlatform;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastSeenAt?: Date | string | null;
}
