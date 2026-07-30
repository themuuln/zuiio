import type {
  CreateDeliveryParams,
  CreateDeliveryResult,
  DeliveryProvider,
  ProviderStatus,
} from "./types";

/**
 * Internal staff courier provider.
 *
 * Staff handle the delivery manually — no external API call.
 * createDelivery returns a placeholder result with a local UUID.
 */
export const internalProvider: DeliveryProvider = {
  id: "internal",
  name: "Дотоод курьер",

  async createDelivery(
    _params: CreateDeliveryParams,
  ): Promise<CreateDeliveryResult> {
    return {
      externalId: crypto.randomUUID(),
      trackingUrl: "",
      estimatedFee: 0,
      estimatedMinutes: 60,
      status: "pending",
    };
  },

  async getStatus(): Promise<ProviderStatus> {
    return { status: "pending" };
  },

  async cancelDelivery(): Promise<boolean> {
    return true;
  },

  getTrackingUrl(): string {
    return "";
  },
};
