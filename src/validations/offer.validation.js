import { z } from 'zod';
import { paginationQuerySchema } from '#validations/common.validation.js';

export const createOfferSchema = z.object({
  listingId: z.uuid('listingId must be a valid UUID'),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(999999999999, 'Amount is too large'),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter ISO code').toUpperCase().default('USD'),
  message: z.string().trim().max(2000).optional(),
});

export const decideOfferSchema = z.object({
  decision: z.enum(['accepted', 'rejected']),
});

export const listOffersQuerySchema = paginationQuerySchema.extend({
  listingId: z.uuid('listingId must be a valid UUID').optional(),
  buyerId: z.uuid('buyerId must be a valid UUID').optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).optional(),
  sort: z.enum(['newest', 'oldest', 'amount-desc', 'amount-asc']).default('newest'),
});
