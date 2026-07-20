import type {
	ColumnMeta,
	Derivation,
	DerivedResult,
	QueryResult,
} from "./types";

/**
 * Applies a derivation across multiple query results.
 *
 * - sum:     sums a numeric field across all query results
 * - compare: percentage difference between first and second query
 * - concat:  concatenates all rows into one result set
 * - merge:   merges rows by index
 * - none:    no derivation
 */
export function applyDerivation(
	results: QueryResult[],
	derivation?: Derivation,
): DerivedResult | undefined {
	if (!derivation || derivation.type === "none" || results.length === 0) {
		return undefined;
	}

	const targetField = derivation.targetField ?? "value";

	switch (derivation.type) {
		case "sum": {
			const total = results.reduce((acc, r) => {
				const val = extractNumeric(r, targetField);
				return acc + val;
			}, 0);
			return {
				type: "sum",
				rows: [{ [targetField]: total }],
				columns: [
					{ name: targetField, displayName: targetField, type: "number" },
				],
				description: derivation.description ?? `Нийт: ${total}`,
			};
		}

		case "compare": {
			if (results.length < 2) return undefined;
			const a = extractNumeric(results[0], targetField);
			const b = extractNumeric(results[1], targetField);
			const pct = b === 0 ? 0 : ((a - b) / b) * 100;
			return {
				type: "compare",
				rows: [{ from: b, to: a, changePct: pct }],
				columns: [
					{ name: "from", displayName: "өмнөх", type: "number" },
					{ name: "to", displayName: "одоо", type: "number" },
					{ name: "changePct", displayName: "өөрчлөлт %", type: "number" },
				],
				description: derivation.description ?? `Өөрчлөлт: ${pct.toFixed(1)}%`,
			};
		}

		case "concat": {
			const allRows = results.flatMap((r) => r.rows);
			return {
				type: "concat",
				rows: allRows,
				columns:
					allRows.length > 0
						? Object.keys(allRows[0]).map(
								(k): ColumnMeta => ({
									name: k,
									displayName: k,
									type: inferType(allRows[0][k]),
								}),
							)
						: [],
				description: derivation.description ?? `Нийт ${allRows.length} мөр`,
			};
		}

		case "merge": {
			const merged: Record<string, unknown>[] = [];
			const maxLen = Math.max(...results.map((r) => r.rows.length));
			for (let i = 0; i < maxLen; i++) {
				const row: Record<string, unknown> = {};
				for (const r of results) {
					if (r.rows[i]) Object.assign(row, r.rows[i]);
				}
				merged.push(row);
			}
			return {
				type: "merge",
				rows: merged,
				columns:
					merged.length > 0
						? Object.keys(merged[0]).map(
								(k): ColumnMeta => ({
									name: k,
									displayName: k,
									type: inferType(merged[0][k]),
								}),
							)
						: [],
				description: derivation.description ?? `Нэгтгэсэн ${merged.length} мөр`,
			};
		}

		default:
			return undefined;
	}
}

function extractNumeric(result: QueryResult, field: string): number {
	const firstRow = result.rows[0];
	if (!firstRow) return 0;
	const raw =
		firstRow[field] ??
		firstRow.value ??
		firstRow[result.columns[0]?.name ?? ""];
	const num = Number(raw);
	return Number.isNaN(num) ? 0 : num;
}

function inferType(v: unknown): ColumnMeta["type"] {
	if (typeof v === "number") return "number";
	if (typeof v === "boolean") return "boolean";
	if (v instanceof Date) return "timestamp";
	return "string";
}
