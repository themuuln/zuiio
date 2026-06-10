"use client";

/**
 * Re-exports useCurrentUserRole from the unified use-profile hook.
 * All profile data comes from a single /api/profile fetch.
 */
export { useCurrentUserRole } from "../lib/queries/use-profile";
