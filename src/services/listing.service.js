import { randomBytes } from 'node:crypto';
import { and, asc, count, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { db } from '#config/database.js';
import { logger } from '#config/logger.js';
import { listings } from '#models/listing.model.js';
import { AppError } from '#utils/AppError.js';
import { getPagination } from '#utils/pagination.js';

function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 170);
  return base || 'listing';
}

async function generateUniqueSlug(title) {
  const base = slugify(title);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomBytes(3).toString('hex')}`;
    const [existing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.slug, candidate)).limit(1);
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function withoutUndefined(patch) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function serializeListing(row) {
  if (!row) return null;
  return {
    ...row,
    monthlyRevenue: row.monthlyRevenue === null ? null : Number(row.monthlyRevenue),
    monthlyProfit: row.monthlyProfit === null ? null : Number(row.monthlyProfit),
    askingPrice: Number(row.askingPrice),
    revenueMultiple: row.revenueMultiple === null ? null : Number(row.revenueMultiple),
  };
}

function isOwnerOrAdmin(listing, actor) {
  return actor && (listing.sellerId === actor.id || actor.role === 'admin');
}

function buildFilters(query) {
  const conditions = [];

  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(or(ilike(listings.title, term), ilike(listings.tagline, term), ilike(listings.description, term)));
  }
  if (query.category) conditions.push(eq(listings.category, query.category));
  if (query.businessModel) conditions.push(eq(listings.businessModel, query.businessModel));
  if (query.sellerId) conditions.push(eq(listings.sellerId, query.sellerId));
  if (query.featured !== undefined) conditions.push(eq(listings.isFeatured, query.featured));
  if (query.minPrice !== undefined) conditions.push(gte(listings.askingPrice, String(query.minPrice)));
  if (query.maxPrice !== undefined) conditions.push(lte(listings.askingPrice, String(query.maxPrice)));
  if (query.minRevenue !== undefined) conditions.push(gte(listings.monthlyRevenue, String(query.minRevenue)));
  if (query.minProfit !== undefined) conditions.push(gte(listings.monthlyProfit, String(query.minProfit)));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildOrder(sort) {
  switch (sort) {
    case 'oldest':
      return asc(listings.createdAt);
    case 'price-asc':
      return asc(listings.askingPrice);
    case 'price-desc':
      return desc(listings.askingPrice);
    case 'revenue-desc':
      return desc(listings.monthlyRevenue);
    case 'profit-desc':
      return desc(listings.monthlyProfit);
    case 'views-desc':
      return desc(listings.viewCount);
    case 'newest':
    default:
      return desc(listings.createdAt);
  }
}

export async function createListing(sellerId, data) {
  const slug = await generateUniqueSlug(data.title);
  const values = withoutUndefined({ ...data, sellerId, slug });

  const [listing] = await db.insert(listings).values(values).returning();
  logger.info('Listing created', { listingId: listing.id, sellerId });
  return serializeListing(listing);
}

export async function getListingById(id, actor) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) throw AppError.notFound('Listing not found');
  if (listing.status !== 'active' && !isOwnerOrAdmin(listing, actor)) throw AppError.notFound('Listing not found');
  return serializeListing(listing);
}

export async function getListingBySlug(slug, actor) {
  const [listing] = await db.select().from(listings).where(eq(listings.slug, slug)).limit(1);
  if (!listing) throw AppError.notFound('Listing not found');
  if (listing.status !== 'active' && !isOwnerOrAdmin(listing, actor)) throw AppError.notFound('Listing not found');
  return serializeListing(listing);
}

export async function listListings(query = {}, actor) {
  const { page, limit, offset } = getPagination(query);
  const conditions = [];

  const filters = buildFilters(query);
  if (filters) conditions.push(filters);

  const isAdmin = actor?.role === 'admin';
  const viewingOwn = Boolean(query.sellerId && actor && actor.id === query.sellerId);
  if (isAdmin || viewingOwn) {
    if (query.status) conditions.push(eq(listings.status, query.status));
  } else {
    conditions.push(eq(listings.status, 'active'));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(listings).where(where).orderBy(buildOrder(query.sort)).limit(limit).offset(offset),
    db.select({ total: count() }).from(listings).where(where),
  ]);

  return { data: rows.map(serializeListing), page, limit, total };
}

export async function listSellerListings(sellerId, query = {}, actor) {
  return listListings({ ...query, sellerId }, actor);
}

export async function listFeaturedListings(limit = 6) {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.status, 'active'), eq(listings.isFeatured, true)))
    .orderBy(desc(listings.createdAt))
    .limit(Math.min(limit, 20));
  return rows.map(serializeListing);
}

export async function updateListing(id, actor, patch) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) throw AppError.notFound('Listing not found');
  if (!isOwnerOrAdmin(listing, actor)) throw AppError.forbidden('Only the seller or an admin can update this listing');

  const updates = withoutUndefined(patch);
  if (Object.keys(updates).length === 0) throw AppError.badRequest('Provide at least one field to update');

  if (updates.status === 'active' && !listing.publishedAt) updates.publishedAt = new Date();
  if (actor.role !== 'admin') delete updates.isFeatured;

  const [updated] = await db.update(listings).set(updates).where(eq(listings.id, id)).returning();
  logger.info('Listing updated', { listingId: id, actorId: actor.id });
  return serializeListing(updated);
}

export async function changeListingStatus(id, actor, status) {
  return updateListing(id, actor, { status });
}

export async function deleteListing(id, actor) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!listing) throw AppError.notFound('Listing not found');
  if (!isOwnerOrAdmin(listing, actor)) throw AppError.forbidden('Only the seller or an admin can delete this listing');

  await db.delete(listings).where(eq(listings.id, id));
  logger.info('Listing deleted', { listingId: id, actorId: actor.id });
  return { deleted: true };
}

export async function incrementViewCount(id) {
  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, id));
}
