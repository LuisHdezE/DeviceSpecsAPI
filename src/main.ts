import { parseEnvironment } from './infrastructure/config/environment.js';
import { buildApp } from './presentation/app.js';

const environment = parseEnvironment(process.env);
const app = await buildApp(environment);
const close = async () => { await app.close(); };
process.once('SIGTERM', () => { void close(); });
process.once('SIGINT', () => { void close(); });
try {
  await app.listen({ port: environment.PORT, host: environment.HOST });
} catch (error) {
  app.log.fatal({ err: error }, 'Unable to start');
  process.exitCode = 1;
}
