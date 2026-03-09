/**
 * Tag Router — in-memory tag management for demo mode
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { tags, TagRecord } from '@/data/tags';

const tagInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  category: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  archived: z.boolean().optional(),
});

const listInputSchema = z
  .object({
    scopes: z.array(z.string()).optional(),
    includeArchived: z.boolean().optional(),
  })
  .optional();

export const tagRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    let result = tags as TagRecord[];

    if (!input?.includeArchived) {
      result = result.filter((t) => !t.archived);
    }

    if (input?.scopes?.length) {
      const scopes = new Set(input.scopes);
      result = result.filter((t) => t.scopes.some((s) => scopes.has(s)));
    }

    return { tags: result };
  }),

  upsert: protectedProcedure.input(tagInputSchema).mutation(async ({ input }) => {
    const name = input.name.trim();
    const slug = slugify(name);
    const now = new Date();

    const duplicate = tags.find((t) => t.slug === slug && t.id !== input.id);
    if (duplicate) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A tag with this name already exists.' });
    }

    if (input.id) {
      const idx = tags.findIndex((t) => t.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found.' });
      }
      const payload = {
        name,
        slug,
        scopes: input.scopes,
        category: input.category ?? null,
        color: input.color ?? null,
        archived: input.archived ?? false,
        updatedAt: now,
      };
      tags[idx] = { ...tags[idx], ...payload };
      return tags[idx];
    }

    const newTag: TagRecord = {
      id: `t${Date.now()}`,
      name,
      slug,
      scopes: input.scopes,
      category: input.category ?? null,
      color: input.color ?? null,
      archived: input.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };
    tags.push(newTag);
    return newTag;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const idx = tags.findIndex((t) => t.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tag not found.' });
      }
      tags.splice(idx, 1);
      return { ok: true };
    }),
});

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
