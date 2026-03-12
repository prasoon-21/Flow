import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import * as purchaseService from '@/server/services/purchase.service';
import { extractPurchaseFromDocument } from '@/server/services/agentic-core.service';

const MAX_BASE64_SIZE = 10 * 1024 * 1024; // ~10 MB

export const purchaseRouter = router({
  list: protectedProcedure.query(async () => {
    return { purchases: purchaseService.listPurchases() };
  }),

  extractDocument: protectedProcedure
    .input(
      z.object({
        base64: z.string().min(1).max(MAX_BASE64_SIZE),
        mimeType: z.enum([
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
        ]),
        filename: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const data = await extractPurchaseFromDocument(input);
      return { data };
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
