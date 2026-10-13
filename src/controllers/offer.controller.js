import { createOffer, decideOffer, getOfferById, listOffers, withdrawOffer } from '#services/offer.service.js';
import { sendPaginated, sendSuccess } from '#utils/format.js';
import { asyncHandler } from '#utils/asyncHandler.js';

export const browseOffers = asyncHandler(async (req, res) => {
  const { data, page, limit, total } = await listOffers(req.query, req.user);
  return sendPaginated(res, { data, page, limit, total });
});

export const getOffer = asyncHandler(async (req, res) => {
  const offer = await getOfferById(req.params.id, req.user);
  return sendSuccess(res, { data: { offer } });
});

export const placeOffer = asyncHandler(async (req, res) => {
  const offer = await createOffer(req.user.id, req.body);
  return sendSuccess(res, { data: { offer }, message: 'Offer placed successfully', statusCode: 201 });
});

export const decideOnOffer = asyncHandler(async (req, res) => {
  const offer = await decideOffer(req.params.id, req.user, req.body.decision);
  return sendSuccess(res, { data: { offer }, message: `Offer ${req.body.decision}` });
});

export const withdrawMyOffer = asyncHandler(async (req, res) => {
  const offer = await withdrawOffer(req.params.id, req.user);
  return sendSuccess(res, { data: { offer }, message: 'Offer withdrawn' });
});
