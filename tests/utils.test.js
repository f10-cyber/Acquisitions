import { AppError } from '#utils/AppError.js';
import { sendPaginated, sendSuccess, sanitizeUser } from '#utils/format.js';
import { getPagination } from '#utils/pagination.js';
import { decodeToken, signAccessToken, verifyAccessToken } from '#utils/jwt.js';
import { comparePassword, hashPassword } from '#utils/password.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

describe('AppError', () => {
  it('builds typed HTTP errors', () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.forbidden().statusCode).toBe(403);
    expect(AppError.notFound().statusCode).toBe(404);
    expect(AppError.conflict().statusCode).toBe(409);
    expect(AppError.tooManyRequests().statusCode).toBe(429);
    expect(new AppError(418, 'teapot').isOperational).toBe(true);
  });
});

describe('format helpers', () => {
  it('sendSuccess wraps payloads in a standard envelope', () => {
    const res = mockRes();
    sendSuccess(res, { data: { id: 1 }, message: 'hi', statusCode: 201 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ success: true, message: 'hi', data: { id: 1 } });
  });

  it('sendPaginated computes pagination metadata', () => {
    const res = mockRes();
    sendPaginated(res, { data: [1, 2], page: 2, limit: 2, total: 5 });

    expect(res.body.meta).toMatchObject({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('sanitizeUser strips the password hash', () => {
    const user = sanitizeUser({ id: '1', email: 'a@b.c', passwordHash: 'secret' });

    expect(user).not.toHaveProperty('passwordHash');
    expect(user.email).toBe('a@b.c');
    expect(sanitizeUser(null)).toBeNull();
  });
});

describe('pagination helper', () => {
  it('parses and clamps page/limit', () => {
    expect(getPagination({ page: '3', limit: '7' })).toEqual({ page: 3, limit: 7, offset: 14 });
    expect(getPagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(getPagination({ page: '-2', limit: '5000' })).toEqual({ page: 1, limit: 100, offset: 0 });
  });
});

describe('jwt helpers', () => {
  it('signs and verifies access tokens', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.c', role: 'seller' });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('seller');
    expect(decodeToken(token).email).toBe('a@b.c');
  });

  it('rejects tampered tokens', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.c', role: 'user' });
    expect(() => verifyAccessToken(`${token}x`)).toThrow();
  });
});

describe('password helpers', () => {
  it('hashes and verifies passwords with bcrypt', async () => {
    const hash = await hashPassword('Password123!');

    expect(hash).not.toContain('Password123!');
    expect(await comparePassword('Password123!', hash)).toBe(true);
    expect(await comparePassword('Wrong123!', hash)).toBe(false);
  });
});
