import Fastify, { type FastifyInstance } from 'fastify';
import type { Environment } from '../infrastructure/config/environment.js';
import { healthRoutes } from './routes/health.js';

export async function buildApp(config: Environment): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: config.LOG_LEVEL }, bodyLimit: 16384, requestTimeout: 10000 });
  app.setErrorHandler((error, _request, reply) => {
    app.log.error({ err: error }, 'Request failed');
    reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
  await app.register(healthRoutes);
  return app;
}
