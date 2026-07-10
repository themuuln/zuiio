type EqCapable<T = unknown> = {
  eq(column: string, value: T): unknown;
};

export function withOrgScope<T extends EqCapable>(query: T, orgId: string): T {
  return query.eq("organization_id", orgId) as T;
}
