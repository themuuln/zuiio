import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  createMockCustomer,
  createMockVehicle,
  createMockWorkOrder,
} from "@/test/factories";

export const handlers = [
  http.get("/api/organizations/:id/customers", () => {
    return HttpResponse.json({ data: [createMockCustomer()] });
  }),

  http.get("/api/organizations/:id/customers/:customerId", () => {
    return HttpResponse.json({ data: createMockCustomer() });
  }),

  http.get("/api/organizations/:id/work-orders", () => {
    return HttpResponse.json({ data: [createMockWorkOrder()] });
  }),

  http.get("/api/organizations/:id/vehicles", () => {
    return HttpResponse.json({ data: [createMockVehicle()] });
  }),
];

export const server = setupServer(...handlers);
