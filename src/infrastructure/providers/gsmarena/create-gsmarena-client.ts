import gsmarena from 'gsmarena-api';
import type { GsmarenaClient } from './gsmarena-provider.js';
export function createGsmarenaClient(): GsmarenaClient {
  return gsmarena as GsmarenaClient;
}
