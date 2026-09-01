import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

export const externalApiServer = setupServer();

export function useExternalApiServer(): void {
	beforeAll(() => {
		externalApiServer.listen({ onUnhandledRequest: "error" });
	});
	beforeEach(() => {
		externalApiServer.resetHandlers();
	});
	afterEach(() => {
		externalApiServer.resetHandlers();
	});
	afterAll(() => {
		externalApiServer.close();
	});
}

export { HttpResponse, http };
