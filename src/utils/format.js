export function sendSuccess(res, { data = null, message = 'OK', meta = undefined, statusCode = 200 } = {}) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendPaginated(res, { data, page, limit, total, message = 'OK', statusCode = 200 }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return sendSuccess(res, {
    data,
    message,
    statusCode,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export function sanitizeUser(user) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.passwordHash;
  return safe;
}
