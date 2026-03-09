/**
 * User Repository — in-memory stub backed by data/users.ts
 */

import { BaseRepository } from '../firestore';
import { User } from '@/lib/types/tenant';
import { users } from '@/data/users';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findById(id: string): Promise<User | null> {
    return users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return users.find((u) => u.email === email) ?? null;
  }

  async findByTenantAndRole(tenantId: string, role: string): Promise<User[]> {
    return users.filter((u) => u.tenantId === tenantId && u.role === role);
  }

  async findByTenantAndName(tenantId: string, name: string): Promise<User | null> {
    return users.find((u) => u.tenantId === tenantId && u.name === name) ?? null;
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return users.filter((u) => u.tenantId === tenantId);
  }
}
