import type { PushPlatform, PushToken } from '@/lib/types/notification';
import { PushTokenRepository } from '@/server/adapters/repositories/push-token.repository';

export class PushTokenService {
  private repo = new PushTokenRepository();

  async register(
    tenantId: string,
    userId: string,
    token: string,
    platform: PushPlatform,
  ): Promise<PushToken> {
    return this.repo.upsert(tenantId, token, {
      userId,
      platform,
      lastSeenAt: new Date(),
    });
  }

  async remove(tenantId: string, token: string): Promise<void> {
    await this.repo.deleteToken(tenantId, token);
  }
}
