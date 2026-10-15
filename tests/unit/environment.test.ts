import { describe, expect, it } from 'vitest';
import { parseEnvironment } from '../../src/infrastructure/config/environment.js';

describe('environment validation', () => {
  it('uses safe defaults', () => {
    const result = parseEnvironment({});
    expect(result.PORT).toBe(8080);
    expect(result.NODE_ENV).toBe('development');
  });
  it('rejects invalid ports', () => {
    expect(() => parseEnvironment({ PORT: '99999' })).toThrow();
  });
});
