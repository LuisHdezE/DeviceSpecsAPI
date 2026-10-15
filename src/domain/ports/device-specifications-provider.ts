import type { DeviceDetails, DeviceSummary } from '../entities/device.js';

export interface DeviceSpecificationsProvider {
  search(query: string): Promise<readonly DeviceSummary[]>;
  getById(id: string): Promise<DeviceDetails | null>;
}
