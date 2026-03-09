/**
 * Push Token Repository — in-memory stub for demo mode
 */

import type { PushToken, PushPlatform } from '@/lib/types/notification';

const store: PushToken[] = [];

export class PushTokenRepository {
  async upsert(
    tenantId: string,
    token: string,
    data: { userId: string; platform: PushPlatform; lastSeenAt?: Date | null },
  ): Promise<PushToken> {
    const now = new Date();
    const existing = store.find((t) => t.token === token);
    if (existing) {
      Object.assign(existing, { ...data, updatedAt: now, lastSeenAt: data.lastSeenAt ?? now });
      return existing;
    }
    const entry: PushToken = {
      id: token,
      tenantId,
      userId: data.userId,
      token,
      platform: data.platform,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: data.lastSeenAt ?? now,
    };
    store.push(entry);
    return entry;
  }

  async listByUser(_tenantId: string, userId: string): Promise<PushToken[]> {
    return store.filter((t) => t.userId === userId);
  }

  async deleteToken(_tenantId: string, token: string): Promise<void> {
    const idx = store.findIndex((t) => t.token === token);
    if (idx !== -1) store.splice(idx, 1);
  }

  async deleteTokens(_tenantId: string, tokens: string[]): Promise<void> {
    const set = new Set(tokens);
    for (let i = store.length - 1; i >= 0; i--) {
      if (set.has(store[i].token)) store.splice(i, 1);
    }
  }
}
