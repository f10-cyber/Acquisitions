import { env } from '#config/env.js';
import { checkDatabaseHealth } from '#config/database.js';
import { sendSuccess } from '#utils/format.js';
import { asyncHandler } from '#utils/asyncHandler.js';

const baseInfo = () => ({
  status: 'ok',
  environment: env.NODE_ENV,
  uptimeSeconds: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
});

export const liveness = (_req, res) => sendSuccess(res, { data: baseInfo(), message: 'Service is alive' });

export const readiness = asyncHandler(async (_req, res) => {
  try {
    const { latencyMs } = await checkDatabaseHealth();
    return sendSuccess(res, { data: { ...baseInfo(), database: 'ready', dbLatencyMs: latencyMs } });
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Service is not ready: database unreachable',
      code: 'NOT_READY',
      data: { ...baseInfo(), status: 'degraded', database: 'unreachable', error: error.message },
    });
  }
});

export const health = asyncHandler(async (_req, res) => {
  let database = 'unreachable';
  let dbLatencyMs = null;
  try {
    const result = await checkDatabaseHealth();
    database = 'ready';
    dbLatencyMs = result.latencyMs;
  } catch {
    database = 'unreachable';
  }

  const body = {
    ...baseInfo(),
    status: database === 'ready' ? 'ok' : 'degraded',
    database,
    dbLatencyMs,
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    version: process.version,
  };

  if (database === 'ready') return sendSuccess(res, { data: body, message: 'Service is healthy' });
  return res.status(503).json({ success: false, message: 'Service is degraded', code: 'DEGRADED', data: body });
});
