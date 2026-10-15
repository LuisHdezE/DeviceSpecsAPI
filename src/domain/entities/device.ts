export interface DeviceSummary {
  id: string;
  name: string;
  brand: string;
}

export interface DeviceDetails extends DeviceSummary {
  specifications: Readonly<Record<string, Readonly<Record<string, string>>>>;
  source: string;
}
