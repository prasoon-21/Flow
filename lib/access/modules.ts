import { ModuleKey, User, UserRole } from '@/lib/types/tenant';

const ROLE_BASED_MODULES: Record<UserRole, ModuleKey[]> = {
  admin: ['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'automations', 'contacts', 'tickets', 'shipping-label'],
  agent: ['dashboard', 'ivr', 'email', 'whatsapp', 'chatbot', 'contacts', 'tickets', 'shipping-label'],
  viewer: ['dashboard', 'ivr'],
};

export function resolveUserModules(user: Pick<User, 'role' | 'modules'>): ModuleKey[] {
  if (user.modules && user.modules.length > 0) {
    return [...new Set(user.modules)];
  }
  return ROLE_BASED_MODULES[user.role] ?? [];
}
