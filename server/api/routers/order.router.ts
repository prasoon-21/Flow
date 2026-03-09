import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import * as orderService from '@/server/services/order.service';
import * as invoiceService from '@/server/services/invoice.service';

export const orderRouter = router({
  list: protectedProcedure.query(async () => {
    return { orders: orderService.listOrders() };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const order = orderService.getOrder(input.id);
      if (!order) return { order: null };
      return { order };
    }),

  create: protectedProcedure
    .input(
      z.object({
        contactId: z.string().min(1),
        items: z.array(
          z.object({ productId: z.string(), quantity: z.number().int().min(1) }),
        ).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const order = orderService.createOrder(input);
      return { order };
    }),

  invoice: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const invoice = invoiceService.generateInvoiceData(input.orderId);
      return { invoice };
    }),

  invoicePdf: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input }) => {
      const pdfBase64 = await invoiceService.generateInvoicePdf(input.orderId);
      return { pdfBase64 };
    }),
});
