export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface CreateDeliveryParams {
  pickupAddress: string;
  pickupContact: string;
  pickupPhone: string;
  dropoffAddress: string;
  dropoffContact: string;
  dropoffPhone: string;
  notes?: string;
  vehicleType?: VehicleType;
}

export interface CreateDeliveryResult {
  externalId: string;
  trackingUrl: string;
  estimatedFee: number;
  estimatedMinutes: number;
  status:
    | "pending"
    | "accepted"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "failed";
}

export interface ProviderStatus {
  status: CreateDeliveryResult["status"];
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  estimatedMinutes?: number;
  rawData?: Record<string, unknown>;
}

export interface DeliveryProvider {
  id: string;
  name: string;
  createDelivery(params: CreateDeliveryParams): Promise<CreateDeliveryResult>;
  getStatus(externalId: string): Promise<ProviderStatus>;
  cancelDelivery(externalId: string): Promise<boolean>;
  getTrackingUrl(externalId: string): string;
}
