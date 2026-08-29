import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

interface CatalogConnection {
	id: string;
	channel: string;
	is_active: boolean;
	page_id: string | null;
	metadata: Record<string, unknown> | null;
}

export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId")?.trim();
	const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
	if (!orgId)
		return NextResponse.json(
			{ error: "Organization ID шаардлагатай" },
			{ status: 400 },
		);

	const supabase = createServiceClient();
	const [
		{ data: connections, error: connectionError },
		{ data: products, error: productError },
	] = await Promise.all([
		supabase
			.from("channel_connections")
			.select("id, channel, is_active, page_id, metadata")
			.eq("organization_id", orgId)
			.in("channel", ["messenger", "instagram"]),
		supabase
			.from("products")
			.select("id, name, sku, sale_price, current_stock, image_url, deleted_at")
			.eq("organization_id", orgId)
			.is("deleted_at", null)
			.order("created_at", { ascending: false })
			.limit(10),
	]);
	if (connectionError || productError) {
		return NextResponse.json(
			{ error: "Каталогийн мэдээлэл авахад алдаа гарлаа" },
			{ status: 500 },
		);
	}

	const rows = (connections ?? []) as CatalogConnection[];
	const active = rows.filter((row) => row.is_active);
	const enabled = active.some((row) => row.metadata?.catalog_enabled === true);
	const previewProducts = (products ?? []).filter((product) => {
		if (!query) return true;
		const needle = query.toLocaleLowerCase();
		return [product.name, product.sku].some(
			(value) =>
				typeof value === "string" && value.toLocaleLowerCase().includes(needle),
		);
	});
	return NextResponse.json({
		catalogEnabled: enabled,
		connections: active.map((row) => ({
			channel: row.channel,
			pageId: row.page_id,
			catalogEnabled: row.metadata?.catalog_enabled === true,
		})),
		products: previewProducts.map((product) => ({
			id: product.id,
			name: product.name,
			sku: product.sku,
			salePrice: product.sale_price,
			currentStock: product.current_stock,
			imageUrl: product.image_url,
			inStock: product.current_stock == null || product.current_stock > 0,
		})),
		query,
	});
}
