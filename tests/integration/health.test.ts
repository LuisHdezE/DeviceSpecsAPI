import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/presentation/app.js';
import { parseEnvironment } from '../../src/infrastructure/config/environment.js';

describe('health route', () => {
  it('returns a minimal response', async () => {
    const app = await buildApp(parseEnvironment({ LOG_LEVEL: 'silent' }));
    try {
      const response = await app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally { await app.close(); }
  });
  it('does not expose unimplemented business routes', async () => {
    const app = await buildApp(parseEnvironment({ LOG_LEVEL: 'silent' }));
    try { expect((await app.inject('/api/v1/models')).statusCode).toBe(404); }
    finally { await app.close(); }
  });
});
