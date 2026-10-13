import request from 'supertest';
import app from '../src/app.js';

describe('Health probes', () => {
  it('GET /healthz returns liveness status', async () => {
    const res = await request(app).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });

  it('GET /readyz returns a readiness envelope (200 ready or 503 without DB)', async () => {
    const res = await request(app).get('/readyz');

    expect([200, 503]).toContain(res.status);
    expect(['ready', 'unreachable']).toContain(res.body.data.database);
  });

  it('GET /health returns an aggregate health report', async () => {
    const res = await request(app).get('/health');

    expect([200, 503]).toContain(res.status);
    expect(['ok', 'degraded']).toContain(res.body.data.status);
    expect(res.body.data).toHaveProperty('memory');
  });

  it('GET /api/v1/health mirrors the health report', async () => {
    const res = await request(app).get('/api/v1/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body.data).toHaveProperty('database');
  });
});
