import { z } from 'zod';
import { paginationQuerySchema, queryBooleanSchema } from '#validations/common.validation.js';

const moneySchema = z.coerce
  .number()
  .nonnegative('Amount must be non-negative')
  .max(999999999999, 'Amount is too large');

const listingFields = {
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(160),
  tagline: z.string().trim().max(240),
  description: z.string().trim().max(20000),
  category: z.enum(['saas', 'ecommerce', 'content', 'marketplace', 'mobile-app', 'ai-tool', 'dev-tool', 'other']),
  businessModel: z.enum([
    'subscription',
    'one-time',
    'freemium',
    'advertising',
    'marketplace-fee',
    'usage-based',
    'other',
  ]),
  techStack: z.array(z.string().trim().min(1).max(60)).max(20),
  websiteUrl: z.url('websiteUrl must be a valid URL').max(2048),
  country: z.string().trim().max(80),
  foundedYear: z.coerce.number().int().min(1990).max(new Date().getFullYear()),
  teamSize: z.coerce.number().int().min(0).max(100000),
  monthlyVisitors: z.coerce.number().int().min(0),
  monthlyRevenue: moneySchema,
  monthlyProfit: moneySchema,
  askingPrice: moneySchema,
  revenueMultiple: z.coerce.number().nonnegative().max(1000),
  status: z.enum(['draft', 'active', 'pending', 'sold', 'cancelled']),
  isFeatured: z.coerce.boolean(),
};

export const createListingSchema = z.object({
  title: listingFields.title,
  askingPrice: listingFields.askingPrice,
  tagline: listingFields.tagline.optional(),
  description: listingFields.description.optional(),
  category: listingFields.category.default('saas'),
  businessModel: listingFields.businessModel.default('subscription'),
  techStack: listingFields.techStack.optional(),
  websiteUrl: listingFields.websiteUrl.optional(),
  country: listingFields.country.optional(),
  foundedYear: listingFields.foundedYear.optional(),
  teamSize: listingFields.teamSize.optional(),
  monthlyVisitors: listingFields.monthlyVisitors.optional(),
  monthlyRevenue: listingFields.monthlyRevenue.optional(),
  monthlyProfit: listingFields.monthlyProfit.optional(),
  revenueMultiple: listingFields.revenueMultiple.optional(),
  status: listingFields.status.default('draft'),
  isFeatured: listingFields.isFeatured.optional(),
});

export const updateListingSchema = z
  .object(Object.fromEntries(Object.entries(listingFields).map(([key, field]) => [key, field.optional()])))
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field to update' });

export const listListingsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(255).optional(),
  category: z
    .enum(['saas', 'ecommerce', 'content', 'marketplace', 'mobile-app', 'ai-tool', 'dev-tool', 'other'])
    .optional(),
  businessModel: z
    .enum(['subscription', 'one-time', 'freemium', 'advertising', 'marketplace-fee', 'usage-based', 'other'])
    .optional(),
  status: z.enum(['draft', 'active', 'pending', 'sold', 'cancelled']).optional(),
  minPrice: moneySchema.optional(),
  maxPrice: moneySchema.optional(),
  minRevenue: moneySchema.optional(),
  minProfit: moneySchema.optional(),
  featured: queryBooleanSchema,
  sellerId: z.uuid('sellerId must be a valid UUID').optional(),
  sort: z
    .enum(['newest', 'oldest', 'price-asc', 'price-desc', 'revenue-desc', 'profit-desc', 'views-desc'])
    .default('newest'),
});

export const publishListingSchema = z.object({
  status: z.enum(['active', 'draft']),
});
