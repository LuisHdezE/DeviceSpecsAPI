import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', { logLevel: 'silent' }, async () => ({ status: 'ok' as const }));
}
