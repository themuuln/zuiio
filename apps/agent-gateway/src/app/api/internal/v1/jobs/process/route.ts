import { NextResponse } from "next/server";
import { verifyServiceRequest } from "@/lib/service-signature";
import { createMetaOAuthRepository, signatureError } from "@/meta/http";
import type { InboundProcessorDependencies } from "@/runtime/process-inbound-event";
import { processInboundEvent } from "@/runtime/process-inbound-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** The deployment wires this dependency graph from the Gateway control client. */
export type ProcessorDependencyFactory = () => InboundProcessorDependencies;

let dependencyFactory: ProcessorDependencyFactory | undefined;
export function configureProcessorDependencies(
	factory: ProcessorDependencyFactory,
): void {
	dependencyFactory = factory;
}

export async function POST(request: Request): Promise<Response> {
	const rawBody = await request.text();
	const repository = createMetaOAuthRepository();
	const workerSecret = process.env.GATEWAY_WORKER_SHARED_SECRET;
	if (!workerSecret) {
		return NextResponse.json(
			{
				error: {
					code: "WORKER_SECRET_MISSING",
					message: "Service unavailable",
				},
			},
			{ status: 503 },
		);
	}
	const signature = await verifyServiceRequest({
		request,
		rawBody,
		secret: workerSecret,
		expectedClientId: "meta-events-worker",
		consumeNonce: (nonceInput) => repository.consumeServiceNonce(nonceInput),
	});
	let rawJson: unknown;
	try {
		rawJson = JSON.parse(rawBody);
	} catch {
		return NextResponse.json(
			{ error: { code: "INVALID_JSON", message: "Invalid request" } },
			{ status: 400 },
		);
	}
	function isProcessRequest(value: unknown): value is { eventId: string } {
		return (
			value !== null &&
			typeof value === "object" &&
			"eventId" in value &&
			typeof value.eventId === "string"
		);
	}
	if (!isProcessRequest(rawJson)) {
		return NextResponse.json(
			{ error: { code: "INVALID_EVENT_ID", message: "eventId is required" } },
			{ status: 400 },
		);
	}
	if (!dependencyFactory) {
		return NextResponse.json(
			{
				error: {
					code: "CONTROL_PLANE_UNAVAILABLE",
					message: "Service unavailable",
				},
			},
			{ status: 503 },
		);
	}
	const result = await processInboundEvent(
		rawJson.eventId,
		dependencyFactory(),
	);
	if (result === "completed") return new Response(null, { status: 204 });
	if (result === "leased") {
		return NextResponse.json(
			{ error: { code: "LEASE_HELD", message: "Retry later" } },
			{ status: 409 },
		);
	}
	if (result === "terminal") {
		return NextResponse.json(
			{
				error: { code: "TERMINAL_EVENT", message: "Event cannot be processed" },
			},
			{ status: 422 },
		);
	}
	return NextResponse.json(
		{ error: { code: "RETRYABLE_EVENT", message: "Retry later" } },
		{ status: 500 },
	);
}
