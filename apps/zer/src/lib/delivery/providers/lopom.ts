import { createHmac } from "node:crypto";
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
  /**
   * Lalamove uses HMAC-SHA256 signature for auth.
   * Signature = HMAC-SHA256(apiSecret, timestamp + "\n" + method + "\n" + path + "\n" + body + "\n")
   */
  function signRequest(
    method: string,
    path: string,
    body: string,
    timestamp: string,
  ): string {
    const raw = `${timestamp}\n${method}\n${path}\n${body}\n`;
    return createHmac("sha256", apiSecret).update(raw).digest("hex");
  }

  async function apiFetch<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : "";
    const signature = signRequest(method, path, bodyStr, timestamp);
    const auth = `hmac ${apiKey}:${timestamp}:${signature}`;

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      capture(errorBody, { context: `lopom: ${method} ${path}` });
      throw new Error(`${method} ${path} failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    id: "lopom",
    name: "Lopom",

    async createDelivery(
      params: CreateDeliveryParams,
    ): Promise<CreateDeliveryResult> {
      try {
        // 1. Get quotation
        const quotation = await apiFetch<{
          quotationId: string;
          price: { amount: number };
          duration: { value: number };
          stops: unknown[];
        }>("POST", "/v3/quotations", {
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
        });

        // 2. Create order
        const order = await apiFetch<{ orderId: string }>(
          "POST",
          "/v3/orders",
          {
            quotationId: quotation.quotationId,
            stops: quotation.stops,
          },
        );

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

    async getStatus(externalId: string): Promise<ProviderStatus> {
      try {
        const data = await apiFetch<{
          status: string;
          driver?: { name?: string; phone?: string };
          eta?: { value?: number };
        }>("GET", `/v3/orders/${externalId}/tracking`);

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
        await apiFetch("DELETE", `/v3/orders/${externalId}`);
        return true;
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
