import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.uuid('id must be a valid UUID'),
});

export const sellerIdParamSchema = z.object({
  sellerId: z.uuid('sellerId must be a valid UUID'),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'slug is required').max(200),
});

export const queryBooleanSchema = z.stringbool().optional();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
