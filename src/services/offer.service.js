import { and, asc, count, desc, eq, or } from 'drizzle-orm';
import { db } from '#config/database.js';
import { logger } from '#config/logger.js';
import { listings } from '#models/listing.model.js';
import { offers } from '#models/offer.model.js';
import { AppError } from '#utils/AppError.js';
import { getPagination } from '#utils/pagination.js';

function serializeOffer(row) {
  if (!row) return null;
  return { ...row, amount: Number(row.amount) };
}

async function getListingOrThrow(listingId) {
  const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!listing) throw AppError.notFound('Listing not found');
  return listing;
}

async function getOfferWithAccess(id, actor) {
  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, id),
    with: {
      listing: true,
      buyer: { columns: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });
  if (!offer) throw AppError.notFound('Offer not found');

  const isBuyer = actor.id === offer.buyerId;
  const isSeller = actor.id === offer.listing.sellerId;
  const isAdmin = actor.role === 'admin';
  if (!isBuyer && !isSeller && !isAdmin) throw AppError.forbidden('You cannot view this offer');

  return offer;
}

export async function createOffer(buyerId, { listingId, amount, currency, message }) {
  const listing = await getListingOrThrow(listingId);

  if (listing.status !== 'active') throw AppError.badRequest('Offers can only be placed on active listings');
  if (listing.sellerId === buyerId) throw AppError.badRequest('You cannot place an offer on your own listing');

  const [duplicate] = await db
    .select({ id: offers.id })
    .from(offers)
    .where(and(eq(offers.listingId, listingId), eq(offers.buyerId, buyerId), eq(offers.status, 'pending')))
    .limit(1);
  if (duplicate) throw AppError.conflict('You already have a pending offer on this listing');

  const [offer] = await db
    .insert(offers)
    .values({ listingId, buyerId, amount: String(amount), currency, message: message ?? null })
    .returning();

  logger.info('Offer created', { offerId: offer.id, listingId, buyerId });
  return serializeOffer(offer);
}

export async function getOfferById(id, actor) {
  const offer = await getOfferWithAccess(id, actor);
  return { ...serializeOffer(offer), listing: offer.listing, buyer: offer.buyer };
}

export async function listOffers(query = {}, actor) {
  const { page, limit, offset } = getPagination(query);
  const conditions = [];

  const isAdmin = actor.role === 'admin';
  if (!isAdmin) {
    conditions.push(or(eq(offers.buyerId, actor.id), eq(listings.sellerId, actor.id)));
  }
  if (query.listingId) conditions.push(eq(offers.listingId, query.listingId));
  if (query.buyerId) {
    if (!isAdmin && query.buyerId !== actor.id) throw AppError.forbidden('You can only list your own offers');
    conditions.push(eq(offers.buyerId, query.buyerId));
  }
  if (query.status) conditions.push(eq(offers.status, query.status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy =
    query.sort === 'oldest'
      ? asc(offers.createdAt)
      : query.sort === 'amount-desc'
        ? desc(offers.amount)
        : query.sort === 'amount-asc'
          ? asc(offers.amount)
          : desc(offers.createdAt);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ offer: offers, listing: listings })
      .from(offers)
      .leftJoin(listings, eq(offers.listingId, listings.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(offers).leftJoin(listings, eq(offers.listingId, listings.id)).where(where),
  ]);

  return {
    data: rows.map(({ offer, listing }) => ({ ...serializeOffer(offer), listing })),
    page,
    limit,
    total,
  };
}

export async function decideOffer(id, actor, decision) {
  const offer = await getOfferWithAccess(id, actor);

  const isSeller = actor.id === offer.listing.sellerId;
  if (!isSeller && actor.role !== 'admin') throw AppError.forbidden('Only the seller can decide on this offer');
  if (offer.status !== 'pending') throw AppError.badRequest(`Offer is already ${offer.status}`);

  const [updated] = await db
    .update(offers)
    .set({ status: decision, decidedAt: new Date() })
    .where(eq(offers.id, id))
    .returning();

  if (decision === 'accepted') {
    await db.update(listings).set({ status: 'pending' }).where(eq(listings.id, offer.listingId));
  }

  logger.info('Offer decided', { offerId: id, decision, actorId: actor.id });
  return serializeOffer(updated);
}

export async function withdrawOffer(id, actor) {
  const offer = await getOfferWithAccess(id, actor);

  if (actor.id !== offer.buyerId && actor.role !== 'admin') {
    throw AppError.forbidden('Only the buyer can withdraw this offer');
  }
  if (offer.status !== 'pending') throw AppError.badRequest(`Offer is already ${offer.status}`);

  const [updated] = await db.update(offers).set({ status: 'withdrawn' }).where(eq(offers.id, id)).returning();

  logger.info('Offer withdrawn', { offerId: id, actorId: actor.id });
  return serializeOffer(updated);
}
