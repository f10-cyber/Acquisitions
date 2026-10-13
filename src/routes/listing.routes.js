import { Router } from 'express';
import {
  browseListings,
  changeStatus,
  createNewListing,
  getFeaturedListings,
  getListing,
  getListingBySlugname,
  getMyListings,
  getSellerListings,
  removeListing,
  updateExistingListing,
} from '#controllers/listing.controller.js';
import { authenticate, optionalAuthenticate } from '#middleware/auth.middleware.js';
import { authorize } from '#middleware/role.middleware.js';
import { arcjetRateLimit } from '#middleware/arcjet.middleware.js';
import { validate } from '#middleware/validate.middleware.js';
import { sellerIdParamSchema, slugParamSchema, uuidParamSchema } from '#validations/common.validation.js';
import {
  createListingSchema,
  listListingsQuerySchema,
  publishListingSchema,
  updateListingSchema,
} from '#validations/listing.validation.js';

const router = Router();

router.get('/', optionalAuthenticate, validate(listListingsQuerySchema, 'query'), browseListings);
router.get('/featured', validate(listListingsQuerySchema, 'query'), getFeaturedListings);
router.get('/mine', authenticate, validate(listListingsQuerySchema, 'query'), getMyListings);
router.get(
  '/seller/:sellerId',
  optionalAuthenticate,
  validate(sellerIdParamSchema, 'params'),
  validate(listListingsQuerySchema, 'query'),
  getSellerListings,
);
router.get('/slug/:slug', optionalAuthenticate, validate(slugParamSchema, 'params'), getListingBySlugname);
router.get('/:id', optionalAuthenticate, validate(uuidParamSchema, 'params'), getListing);

router.post(
  '/',
  authenticate,
  authorize('seller', 'admin'),
  arcjetRateLimit,
  validate(createListingSchema),
  createNewListing,
);
router.patch(
  '/:id',
  authenticate,
  validate(uuidParamSchema, 'params'),
  validate(updateListingSchema),
  updateExistingListing,
);
router.patch(
  '/:id/status',
  authenticate,
  validate(uuidParamSchema, 'params'),
  validate(publishListingSchema),
  changeStatus,
);
router.delete('/:id', authenticate, validate(uuidParamSchema, 'params'), removeListing);

export default router;
