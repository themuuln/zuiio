import "server-only";

import type {
	ProductAdapter,
	ProductAgentManifest,
	ProductToolExecution,
	ToolContext,
} from "@zuiio/gateway-core";
import { createSignedServiceHeaders } from "@/lib/service-signature";

const MANIFEST_TTL_MS = 5 * 60 * 1_000;
const MANIFEST_VERSION = "zer-customer-v1";

interface ManifestCacheEntry {
	manifest: ProductAgentManifest;
	expiresAt: number;
}

export interface ZerProductAdapterOptions {
	baseUrl?: string;
	secret?: string;
	fetchImpl?: typeof fetch;
}

/** Calls Zer-owned signed tool routes; holds no product database client. */
export class ZerProductAdapter implements ProductAdapter {
	private readonly baseUrl: string;
	private readonly secret: string;
	private readonly fetchImpl: typeof fetch;
	private readonly manifestCache = new Map<string, ManifestCacheEntry>();

	constructor(options?: ZerProductAdapterOptions) {
		this.baseUrl = (
			options?.baseUrl ??
			process.env.ZER_INTERNAL_URL ??
			""
		).replace(/\/$/, "");
		this.secret = options?.secret ?? process.env.GATEWAY_ZER_DATA_SECRET ?? "";
		this.fetchImpl = options?.fetchImpl ?? fetch;
		if (!this.baseUrl || !this.secret) {
			throw new Error("ZER_PRODUCT_ADAPTER_NOT_CONFIGURED");
		}
	}

	private async callZer(
		pathname: string,
		payload: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		const rawBody = JSON.stringify(payload);
		const response = await this.fetchImpl(new URL(pathname, this.baseUrl), {
			method: "POST",
			headers: createSignedServiceHeaders({
				clientId: "zer",
				secret: this.secret,
				method: "POST",
				pathname,
				rawBody,
			}),
			body: rawBody,
			signal: AbortSignal.timeout(20_000),
		});
		const value: unknown = await response.json().catch(() => null);
		if (!response.ok || value === null || typeof value !== "object") {
			throw new Error(`ZER_TOOL_HTTP_${response.status}`);
		}
		return value as Record<string, unknown>;
	}

	async getManifest(context: ToolContext): Promise<ProductAgentManifest> {
		const cacheKey = `${context.externalOrganizationId}:${context.audience}`;
		const cached = this.manifestCache.get(cacheKey);
		if (cached && cached.expiresAt > Date.now()) return cached.manifest;

		const value = await this.callZer("/api/internal/agent-tools/manifest", {
			version: 1,
			organizationId: context.externalOrganizationId,
			audience: context.audience,
		});
		if (
			value.version !== MANIFEST_VERSION ||
			typeof value.systemPrompt !== "string" ||
			!Array.isArray(value.tools)
		) {
			throw new Error("ZER_MANIFEST_INVALID");
		}
		const manifest: ProductAgentManifest = {
			version: MANIFEST_VERSION,
			systemPrompt: value.systemPrompt,
			tools: value.tools as ProductAgentManifest["tools"],
		};
		this.manifestCache.set(cacheKey, {
			manifest,
			expiresAt: Date.now() + MANIFEST_TTL_MS,
		});
		if (this.manifestCache.size > 500) {
			const now = Date.now();
			for (const [key, entry] of this.manifestCache) {
				if (entry.expiresAt < now) this.manifestCache.delete(key);
			}
		}
		return manifest;
	}

	async executeTool(input: ProductToolExecution): Promise<unknown> {
		const value = await this.callZer("/api/internal/agent-tools/execute", {
			version: 1,
			organizationId: input.context.externalOrganizationId,
			audience: input.context.audience,
			externalUserId: input.context.userId,
			conversationId: input.context.conversationId,
			toolName: input.toolName,
			args: input.args,
			idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
			traceId: input.context.traceId,
		});
		if (value.ok !== true) {
			const error = value.error as
				| { code?: string; retryable?: boolean }
				| undefined;
			throw new Error(error?.code ?? "ZER_TOOL_FAILED");
		}
		return value.result;
	}
}
