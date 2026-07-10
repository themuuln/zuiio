/**
 * Barrel re-export — keeps all existing import paths working.
 * Domain types live in ./core, ./composite, ./service-params, ./dashboard, ./expense, ./inventory.
 */

export type { Database, Json, TablesInsert } from "@/lib/database.types";
export * from "./cash-register";
export * from "./composite";
export * from "./core";
export * from "./dashboard";
export * from "./expense";
export * from "./inventory";
export * from "./refund";
export * from "./service-params";
