import "server-only";

import { capture } from "@zuiio/capture";
import { validateToolArguments } from "@/lib/sanitize";
import type { GatewayTool, ToolContext } from "@/providers/types";
import { runWrite } from "@/write-engine";
import tolomWriteCatalog from "@/write-engine/catalogs/tolom-write.json";
import zerWriteCatalog from "@/write-engine/catalogs/zer-write.json";
import type {
	WriteCatalog,
	WriteOperationKind,
	WritePlan,
} from "@/write-engine/types";

/**
 * Per-product write catalog map. A product is wired to the dynamic `writeData`
 * tool only when its write catalog exists here. Products without a catalog keep
 * their legacy inline write tools unchanged (see getProductTools in
 * webhook-helpers.ts). This is intentional: the Write Engine is rolled out
 * one product at a time, and a missing catalog MUST NOT silently disable writes.
 */
const WRITE_CATALOGS: Record<string, WriteCatalog> = {
	tolom: tolomWriteCatalog as unknown as WriteCatalog,
	zer: zerWriteCatalog as unknown as WriteCatalog,
};

/**
 * Build the single dynamic `writeData` tool for a product.
 *
 * The LLM emits one `WritePlan` (dataset + operation + id/data). The tool
 * resolves the product's write catalog, then delegates to the Write Engine,
 * which validates the plan, compiles a tenant-isolated Supabase mutation, and
 * executes it. No per-product write tool code lives here — adding a new
 * writable dataset is a catalog edit, not a code change.
 *
 * Returns `null` when the product has no write catalog (caller falls back to
 * legacy inline write tools).
 */
export function createWriteDataTool(
	productType: string,
	context: ToolContext,
): GatewayTool | null {
	const catalog = WRITE_CATALOGS[productType];
	if (!catalog) return null;

	const { supabase, orgId } = context;
	const parameters: GatewayTool["parameters"] = [
		{
			name: "dataset",
			type: "string",
			description:
				"Бичих хүснэгтийн ID (жишээ: customers, vehicles, work_orders, appointments, expenses, suppliers, parts_catalog, service_catalog, sales, invoices)",
			required: true,
		},
		{
			name: "operation",
			type: "string",
			description: "Үйлдлийн төрөл: insert, update, delete",
			required: true,
		},
		{
			name: "id",
			type: "string",
			description:
				"update/delete үйлдлийн хувьд хөндлөх мөрийн ID. insert-д шаардлагагүй.",
			required: false,
		},
		{
			name: "data",
			type: "object",
			description:
				"insert/update үйлдлийн багана → утга холбоос. Зөвхөн writeCatalog-д зөвшөөрөгдсөн багануудыг оруулна. organization_id, id, created_at, deleted_at багануудыг бүү оруул — систем автоматаар тохируулна.",
			required: false,
		},
		{
			name: "softDelete",
			type: "boolean",
			description:
				"delete үйлдлийн хувьд үнэхүүн бол deleted_at цаг тэмдэглэгдэнэ (анхдагч). Хэрэггүй бол хоосон үлдээ.",
			required: false,
		},
	];

	return {
		name: "writeData",
		description:
			"Өгөгдөл бичих (үүсгэх, шинэчлэх, устгах) нэгдмэл багаж. " +
			"Зөвхөн writeCatalog-д бүртгэлт хүснэгтүүдэд зориулагдсан. " +
			"Бүх бичилт organization_id-гаар тусгаарлагдана (LLM оруулахгүй). " +
			"БАТАЛГААЖУУЛАЛТАЙ багаж — ажиллуулахын өмнө хэрэглэгчээс баталгаа авна уу.\n\n" +
			"Боломжтой хүснэгтүүд:\n" +
			Object.entries(catalog.datasets)
				.map(([id, ds]) => `- ${id}: ${ds.displayName}`)
				.join("\n"),
		parameters,
		execute: async (args) => {
			try {
				const validation = validateToolArguments(args, parameters);
				if (!validation.valid) {
					return { error: validation.error };
				}

				const rawOp = String(validation.args.operation ?? "insert");
				const operation = (
					["insert", "update", "delete"].includes(rawOp) ? rawOp : "insert"
				) as WriteOperationKind;
				const dataset = String(validation.args.dataset ?? "");
				const plan = {
					dataset,
					operation,
					id:
						validation.args.id !== undefined
							? String(validation.args.id)
							: undefined,
					data:
						typeof validation.args.data === "object" &&
						validation.args.data !== null
							? (validation.args.data as Record<string, unknown>)
							: undefined,
					softDelete:
						typeof validation.args.softDelete === "boolean"
							? validation.args.softDelete
							: undefined,
				} satisfies WritePlan;

				capture(new Error("High-risk writeData execution"), {
					context: "gateway: high-risk write",
					dataset: plan.dataset,
					operation: plan.operation,
					orgId,
				});

				const result = await runWrite(
					{ tenantId: orgId, catalog, supabase },
					plan,
				);

				return result;
			} catch (err) {
				capture(err, { context: "agent-gateway: writeData" });
				return { error: "Өгөгдөл бичихэд алдаа гарлаа" };
			}
		},
	};
}
