import { describe, expect, it, vi } from 'vitest';
import { SearchDevices } from '../../src/application/use-cases/search-devices.js';
import type { DeviceSpecificationsProvider } from '../../src/domain/ports/device-specifications-provider.js';

describe('SearchDevices', () => {
  it('delegates to provider port', async () => {
    const search = vi.fn().mockResolvedValue([{ id: 'a', name: 'Example', brand: 'Example' }]);
    const provider: DeviceSpecificationsProvider = { search, getById: vi.fn() };
    expect(await new SearchDevices(provider).execute('Example')).toHaveLength(1);
    expect(search).toHaveBeenCalledWith('Example');
  });
});
