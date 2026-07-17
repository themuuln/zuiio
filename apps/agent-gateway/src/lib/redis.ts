import "server-only";

import { Redis } from "@upstash/redis";
import { redisConfig } from "@/lib/env";

/** Lazy singleton — only connects when env vars are set. */
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
	if (_redis) return _redis;
	const config = redisConfig();
	if (!config) return null;
	_redis = new Redis({ url: config.url, token: config.token });
	return _redis;
}
