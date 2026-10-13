import { relations } from 'drizzle-orm';
import { users, userRoleEnum } from '#models/user.model.js';
import { listings, listingBusinessModelEnum, listingCategoryEnum, listingStatusEnum } from '#models/listing.model.js';
import { offers, offerStatusEnum } from '#models/offer.model.js';
import { refreshTokens } from '#models/refreshToken.model.js';

export const usersRelations = relations(users, ({ many }) => ({
  listings: many(listings),
  offers: many(offers),
  refreshTokens: many(refreshTokens),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(listings, { fields: [offers.listingId], references: [listings.id] }),
  buyer: one(users, { fields: [offers.buyerId], references: [users.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const schema = {
  users,
  listings,
  offers,
  refreshTokens,
  usersRelations,
  listingsRelations,
  offersRelations,
  refreshTokensRelations,
};

export { users, userRoleEnum };
export { listings, listingBusinessModelEnum, listingCategoryEnum, listingStatusEnum };
export { offers, offerStatusEnum };
export { refreshTokens };
