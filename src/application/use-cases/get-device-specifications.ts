import type { DeviceSpecificationsProvider } from '../../domain/ports/device-specifications-provider.js';
export class GetDeviceSpecifications {
  constructor(private readonly provider: DeviceSpecificationsProvider) {}
  execute(id: string) { return this.provider.getById(id); }
}
