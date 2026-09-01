import {
	bulkhead,
	ConsecutiveBreaker,
	circuitBreaker,
	ExponentialBackoff,
	handleWhen,
	type IPolicy,
	isTaskCancelledError,
	retry,
	TimeoutStrategy,
	timeout,
	wrap,
} from "cockatiel";

/**
 * Resilience & Quota-Safe Retry Utilities for Agent Gateway.
 *
 * HTTP 429, quota, billing, and authorization failures are never retried.
 * Transient server, network, and policy timeout failures are retried.
 */

export interface ErrorClassification {
	retryable: boolean;
	isQuotaOrAuth: boolean;
	reason: string;
}

const NON_RETRYABLE_STATUSES: Record<number, true> = {
	400: true,
	401: true,
	402: true,
	403: true,
	404: true,
	422: true,
	429: true,
};

const RETRYABLE_STATUSES: Record<number, true> = {
	500: true,
	502: true,
	503: true,
	504: true,
};

const QUOTA_AUTH_PATTERNS = [
	/quota\s*exceeded/i,
	/monthly\s*usage\s*limit/i,
	/usage\s*limit/i,
	/rate\s*limit/i,
	/region\s*opt-?in/i,
	/insufficient_quota/i,
	/payment\s*required/i,
	/account\s*deactivated/i,
	/billing/i,
	/tokens\s*per\s*min/i,
];

/**
 * Classifies an HTTP status code or error message.
 */
export function classifyError(
	status?: number | null,
	message?: string | null,
): ErrorClassification {
	const msg = message ?? "";

	for (const pattern of QUOTA_AUTH_PATTERNS) {
		if (pattern.test(msg)) {
			return {
				retryable: false,
				isQuotaOrAuth: true,
				reason: `Non-retryable quota/billing error: ${msg.slice(0, 120)}`,
			};
		}
	}

	if (status != null) {
		if (status === 429 || status === 402) {
			return {
				retryable: false,
				isQuotaOrAuth: true,
				reason: `Non-retryable quota status (${status})`,
			};
		}
		if (status === 401 || status === 403) {
			return {
				retryable: false,
				isQuotaOrAuth: true,
				reason: `Non-retryable authorization status (${status})`,
			};
		}
		if (RETRYABLE_STATUSES[status]) {
			return {
				retryable: true,
				isQuotaOrAuth: false,
				reason: `Transient server error (${status})`,
			};
		}
		if (NON_RETRYABLE_STATUSES[status]) {
			return {
				retryable: false,
				isQuotaOrAuth: false,
				reason: `Client error (${status})`,
			};
		}
	}

	if (
		/ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|UND_ERR_CONNECT_TIMEOUT|UND_ERR_SOCKET|fetch failed|timed out|timeout/i.test(
			msg,
		)
	) {
		return {
			retryable: true,
			isQuotaOrAuth: false,
			reason: `Transient network failure: ${msg.slice(0, 80)}`,
		};
	}

	return {
		retryable: false,
		isQuotaOrAuth: false,
		reason: msg ? `Unknown error: ${msg.slice(0, 80)}` : "Unknown error",
	};
}

export interface RetryOptions {
	maxRetries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
	label?: string;
	onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export interface ResilientOperationOptions extends RetryOptions {
	/**
	 * Stable key for sharing circuit-breaker and bulkhead state.
	 */
	key: string;
	timeoutMs?: number;
	concurrency?: number;
	queueCapacity?: number;
	circuitBreakerThreshold?: number;
	circuitHalfOpenAfterMs?: number;
}

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 5000;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_CONCURRENCY = 8;
const DEFAULT_QUEUE_CAPACITY = 16;
const DEFAULT_BREAKER_THRESHOLD = 5;
const DEFAULT_HALF_OPEN_AFTER_MS = 10_000;

function getErrorStatus(error: unknown): number | undefined {
	if (typeof error !== "object" || error === null) {
		return undefined;
	}

	const candidate = error as {
		status?: unknown;
		statusCode?: unknown;
	};
	const status = candidate.status ?? candidate.statusCode;
	return typeof status === "number" ? status : undefined;
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function classifyThrownError(error: unknown): ErrorClassification {
	if (isTaskCancelledError(error)) {
		return {
			retryable: true,
			isQuotaOrAuth: false,
			reason: "Transient policy timeout",
		};
	}

	return classifyError(getErrorStatus(error), getErrorMessage(error));
}

function normalizeNonNegative(
	value: number | undefined,
	fallback: number,
): number {
	return Number.isFinite(value) ? Math.max(0, value as number) : fallback;
}

function createRetryPolicy(options: RetryOptions) {
	const maxRetries = Math.floor(
		normalizeNonNegative(options.maxRetries, DEFAULT_MAX_RETRIES),
	);
	const baseDelayMs = normalizeNonNegative(
		options.baseDelayMs,
		DEFAULT_BASE_DELAY_MS,
	);
	const maxDelayMs = Math.max(
		baseDelayMs,
		normalizeNonNegative(options.maxDelayMs, DEFAULT_MAX_DELAY_MS),
	);
	const policy = retry(
		handleWhen((error) => classifyThrownError(error).retryable),
		{
			maxAttempts: maxRetries,
			backoff: new ExponentialBackoff({
				initialDelay: baseDelayMs,
				maxDelay: maxDelayMs,
			}),
		},
	);

	return { maxRetries, maxDelayMs, policy };
}

/**
 * Calculates exponential backoff with full jitter to avoid thundering herds.
 */
export function calculateBackoff(
	attempt: number,
	baseDelayMs = DEFAULT_BASE_DELAY_MS,
	maxDelayMs = DEFAULT_MAX_DELAY_MS,
): number {
	const base = normalizeNonNegative(baseDelayMs, DEFAULT_BASE_DELAY_MS);
	const max = normalizeNonNegative(maxDelayMs, DEFAULT_MAX_DELAY_MS);
	const exponential = base * 2 ** Math.max(0, attempt);
	const clamped = Math.min(exponential, max);
	return Math.floor(Math.random() * clamped);
}

/**
 * Wraps an async operation with safe, quota-aware retries.
 * Fast-fails immediately on 429, 402, 403, and usage-limit errors.
 */
export async function withSafeRetry<T>(
	operation: (attempt: number) => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const { policy } = createRetryPolicy(options);
	let attempt = 0;
	const dispose = options.onRetry
		? policy.onRetry((event) => {
				const error = "error" in event ? event.error : event.value;
				options.onRetry?.(event.attempt - 1, error, event.delay);
			})
		: undefined;

	try {
		return await policy.execute(() => operation(attempt++));
	} finally {
		dispose?.dispose();
	}
}

export class ResilientHttpError extends Error {
	readonly status: number;
	readonly body: string;

	constructor(status: number, body: string, label = "Operation") {
		const classification = classifyError(status, body);
		super(`${label} API error (${status}): ${classification.reason}`);
		this.name = "ResilientHttpError";
		this.status = status;
		this.body = body.slice(0, 1000);
	}
}

function createExternalPolicy(options: ResilientOperationOptions): IPolicy {
	const { policy: retryPolicy } = createRetryPolicy(options);
	const breakerPolicy = circuitBreaker(
		handleWhen((error) => classifyThrownError(error).retryable),
		{
			breaker: new ConsecutiveBreaker(
				Math.max(
					1,
					Math.floor(
						normalizeNonNegative(
							options.circuitBreakerThreshold,
							DEFAULT_BREAKER_THRESHOLD,
						),
					),
				),
			),
			halfOpenAfter: normalizeNonNegative(
				options.circuitHalfOpenAfterMs,
				DEFAULT_HALF_OPEN_AFTER_MS,
			),
		},
	);
	const bulkheadPolicy = bulkhead(
		Math.max(
			1,
			Math.floor(
				normalizeNonNegative(options.concurrency, DEFAULT_CONCURRENCY),
			),
		),
		Math.floor(
			normalizeNonNegative(options.queueCapacity, DEFAULT_QUEUE_CAPACITY),
		),
	);
	const timeoutPolicy = timeout(
		Math.max(
			1,
			Math.floor(normalizeNonNegative(options.timeoutMs, DEFAULT_TIMEOUT_MS)),
		),
		TimeoutStrategy.Aggressive,
	);

	return wrap(retryPolicy, breakerPolicy, bulkheadPolicy, timeoutPolicy);
}

const externalPolicies = new Map<string, IPolicy>();
const concurrencyPolicies = new Map<string, IPolicy>();

export interface ConcurrencyLimitOptions {
	key: string;
	concurrency: number;
	queueCapacity?: number;
}

function getConcurrencyPolicy(options: ConcurrencyLimitOptions): IPolicy {
	const existing = concurrencyPolicies.get(options.key);
	if (existing) {
		return existing;
	}

	const policy = bulkhead(
		Math.max(
			1,
			Math.floor(
				normalizeNonNegative(options.concurrency, DEFAULT_CONCURRENCY),
			),
		),
		Math.floor(
			normalizeNonNegative(options.queueCapacity, DEFAULT_QUEUE_CAPACITY),
		),
	);
	concurrencyPolicies.set(options.key, policy);
	return policy;
}

export async function withConcurrencyLimit<T>(
	operation: () => Promise<T>,
	options: ConcurrencyLimitOptions,
): Promise<T> {
	return getConcurrencyPolicy(options).execute(() => operation()) as Promise<T>;
}

function getExternalPolicy(options: ResilientOperationOptions): IPolicy {
	const existing = externalPolicies.get(options.key);
	if (existing) {
		return existing;
	}

	const policy = createExternalPolicy(options);
	externalPolicies.set(options.key, policy);
	return policy;
}

/**
 * Runs an external operation through retry, circuit-breaker, timeout, and
 * bounded-concurrency policies.
 */
export async function withResilientOperation<T>(
	operation: (signal: AbortSignal) => Promise<T>,
	options: ResilientOperationOptions,
): Promise<T> {
	const policy = getExternalPolicy(options);
	return policy.execute(({ signal }) => operation(signal)) as Promise<T>;
}

export interface ResilientFetchOptions extends ResilientOperationOptions {
	/**
	 * Return non-retryable HTTP responses to the caller instead of throwing.
	 */
	throwOnNonOk?: boolean;
	/**
	 * Retry non-GET requests only when the operation is idempotent.
	 * GET requests are retryable by default.
	 */
	retryable?: boolean;
}

/**
 * Fetches an HTTP resource with quota-safe retry and shared resilience state.
 * GET requests and explicitly idempotent requests retry transient failures.
 * Other non-2xx responses are returned unless throwOnNonOk is enabled.
 */
export async function withResilientFetch(
	input: RequestInfo | URL,
	init: RequestInit | undefined,
	options: ResilientFetchOptions,
): Promise<Response> {
	const method = init?.method?.toUpperCase() ?? "GET";
	const retryable = options.retryable ?? method === "GET";
	const policyOptions = retryable
		? options
		: {
				...options,
				key: `${options.key}:non-retryable`,
				maxRetries: 0,
			};

	try {
		return await withResilientOperation(async (signal) => {
			const response = await fetch(input, { ...init, signal });
			if (response.ok) {
				return response;
			}
			let body = "";
			const canClone = typeof response.clone === "function";
			if (canClone) {
				try {
					body = await response.clone().text();
				} catch {}
			}
			const classification = classifyError(response.status, body);
			if (classification.retryable || options.throwOnNonOk !== false) {
				if (!body && !canClone) {
					try {
						if (typeof response.text === "function") {
							body = await response.text();
						} else if (typeof response.json === "function") {
							body = JSON.stringify(await response.json()) ?? "";
						}
					} catch {}
				}
				throw new ResilientHttpError(response.status, body, options.label);
			}

			return response;
		}, policyOptions);
	} catch (error) {
		if (options.throwOnNonOk === false && error instanceof ResilientHttpError) {
			return new Response(error.body, { status: error.status });
		}
		throw error;
	}
}
