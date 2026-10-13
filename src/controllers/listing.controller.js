import {
  changeListingStatus,
  createListing,
  deleteListing,
  getListingById,
  getListingBySlug,
  incrementViewCount,
  listFeaturedListings,
  listListings,
  listSellerListings,
  updateListing,
} from '#services/listing.service.js';
import { sendPaginated, sendSuccess } from '#utils/format.js';
import { asyncHandler } from '#utils/asyncHandler.js';

export const browseListings = asyncHandler(async (req, res) => {
  const { data, page, limit, total } = await listListings(req.query, req.user);
  return sendPaginated(res, { data, page, limit, total });
});

export const getFeaturedListings = asyncHandler(async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 6, 20);
  const data = await listFeaturedListings(limit);
  return sendSuccess(res, { data });
});

export const getListing = asyncHandler(async (req, res) => {
  const listing = await getListingById(req.params.id, req.user);
  incrementViewCount(req.params.id).catch(() => {});
  return sendSuccess(res, { data: { listing } });
});

export const getListingBySlugname = asyncHandler(async (req, res) => {
  const listing = await getListingBySlug(req.params.slug, req.user);
  incrementViewCount(listing.id).catch(() => {});
  return sendSuccess(res, { data: { listing } });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const { data, page, limit, total } = await listSellerListings(req.user.id, req.query, req.user);
  return sendPaginated(res, { data, page, limit, total });
});

export const getSellerListings = asyncHandler(async (req, res) => {
  const { data, page, limit, total } = await listSellerListings(req.params.sellerId, req.query, req.user);
  return sendPaginated(res, { data, page, limit, total });
});

export const createNewListing = asyncHandler(async (req, res) => {
  const listing = await createListing(req.user.id, req.body);
  return sendSuccess(res, { data: { listing }, message: 'Listing created successfully', statusCode: 201 });
});

export const updateExistingListing = asyncHandler(async (req, res) => {
  const listing = await updateListing(req.params.id, req.user, req.body);
  return sendSuccess(res, { data: { listing }, message: 'Listing updated successfully' });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const listing = await changeListingStatus(req.params.id, req.user, req.body.status);
  return sendSuccess(res, { data: { listing }, message: `Listing ${req.body.status}` });
});

export const removeListing = asyncHandler(async (req, res) => {
  const result = await deleteListing(req.params.id, req.user);
  return sendSuccess(res, { data: result, message: 'Listing deleted successfully' });
});
