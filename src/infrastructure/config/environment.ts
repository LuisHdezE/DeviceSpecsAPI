import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info'),
});

export type Environment = z.infer<typeof environmentSchema>;
export function parseEnvironment(values: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(values);
}
