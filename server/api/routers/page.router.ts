/**
 * Page Router
 */

import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { PageService } from '../../services/page.service';
import { AccessControlService } from '../../services/access-control.service';
import { z } from 'zod';

const accessControlService = new AccessControlService();

export const pageRouter = router({
  getByPath: protectedProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ ctx, input }) => {
      const decision = await accessControlService.getPageDecision(input.path, ctx.tenantContext);
      if (!decision.allowed || !decision.page) {
        throw new TRPCError({
          code: decision.reason === 'not_found' ? 'NOT_FOUND' : 'FORBIDDEN',
          message: decision.reason === 'not_found' ? 'Page not found' : 'Access denied',
        });
      }
      return decision.page;
    }),

  getAccessible: protectedProcedure.query(async ({ ctx }) => {
    const pageService = new PageService();
    return pageService.getAccessiblePages(ctx.tenantContext);
  }),
});
