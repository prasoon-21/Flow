/**
 * Auth Service (Placeholder)
 * Handles authentication and user context resolution
 */

import { TenantContext } from '@/lib/types/tenant';
import { UserRepository } from '../adapters/repositories/user.repository';
import { readSessionFromRequest } from './session.service';
import type { NextApiRequest } from 'next';
import { resolveUserModules } from '@/lib/access/modules';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Resolve user context from request
   * In production, this would validate JWT/session and fetch user
   */
  async resolveUserContext(req: NextApiRequest): Promise<TenantContext | null> {
    const session = readSessionFromRequest(req);
    if (!session) {
      return null;
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      userRole: user.role,
      modules: resolveUserModules(user),
      capabilities: user.capabilities ?? [],
    };
  }

  /**
   * Validate user has access to tenant
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return false;
    }

    return user.tenantId === tenantId;
  }
}
