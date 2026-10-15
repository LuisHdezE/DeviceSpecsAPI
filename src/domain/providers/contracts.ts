/** Provider-independent contracts. No HTTP or framework dependencies. */
export type ProviderId = string;

export interface DeviceCandidate {
  readonly externalId: string;
  readonly manufacturer: string;
  readonly model: string;
}

export interface DeviceSpecification {
  readonly externalId: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export type ProviderResult<T> =
  | { readonly kind: 'success'; readonly value: T }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'rate_limited'; readonly retryAfterSeconds?: number }
  | { readonly kind: 'quota_exhausted'; readonly resetsAt?: string }
  | { readonly kind: 'unauthorized' }
  | { readonly kind: 'unavailable'; readonly retryable: boolean };

export interface SpecsProvider {
  readonly id: ProviderId;
  search(query: string): Promise<ProviderResult<readonly DeviceCandidate[]>>;
  getDevice(externalId: string): Promise<ProviderResult<DeviceSpecification>>;
}

export type ProviderStatus =
  | 'ACTIVE'
  | 'RESERVED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXHAUSTED'
  | 'UNHEALTHY'
  | 'DISABLED';

export interface ProviderConfig {
  readonly id: ProviderId;
  readonly rank: number;
  readonly enabled: boolean;
  /** Confirmed zero-billing capability. Unknown or false means fail-closed. */
  readonly zeroCostVerified: boolean;
  /** An explicit internal cap is mandatory even when external quota is unknown. */
  readonly internalCapConfigured: boolean;
}
