import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import * as ledgerService from '@/server/services/ledger.service';

export const ledgerRouter = router({
  list: protectedProcedure.query(async () => {
    return { entries: ledgerService.listEntries() };
  }),

  addEntry: protectedProcedure
    .input(
      z.object({
        contactId: z.string().min(1),
        contactName: z.string().min(1),
        type: z.enum(['debit', 'credit']),
        amount: z.number().min(0),
        reference: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const entry = ledgerService.addEntry({ ...input, date: new Date() });
      return { entry };
    }),

  balances: protectedProcedure.query(async () => {
    return { balances: ledgerService.balanceByContact() };
  }),

  byContact: protectedProcedure
    .input(z.object({ contactId: z.string() }))
    .query(async ({ input }) => {
      return { entries: ledgerService.getByContact(input.contactId) };
    }),
});
