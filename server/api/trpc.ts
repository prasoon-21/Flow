/**
 * tRPC Setup
 * Creates tRPC context with tenant resolution
 */

import { initTRPC, TRPCError } from '@trpc/server';
import type { NextApiRequest } from 'next';
import { TenantContext } from '@/lib/types/tenant';
import { AuthService } from '../services/auth.service';

/**
 * Context for tRPC procedures
 */
export interface Context {
  tenantContext: TenantContext | null;
  req: NextApiRequest;
}

/**
 * Create tRPC instance
 */
const t = initTRPC.context<Context>().create();

/**
 * Base router and procedure
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware to require tenant context
 */
const requireTenantContext = t.middleware(async ({ ctx, next }) => {
  if (!ctx.tenantContext) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenantContext: ctx.tenantContext,
    } as Context & { tenantContext: TenantContext },
  });
});

/**
 * Protected procedure with tenant context
 */
export const protectedProcedure = t.procedure.use(requireTenantContext);

/**
 * Create context from request
 */
export async function createContext(opts: { req: NextApiRequest }): Promise<Context> {
  const authService = new AuthService();
  const tenantContext = await authService.resolveUserContext(opts.req);

  // Minimal debug info to help trace missing tenant context during development.
  // Logs only presence and non-sensitive identifiers (no secrets or tokens).
  try {
    console.debug('[trpc] resolved tenantContext:',
      tenantContext
        ? { userId: tenantContext.userId, tenantId: tenantContext.tenantId, userRole: tenantContext.userRole }
        : null
    );
  } catch (err) {
    // Ignore logging failures to avoid breaking request handling
  }

  return {
    tenantContext,
    req: opts.req,
  };
}
