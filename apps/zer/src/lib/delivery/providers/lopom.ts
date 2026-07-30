import { capture } from "@zuiio/capture";
import type {
  CreateDeliveryParams,
  CreateDeliveryResult,
  DeliveryProvider,
  ProviderStatus,
} from "./types";

const BASE_URL = "https://rest.lalamove.com";

const LALAMOVE_STATUS_MAP: Record<string, CreateDeliveryResult["status"]> = {
  NEW: "pending",
  ASSIGNING_DRIVER: "pending",
  ON_GOING: "in_transit",
  PICKED_UP: "picked_up",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  FAILED: "failed",
};

/**
 * Lopom (Lalamove Mongolia) delivery provider.
 *
 * Communicates with the Lalamove REST API for quotations, order creation,
 * and tracking. Requires an API key and secret.
 */
export function createLopomProvider(
  apiKey: string,
  apiSecret: string,
): DeliveryProvider {
  const authHeader = `Bearer ${apiKey}`;

  return {
    id: "lopom",
    name: "Lopom",

    async createDelivery(
      params: CreateDeliveryParams,
    ): Promise<CreateDeliveryResult> {
      try {
        // 1. Get quotation
        const quotationResponse = await fetch(
          `${BASE_URL}/v3/quotations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              serviceType: params.vehicleType ?? "MOTORCYCLE",
              stops: [
                {
                  address: params.pickupAddress,
                  contact: {
                    name: params.pickupContact,
                    phone: params.pickupPhone,
                  },
                },
                {
                  address: params.dropoffAddress,
                  contact: {
                    name: params.dropoffContact,
                    phone: params.dropoffPhone,
                  },
                },
              ],
            }),
          },
        );

        if (!quotationResponse.ok) {
          const errorBody = await quotationResponse.text();
          capture(errorBody, { context: "lopom: quotation error" });
          throw new Error("Үнийн санал авахад алдаа гарлаа");
        }

        const quotation = await quotationResponse.json();

        // 2. Create order
        const orderResponse = await fetch(`${BASE_URL}/v3/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            quotationId: quotation.quotationId,
            stops: quotation.stops,
          }),
        });

        if (!orderResponse.ok) {
          const errorBody = await orderResponse.text();
          capture(errorBody, { context: "lopom: order error" });
          throw new Error("Захиалга үүсгэхэд алдаа гарлаа");
        }

        const order = await orderResponse.json();

        return {
          externalId: order.orderId,
          trackingUrl: `https://lopom.mn/track/${order.orderId}`,
          estimatedFee: (quotation.price?.amount ?? 0) / 100,
          estimatedMinutes: quotation.duration?.value ?? 30,
          status: "pending",
        };
      } catch (err) {
        capture(err, { context: "lopom: createDelivery" });
        throw err;
      }
    },

    async getStatus(
      externalId: string,
    ): Promise<ProviderStatus> {
      try {
        const response = await fetch(
          `${BASE_URL}/v3/orders/${externalId}/tracking`,
          {
            headers: { Authorization: authHeader },
          },
        );

        if (!response.ok) {
          capture(`Status fetch failed: ${response.status}`, {
            context: "lopom: getStatus",
          });
          return { status: "pending" };
        }

        const data = await response.json();

        return {
          status: LALAMOVE_STATUS_MAP[data.status] ?? "pending",
          driverName: data.driver?.name,
          driverPhone: data.driver?.phone,
          estimatedMinutes: data.eta?.value,
          rawData: data as Record<string, unknown>,
        };
      } catch (err) {
        capture(err, { context: "lopom: getStatus" });
        return { status: "pending" };
      }
    },

    async cancelDelivery(externalId: string): Promise<boolean> {
      try {
        const response = await fetch(
          `${BASE_URL}/v3/orders/${externalId}`,
          {
            method: "DELETE",
            headers: { Authorization: authHeader },
          },
        );
        return response.ok;
      } catch (err) {
        capture(err, { context: "lopom: cancelDelivery" });
        return false;
      }
    },

    getTrackingUrl(externalId: string): string {
      return `https://lopom.mn/track/${externalId}`;
    },
  };
}
