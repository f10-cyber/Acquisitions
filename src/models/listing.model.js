import { boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from '#models/user.model.js';

export const listingStatusEnum = pgEnum('listing_status', ['draft', 'active', 'pending', 'sold', 'cancelled']);

export const listingCategoryEnum = pgEnum('listing_category', [
  'saas',
  'ecommerce',
  'content',
  'marketplace',
  'mobile-app',
  'ai-tool',
  'dev-tool',
  'other',
]);

export const listingBusinessModelEnum = pgEnum('listing_business_model', [
  'subscription',
  'one-time',
  'freemium',
  'advertising',
  'marketplace-fee',
  'usage-based',
  'other',
]);

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    tagline: varchar('tagline', { length: 240 }),
    description: text('description'),
    category: listingCategoryEnum('category').default('saas').notNull(),
    businessModel: listingBusinessModelEnum('business_model').default('subscription').notNull(),
    techStack: text('tech_stack').array(),
    websiteUrl: text('website_url'),
    country: varchar('country', { length: 80 }),
    foundedYear: integer('founded_year'),
    teamSize: integer('team_size'),
    monthlyVisitors: integer('monthly_visitors'),
    monthlyRevenue: numeric('monthly_revenue', { precision: 14, scale: 2 }),
    monthlyProfit: numeric('monthly_profit', { precision: 14, scale: 2 }),
    askingPrice: numeric('asking_price', { precision: 14, scale: 2 }).notNull(),
    revenueMultiple: numeric('revenue_multiple', { precision: 6, scale: 2 }),
    status: listingStatusEnum('status').default('draft').notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('listings_seller_id_idx').on(table.sellerId),
    index('listings_status_idx').on(table.status),
    index('listings_category_idx').on(table.category),
    index('listings_asking_price_idx').on(table.askingPrice),
  ],
);
