import { Router } from 'express';
import authRouter from '#routes/auth.routes.js';
import userRouter from '#routes/user.routes.js';
import listingRouter from '#routes/listing.routes.js';
import offerRouter from '#routes/offer.routes.js';
import healthRouter from '#routes/health.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/listings', listingRouter);
apiRouter.use('/offers', offerRouter);

export default apiRouter;
