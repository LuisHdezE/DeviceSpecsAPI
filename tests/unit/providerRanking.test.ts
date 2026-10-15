import { describe, expect, it } from 'vitest';
import { rankEligibleProviders } from '../../src/application/providers/providerRanking.js';
import type { ProviderConfig } from '../../src/domain/providers/contracts.js';

const provider = (id: string, rank: number, overrides: Partial<ProviderConfig> = {}): ProviderConfig => ({
  id, rank, enabled: true, zeroCostVerified: true, internalCapConfigured: true, ...overrides,
});

describe('rankEligibleProviders', () => {
  it('honors priority rather than source order', () => {
    expect(rankEligibleProviders([provider('techspecs', 3), provider('gsmarena', 1), provider('mobileapi', 2)]).map(p => p.id))
      .toEqual(['gsmarena', 'mobileapi', 'techspecs']);
  });

  it('fails closed for disabled, unverified or unbudgeted providers', () => {
    const result = rankEligibleProviders([
      provider('gsmarena', 1, { zeroCostVerified: false }),
      provider('mobileapi', 2),
      provider('techspecs', 3, { internalCapConfigured: false }),
      provider('other', 4, { enabled: false }),
    ]);
    expect(result.map(p => p.id)).toEqual(['mobileapi']);
  });

  it('resolves priority ties deterministically', () => {
    expect(rankEligibleProviders([provider('z', 1), provider('a', 1)]).map(p => p.id)).toEqual(['a', 'z']);
  });

  it('rejects duplicate provider identifiers', () => {
    expect(() => rankEligibleProviders([provider('a', 1), provider('a', 2)])).toThrow('Duplicate');
  });

  it('rejects invalid ranks and empty identifiers', () => {
    expect(() => rankEligibleProviders([provider('', 1)])).toThrow('empty');
    expect(() => rankEligibleProviders([provider('a', 0)])).toThrow('positive');
  });

  it('returns an empty list when no provider is eligible', () => {
    expect(rankEligibleProviders([provider('gsmarena', 1, { enabled: false })])).toEqual([]);
  });
});
