import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import * as inventoryService from '@/server/services/inventory.service';

export const inventoryRouter = router({
  list: protectedProcedure.query(async () => {
    return { products: inventoryService.listProducts() };
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        price: z.number().min(0),
        costPrice: z.number().min(0),
        stock: z.number().int().min(0),
        category: z.string().optional().default('General'),
      }),
    )
    .mutation(async ({ input }) => {
      const product = inventoryService.createProduct(input);
      return { product };
    }),
});
