import { registerSchema, loginSchema } from '#validations/auth.validation.js';
import { createListingSchema, listListingsQuerySchema, updateListingSchema } from '#validations/listing.validation.js';
import { createOfferSchema } from '#validations/offer.validation.js';
import { paginationQuerySchema, uuidParamSchema } from '#validations/common.validation.js';

describe('Auth validation schemas', () => {
  it('accepts a valid registration payload and normalizes the email', () => {
    const result = registerSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'Ada@Example.COM',
      password: 'Password123!',
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe('ada@example.com');
    expect(result.data.role).toBe('user');
  });

  it('rejects passwords that miss complexity rules', () => {
    for (const password of ['short1!', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoNumbersHere!']) {
      expect(loginSchema.safeParse({ email: 'ada@example.com', password }).success).toBe(true);
      expect(registerSchema.safeParse({ name: 'Ada', email: 'ada@example.com', password }).success).toBe(false);
    }
  });
});

describe('Listing validation schemas', () => {
  it('accepts a minimal listing payload', () => {
    const result = createListingSchema.safeParse({ title: 'Great SaaS business', askingPrice: 120000 });

    expect(result.success).toBe(true);
    expect(result.data.category).toBe('saas');
    expect(result.data.status).toBe('draft');
  });

  it('rejects negative prices and short titles', () => {
    expect(createListingSchema.safeParse({ title: 'abc', askingPrice: -5 }).success).toBe(false);
    expect(createListingSchema.safeParse({ title: 'Valid title here' }).success).toBe(false);
  });

  it('rejects empty update payloads', () => {
    expect(updateListingSchema.safeParse({}).success).toBe(false);
    expect(updateListingSchema.safeParse({ tagline: 'New tagline' }).success).toBe(true);
  });

  it('coerces pagination and boolean query params', () => {
    const result = listListingsQuerySchema.safeParse({ page: '2', limit: '5', featured: 'false', minPrice: '1000' });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ page: 2, limit: 5, featured: false, minPrice: 1000 });
  });
});

describe('Offer & common validation schemas', () => {
  it('uppercases currency codes and requires positive amounts', () => {
    const result = createOfferSchema.safeParse({
      listingId: '123e4567-e89b-42d3-a456-426614174000',
      amount: 50000,
      currency: 'usd',
    });

    expect(result.success).toBe(true);
    expect(result.data.currency).toBe('USD');
    expect(createOfferSchema.safeParse({ listingId: '123e4567-e89b-42d3-a456-426614174000', amount: 0 }).success).toBe(
      false,
    );
  });

  it('validates UUID params and pagination bounds', () => {
    expect(uuidParamSchema.safeParse({ id: '123e4567-e89b-42d3-a456-426614174000' }).success).toBe(true);
    expect(uuidParamSchema.safeParse({ id: 'nope' }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ page: '0', limit: '500' }).success).toBe(false);
  });
});
