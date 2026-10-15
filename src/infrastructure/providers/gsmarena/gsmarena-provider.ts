import type { DeviceSpecificationsProvider } from '../../../domain/ports/device-specifications-provider.js';
import type { DeviceDetails, DeviceSummary } from '../../../domain/entities/device.js';

export interface RawSearchResult { id?: unknown; name?: unknown; description?: unknown }
export interface RawDevice { name?: unknown; quickSpec?: unknown; detailSpec?: unknown }
export interface GsmarenaClient {
  search: { search(query: string): Promise<unknown> };
  catalog: { getDevice(id: string): Promise<unknown> };
}

export class ProviderResponseError extends Error {
  constructor() { super('Unexpected response from device specifications provider'); this.name = 'ProviderResponseError'; }
}
const allowedId = /^[a-z0-9_]+-[0-9]+$/i;

function normalizeName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new ProviderResponseError();
  return value.trim().slice(0, 200);
}
function brandFromName(name: string): string { return name.split(/\s+/)[0] ?? name; }

export function normalizeSearch(raw: unknown): readonly DeviceSummary[] {
  if (!Array.isArray(raw)) throw new ProviderResponseError();
  return raw.slice(0, 50).flatMap((item: RawSearchResult) => {
    if (typeof item?.id !== 'string' || !allowedId.test(item.id)) return [];
    if (typeof item.name !== 'string' || !item.name.trim()) return [];
    const name = normalizeName(item.name);
    return [{ id: item.id, name, brand: brandFromName(name) }];
  });
}
export function normalizeDetails(id: string, raw: unknown): DeviceDetails {
  if (!raw || typeof raw !== 'object') throw new ProviderResponseError();
  const item = raw as RawDevice;
  const name = normalizeName(item.name);
  if (!Array.isArray(item.detailSpec)) throw new ProviderResponseError();
  const specifications: Record<string, Record<string, string>> = {};
  for (const group of item.detailSpec.slice(0, 80)) {
    if (!group || typeof group !== 'object') continue;
    const g = group as { category?: unknown; specifications?: unknown };
    if (typeof g.category !== 'string' || !Array.isArray(g.specifications)) continue;
    const fields: Record<string, string> = {};
    for (const entry of g.specifications.slice(0, 100)) {
      if (!entry || typeof entry !== 'object') continue;
      const field = entry as { name?: unknown; value?: unknown };
      if (typeof field.name === 'string' && typeof field.value === 'string')
        fields[field.name.slice(0, 100)] = field.value.slice(0, 2000);
    }
    if (Object.keys(fields).length) specifications[g.category.slice(0, 100)] = fields;
  }
  return { id, name, brand: brandFromName(name), specifications, source: 'GSMArena' };
}
export class GsmarenaProvider implements DeviceSpecificationsProvider {
  constructor(private readonly client: GsmarenaClient) {}
  async search(query: string): Promise<readonly DeviceSummary[]> {
    const cleaned = query.trim();
    if (cleaned.length < 2 || cleaned.length > 100) throw new RangeError('Search must be 2-100 characters');
    return normalizeSearch(await this.client.search.search(cleaned));
  }
  async getById(id: string): Promise<DeviceDetails | null> {
    if (!allowedId.test(id)) throw new RangeError('Invalid device identifier');
    const raw = await this.client.catalog.getDevice(id);
    return raw === null || raw === undefined ? null : normalizeDetails(id, raw);
  }
}
