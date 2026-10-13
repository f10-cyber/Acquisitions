import { Router } from 'express';
import { browseOffers, decideOnOffer, getOffer, placeOffer, withdrawMyOffer } from '#controllers/offer.controller.js';
import { authenticate } from '#middleware/auth.middleware.js';
import { arcjetRateLimit } from '#middleware/arcjet.middleware.js';
import { validate } from '#middleware/validate.middleware.js';
import { uuidParamSchema } from '#validations/common.validation.js';
import { createOfferSchema, decideOfferSchema, listOffersQuerySchema } from '#validations/offer.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listOffersQuerySchema, 'query'), browseOffers);
router.get('/:id', validate(uuidParamSchema, 'params'), getOffer);
router.post('/', arcjetRateLimit, validate(createOfferSchema), placeOffer);
router.patch('/:id/decide', validate(uuidParamSchema, 'params'), validate(decideOfferSchema), decideOnOffer);
router.patch('/:id/withdraw', validate(uuidParamSchema, 'params'), withdrawMyOffer);

export default router;
