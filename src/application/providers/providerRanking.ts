import type { ProviderConfig } from '../../domain/providers/contracts.js';

/**
 * Rank only pre-authorized providers. Quota availability and cooldown are checked
 * separately by the router in DSA-002C, not guessed here.
 */
export function rankEligibleProviders(
  providers: readonly ProviderConfig[],
): readonly ProviderConfig[] {
  const seen = new Set<string>();
  for (const provider of providers) {
    if (!provider.id.trim()) throw new Error('Provider id must not be empty');
    if (seen.has(provider.id)) throw new Error('Duplicate provider id');
    if (!Number.isSafeInteger(provider.rank) || provider.rank < 1) {
      throw new Error('Provider rank must be a positive integer');
    }
    seen.add(provider.id);
  }

  return providers
    .filter((provider) => provider.enabled && provider.zeroCostVerified && provider.internalCapConfigured)
    .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}
