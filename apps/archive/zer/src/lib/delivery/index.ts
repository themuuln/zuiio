import "server-only";

import { capture } from "@zuiio/capture";
import {
  type CreateDeliveryParams,
  type CreateDeliveryResult,
  type DeliveryProvider,
  getProvider,
  type ProviderConfig,
} from "./providers";

export type {
  CreateDeliveryParams,
  CreateDeliveryResult,
  DeliveryProvider,
  ProviderConfig,
  ProviderStatus,
} from "./providers";

export interface DeliveryServiceOptions {
  /** Override provider config (e.g. from DB). Falls back to the factory default. */
  providerConfig?: ProviderConfig;
  /** Pre-resolved provider instance (skips factory lookup). */
  provider?: DeliveryProvider;
}

/**
 * Orchestrates delivery operations across registered providers.
 *
 * Usage:
 * ```ts
 * const delivery = new DeliveryService({ providerConfig: { providerType: "lopom", apiKey } });
 * const result = await delivery.create({ pickupAddress: "...", ... });
 * ```
 */
export class DeliveryService {
  private provider: DeliveryProvider;

  constructor(options: DeliveryServiceOptions = {}) {
    if (options.provider) {
      this.provider = options.provider;
    } else {
      this.provider = getProvider(
        options.providerConfig ?? { providerType: "internal" },
      );
    }
  }

  /**
   * Create a delivery through the configured provider.
   */
  async create(params: CreateDeliveryParams): Promise<CreateDeliveryResult> {
    try {
      return await this.provider.createDelivery(params);
    } catch (err) {
      capture(err, { context: "delivery: create" });
      throw new Error("Хүргэлт үүсгэхэд алдаа гарлаа");
    }
  }

  /**
   * Get current delivery status from the provider.
   */
  async getStatus(externalId: string) {
    try {
      return await this.provider.getStatus(externalId);
    } catch (err) {
      capture(err, { context: "delivery: getStatus" });
      return { status: "pending" as const };
    }
  }

  /**
   * Cancel a delivery through the provider.
   */
  async cancel(externalId: string): Promise<boolean> {
    try {
      return await this.provider.cancelDelivery(externalId);
    } catch (err) {
      capture(err, { context: "delivery: cancel" });
      return false;
    }
  }

  /**
   * Get the customer-facing tracking URL.
   */
  getTrackingUrl(externalId: string): string {
    try {
      return this.provider.getTrackingUrl(externalId);
    } catch (err) {
      capture(err, { context: "delivery: getTrackingUrl" });
      return "";
    }
  }
}
