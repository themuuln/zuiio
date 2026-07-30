import { capture } from "@zuiio/capture";
import type { DeliveryProvider } from "./types";
import { internalProvider } from "./internal";
import { createLopomProvider } from "./lopom";

export type { CreateDeliveryParams, CreateDeliveryResult, DeliveryProvider, ProviderStatus, VehicleType } from "./types";
export { internalProvider };

export interface ProviderConfig {
  providerType: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * Resolve a delivery provider by type and config.
 *
 * Falls back to the internal provider when the requested type is
 * unknown or an error occurs during construction.
 */
export function getProvider(config: ProviderConfig): DeliveryProvider {
  try {
    switch (config.providerType) {
      case "internal":
        return internalProvider;
      case "lopom":
        if (!config.apiKey) {
          throw new Error("Lopom API түлхүүр шаардлагатай");
        }
        return createLopomProvider(config.apiKey, config.apiSecret ?? "");
      default:
        capture(`Unknown provider type: ${config.providerType}`, {
          context: "delivery: getProvider",
        });
        return internalProvider;
    }
  } catch (err) {
    capture(err, { context: "delivery: getProvider" });
    return internalProvider;
  }
}
