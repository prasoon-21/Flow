/**
 * Channel Repository — in-memory stub for demo mode
 */

import { BaseRepository } from '../firestore';
import { Channel, ChannelType } from '@/lib/types/page';

export class ChannelRepository extends BaseRepository<Channel> {
  constructor() {
    super('channels');
  }

  async findByTypeAndTenant(_type: ChannelType, _tenantId: string): Promise<Channel | null> {
    return null;
  }

  async findActiveByTenant(_tenantId: string): Promise<Channel[]> {
    return [];
  }
}

