/**
 * Tenant Router
 */

import { router, protectedProcedure } from '../trpc';
import { TenantService } from '../../services/tenant.service';
import { z } from 'zod';

export const tenantRouter = router({
  getById: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantService = new TenantService();
      return tenantService.getTenantById(input.tenantId, ctx.tenantContext);
    }),

  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantService = new TenantService();
      return tenantService.getTenantBySlug(input.slug);
    }),
});

