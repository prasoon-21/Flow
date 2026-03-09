/**
 * Firestore helper utilities — in-memory stubs for demo mode
 */

import type { ChannelType } from '@/lib/types/page';

type FirestoreDateValue = Date | string | null | undefined;
type ConversationChannel = ChannelType | 'webchat';

export interface ConversationQueryOptions {
  start?: Date;
  end?: Date;
  cursor?: {
    id: string;
    lastMessageAt: FirestoreDateValue;
  };
}

/**
 * Convert a date-like value to ISO string. Returns null if not parseable.
 */
export function toIsoString(value: FirestoreDateValue): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
}

export function toMillis(value: FirestoreDateValue): number | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  }
  return null;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function queryConversationsByChannel(
  _businessRef: unknown,
  _channel: ConversationChannel,
  _limit: number,
  _options?: ConversationQueryOptions,
): Promise<never[]> {
  return [];
}
