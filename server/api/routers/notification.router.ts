import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { NotificationService } from '@/server/services/notification.service';
import { PushTokenService } from '@/server/services/push-token.service';

const notificationService = new NotificationService();
const pushTokenService = new PushTokenService();

const listInputSchema = z
  .object({
    limit: z.number().min(1).max(100).optional(),
  })
  .optional();

export const notificationRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ ctx, input }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const notifications = await notificationService.listForRecipient(tenantId, userId, input?.limit ?? 40);
    return { notifications };
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const count = await notificationService.unreadCount(tenantId, userId);
    return { count };
  }),

  markRead: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const notification = await notificationService.markRead(tenantId, userId, input.id);
    return { notification };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const updated = await notificationService.markAllRead(tenantId, userId);
    return { updated };
  }),

  registerDevice: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        platform: z.enum(['web']).default('web'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      const userId = ctx.tenantContext.userId;
      const device = await pushTokenService.register(tenantId, userId, input.token, input.platform);
      return { device };
    }),

  unregisterDevice: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      await pushTokenService.remove(tenantId, input.token);
      return { removed: true };
    }),
});
