/**
 * Contact Router
 * tRPC endpoints for contact management
 */

import { router, protectedProcedure } from '../trpc';
import { ContactService } from '@/server/services/contact.service';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { AccessControlService } from '@/server/services/access-control.service';

const contactService = new ContactService();
const accessControlService = new AccessControlService();

const contactProcedure = protectedProcedure.use(({ ctx, next }) => {
  const decision = accessControlService.getFeatureDecision('contacts', ctx.tenantContext);
  if (!decision.allowed) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Contacts access denied' });
  }
  return next();
});

const addressSchema = z
  .object({
    address1: z.string().nullable().optional(),
    address2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    province: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
  })
  .optional()
  .nullable();

const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(['customer', 'supplier']).optional(),
  country_code: z.string().nullable().optional(),
  whatsApp_name: z.string().nullable().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  address: addressSchema,
  shopifyCustomerId: z.string().nullable().optional(),
});

const updateContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  country_code: z.string().nullable().optional(),
  whatsApp_name: z.string().nullable().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  address: addressSchema,
  shopifyCustomerId: z.string().nullable().optional(),
});

export const contactRouter = router({
  list: contactProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      const contacts = await contactService.list(tenantId, input?.search);
      return { contacts };
    }),

  getById: contactProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      const contact = await contactService.getById(tenantId, input.id);
      if (!contact) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }
      return { contact };
    }),

  create: contactProcedure.input(createContactSchema).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const contact = await contactService.create(tenantId, input, userId);
    return { contact };
  }),

  update: contactProcedure.input(updateContactSchema).mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenantContext.tenantId;
    const userId = ctx.tenantContext.userId;
    const { id, ...updateData } = input;
    const contact = await contactService.update(tenantId, id, updateData, userId);
    return { contact };
  }),

  syncShopify: contactProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      const userId = ctx.tenantContext.userId;
      try {
        const result = await contactService.syncWithShopify(tenantId, input.id, userId);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to sync contact with Shopify';
        const code = message.toLowerCase().includes('not found')
          ? 'NOT_FOUND'
          : message.toLowerCase().includes('integration')
            ? 'PRECONDITION_FAILED'
            : 'BAD_REQUEST';
        throw new TRPCError({ code, message });
      }
    }),

  delete: contactProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      await contactService.delete(tenantId, input.id);
      return { success: true };
    }),

  getActivityTimeline: contactProcedure
    .input(
      z.object({
        contactId: z.string(),
        excludeTicketId: z.string().optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantId = ctx.tenantContext.tenantId;
      const activities = await contactService.getActivityTimeline(tenantId, input.contactId, {
        excludeTicketId: input.excludeTicketId ?? undefined,
      });
      return { activities };
    }),
});
