import type { AppNotification, NotificationMetadata, NotificationType } from '@/lib/types/notification';
import { NotificationRepository } from '@/server/adapters/repositories/notification.repository';
import { PushNotificationService } from '@/server/services/push-notification.service';

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  metadata?: NotificationMetadata;
}

export class NotificationService {
  private repo = new NotificationRepository();
  private pushService = new PushNotificationService();

  async create(tenantId: string, input: CreateNotificationInput): Promise<AppNotification> {
    const now = new Date();
    const payload: Omit<AppNotification, 'id'> = {
      tenantId,
      recipientId: input.recipientId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      link: input.link ?? '/tickets',
      metadata: input.metadata ?? {},
      createdAt: now,
      readAt: null,
    };
    const created = await this.repo.create(tenantId, payload);
    this.pushService
      .sendToUser(tenantId, input.recipientId, {
        title: input.title,
        body: input.body ?? '',
        link: input.link ?? '/tickets',
        data: {
          type: input.type,
          notificationId: created.id,
        },
      })
      .catch((error) => {
        console.warn('[push] Failed to send notification', error);
      });
    return created;
  }

  async createMany(tenantId: string, inputs: CreateNotificationInput[]): Promise<AppNotification[]> {
    if (!inputs.length) {
      return [];
    }
    return Promise.all(inputs.map((input) => this.create(tenantId, input)));
  }

  async listForRecipient(
    tenantId: string,
    recipientId: string,
    limit = 40,
  ): Promise<AppNotification[]> {
    const notifications = await this.repo.listByRecipient(tenantId, recipientId, limit);
    return notifications.map((notification) => ({
      ...notification,
      createdAt: ensureDate(notification.createdAt),
      readAt: notification.readAt ? ensureDate(notification.readAt) : null,
    }));
  }

  async unreadCount(tenantId: string, recipientId: string): Promise<number> {
    return this.repo.countUnreadByRecipient(tenantId, recipientId);
  }

  async markRead(tenantId: string, recipientId: string, id: string): Promise<AppNotification> {
    const existing = await this.repo.findById(tenantId, id);
    if (!existing || existing.recipientId !== recipientId) {
      throw new Error('Notification not found');
    }
    if (existing.readAt) {
      return {
        ...existing,
        createdAt: ensureDate(existing.createdAt),
        readAt: ensureDate(existing.readAt),
      };
    }
    const updated = await this.repo.update(tenantId, id, { readAt: new Date() });
    return {
      ...updated,
      createdAt: ensureDate(updated.createdAt),
      readAt: updated.readAt ? ensureDate(updated.readAt) : null,
    };
  }

  async markAllRead(tenantId: string, recipientId: string): Promise<number> {
    return this.repo.markAllRead(tenantId, recipientId, new Date());
  }
}

type TimestampLike = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

function ensureDate(value: Date | string | number | TimestampLike | null | undefined): Date {
  if (!value) {
    return new Date(0);
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (typeof value.seconds === 'number') {
      const ms = value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6);
      return new Date(ms);
    }
    return new Date(0);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}
