/**
 * Push Notification Service — stub for demo mode (no FCM)
 */

export interface PushPayload {
  title: string;
  body?: string;
  link?: string;
  data?: Record<string, string>;
}

export class PushNotificationService {
  async sendToUser(
    _tenantId: string,
    _userId: string,
    _payload: PushPayload,
  ): Promise<{ sent: number; failed: number }> {
    return { sent: 0, failed: 0 };
  }
}
