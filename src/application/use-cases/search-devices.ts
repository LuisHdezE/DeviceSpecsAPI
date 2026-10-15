import type { DeviceSpecificationsProvider } from '../../domain/ports/device-specifications-provider.js';

export class SearchDevices {
  constructor(private readonly provider: DeviceSpecificationsProvider) {}

  execute(query: string) {
    return this.provider.search(query);
  }
}
