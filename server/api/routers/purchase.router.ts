import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import * as purchaseService from '@/server/services/purchase.service';

export const purchaseRouter = router({
  list: protectedProcedure.query(async () => {
    return { purchases: purchaseService.listPurchases() };
  }),

  create: protectedProcedure
    .input(
      z.object({
        supplierId: z.string().min(1),
        items: z.array(
          z.object({ productId: z.string(), quantity: z.number().int().min(1) }),
        ).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const purchase = purchaseService.createPurchase(input);
      return { purchase };
    }),
});
