/**
 * Channel Service
 * Business logic for channel operations
 */

import { TenantContext } from '@/lib/types/tenant';
import { ChannelType } from '@/lib/types/page';
import { ChannelRepository } from '../adapters/repositories/channel.repository';

export class ChannelService {
  private channelRepo: ChannelRepository;

  constructor() {
    this.channelRepo = new ChannelRepository();
  }

  /**
   * Get channel by type with tenancy guard
   */
  async getChannelByType(
    type: ChannelType,
    context: TenantContext
  ): Promise<any | null> {
    const channel = await this.channelRepo.findByTypeAndTenant(type, context.tenantId);
    if (!channel) {
      return null;
    }

    // Tenancy guard: ensure channel belongs to context tenant
    if (channel.tenantId !== context.tenantId) {
      throw new Error('Tenant mismatch: cannot access other tenant channel');
    }

    return channel;
  }

  /**
   * Get all active channels for tenant
   */
  async getActiveChannels(context: TenantContext): Promise<any[]> {
    const channels = await this.channelRepo.findActiveByTenant(context.tenantId);

    // Tenancy guard: filter by tenant (redundant but safe)
    return channels.filter((ch) => ch.tenantId === context.tenantId);
  }

  /**
   * Get channel statistics (stub for now)
   */
  async getChannelStats(type: ChannelType, context: TenantContext): Promise<any> {
    // Tenancy guard
    const channel = await this.getChannelByType(type, context);
    if (!channel) {
      return {
        active: 0,
        pending: 0,
        failed: 0,
      };
    }

    // TODO: Implement actual stats from conversations collection
    return {
      active: 0,
      pending: 0,
      failed: 0,
    };
  }
}

