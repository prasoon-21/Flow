/**
 * Notification Repository — in-memory stub for demo mode
 */

import type { AppNotification } from '@/lib/types/notification';

const store: AppNotification[] = [];

export class NotificationRepository {
  async create(tenantId: string, data: Omit<AppNotification, 'id'>): Promise<AppNotification> {
    const notification: AppNotification = { id: `n${Date.now()}`, ...data };
    store.push(notification);
    return notification;
  }

  async findById(_tenantId: string, id: string): Promise<AppNotification | null> {
    return store.find((n) => n.id === id) ?? null;
  }

  async listByRecipient(
    _tenantId: string,
    recipientId: string,
    limit = 40,
  ): Promise<AppNotification[]> {
    return store
      .filter((n) => n.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async listUnreadByRecipient(_tenantId: string, recipientId: string): Promise<AppNotification[]> {
    return store.filter((n) => n.recipientId === recipientId && !n.readAt);
  }

  async countUnreadByRecipient(_tenantId: string, recipientId: string): Promise<number> {
    return store.filter((n) => n.recipientId === recipientId && !n.readAt).length;
  }

  async update(
    _tenantId: string,
    id: string,
    data: Partial<Omit<AppNotification, 'id'>>,
  ): Promise<AppNotification> {
    const idx = store.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Notification not found');
    store[idx] = { ...store[idx], ...data };
    return store[idx];
  }

  async markAllRead(_tenantId: string, recipientId: string, readAt: Date): Promise<number> {
    let count = 0;
    store.forEach((n, i) => {
      if (n.recipientId === recipientId && !n.readAt) {
        store[i] = { ...n, readAt };
        count++;
      }
    });
    return count;
  }
}
