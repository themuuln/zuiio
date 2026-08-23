import { NextResponse } from "next/server";
import {
	createMetaOAuthRepository,
	metaApiError,
	parseRecord,
	repositoryError,
	signatureError,
	verifyZerControlRequest,
} from "@/meta/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
	const rawBody = await request.text();
	const repository = createMetaOAuthRepository();
	try {
		const signature = await verifyZerControlRequest({
			request,
			rawBody,
			repository,
		});
		if (!signature.ok) return signatureError(signature);
		const body = parseRecord(rawBody);
		if (
			body?.version !== 1 ||
			typeof body.organizationId !== "string" ||
			typeof body.userId !== "string"
		) {
			return metaApiError("INVALID_REQUEST", "Request body is invalid", 400);
		}
		const tenantId = await repository.findTenantId(body.organizationId);
		if (!tenantId) return NextResponse.json({ installations: [] });
		return NextResponse.json({
			installations: await repository.listInstallations(tenantId),
		});
	} catch (error) {
		return repositoryError(error);
	}
}
