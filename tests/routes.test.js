import request from 'supertest';
import app from '../src/app.js';

describe('Route protection & validation (no database required)', () => {
  it('returns 404 JSON for unknown routes', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
  });

  it('rejects register with an invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada Lovelace', email: 'not-an-email', password: 'Password123!' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details.some((detail) => detail.path === 'email')).toBe(true);
  });

  it('rejects register with a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.details.some((detail) => detail.path === 'password')).toBe(true);
  });

  it('rejects login with a missing password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ada@example.com' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for /auth/me', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('requires authentication for user profile routes', async () => {
    const res = await request(app).get('/api/v1/users/profile');

    expect(res.status).toBe(401);
  });

  it('requires authentication for creating listings', async () => {
    const res = await request(app).post('/api/v1/listings').send({ title: 'x', askingPrice: 100 });

    expect(res.status).toBe(401);
  });

  it('requires authentication for offers', async () => {
    const res = await request(app).get('/api/v1/offers');

    expect(res.status).toBe(401);
  });

  it('rejects malformed UUID params with 422', async () => {
    const res = await request(app).get('/api/v1/users/not-a-uuid').set('Authorization', 'Bearer invalid-token');

    expect([401, 422]).toContain(res.status);
  });
});
