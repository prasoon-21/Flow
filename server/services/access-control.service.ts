/**
 * Access Control Service
 * Centralizes page and feature access decisions.
 */

import { TenantContext } from '@/lib/types/tenant';
import { Page } from '@/lib/types/page';
import { PageService } from './page.service';
import { canAccessFeature, canAccessPage, FeatureConfig } from '../middleware/access-guard';

export type AccessDecisionReason = 'not_found' | 'forbidden';

export interface PageAccessDecision {
  allowed: boolean;
  reason?: AccessDecisionReason;
  page?: Page | null;
}

export interface FeatureAccessDecision {
  allowed: boolean;
  reason?: 'forbidden';
}

interface FeatureRule extends FeatureConfig {
  enabledTenants?: string[];
}

/**
 * Static feature access matrix.
 * Extend as new features roll out.
 */
const FEATURE_MATRIX: Record<string, FeatureRule> = {
  'channel:email': { modules: 'email' },
  'channel:whatsapp': { modules: 'whatsapp' },
  'channel:chatbot': { modules: 'chatbot' },
  'channel:ivr': { modules: 'ivr' },
  automations: { modules: 'automations' },
  contacts: { modules: 'contacts' },
  tickets: { modules: 'tickets' },
  shipping: { modules: 'shipping-label' },
};

export class AccessControlService {
  private pageService: PageService;

  constructor() {
    this.pageService = new PageService();
  }

  /**
   * Evaluate whether the user can view a page.
   */
  async getPageDecision(path: string, context: TenantContext): Promise<PageAccessDecision> {
    const page = await this.pageService.findPageDefinition(path, context);

    if (!page) {
      return {
        allowed: false,
        reason: 'not_found',
        page: null,
      };
    }

    const permitted = true; // bypassed for MVP: canAccessPage(context, page);
    return {
      allowed: permitted,
      reason: undefined,
      page,
    };
  }

  /**
   * Determine if a feature is available to the current user.
   */
  getFeatureDecision(featureKey: string, context: TenantContext): FeatureAccessDecision {
    const rule = FEATURE_MATRIX[featureKey];
    if (!rule) {
      return { allowed: true };
    }

    if (rule.enabledTenants && !rule.enabledTenants.includes(context.tenantId)) {
      return { allowed: false, reason: 'forbidden' };
    }

    const permitted = canAccessFeature(context, featureKey, rule);
    return { allowed: permitted, reason: permitted ? undefined : 'forbidden' };
  }
}
