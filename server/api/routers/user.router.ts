import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { UserRepository } from '@/server/adapters/repositories/user.repository';
import { resolveUserModules } from '@/lib/access/modules';

const userRepo = new UserRepository();

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await userRepo.findById(ctx.tenantContext.userId);
    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      modules: resolveUserModules(user),
      capabilities: user.capabilities ?? [],
    };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const users = await userRepo.findByTenant(tenantId);
    return {
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    };
  }),
});
