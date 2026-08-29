import "server-only";

import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import { decryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";

interface MenuButton {
	type: "web_url" | "postback";
	title: string;
	url?: string;
	payload?: string;
}

interface IceBreaker {
	question: string;
	payload: string;
}

function validate(menu: unknown, iceBreakers: unknown): string | null {
	if (!Array.isArray(menu) || menu.length > 5)
		return "Цэсний товч 5-аас их байж болохгүй";
	if (!Array.isArray(iceBreakers) || iceBreakers.length > 4)
		return "Ice Breaker асуулт 4-өөс их байж болохгүй";
	for (const item of menu) {
		if (
			!item ||
			(item.type !== "web_url" && item.type !== "postback") ||
			!item.title
		)
			return "Цэсний товчийн мэдээлэл буруу байна";
		if (item.type === "web_url" && !item.url) return "Вэб холбоос шаардлагатай";
		if (item.type === "postback" && !item.payload)
			return "Postback payload шаардлагатай";
	}
	for (const item of iceBreakers) {
		if (!item?.question || !item?.payload)
			return "Ice Breaker-ийн асуулт, payload шаардлагатай";
	}
	return null;
}

async function connection(orgId: string) {
	return createServiceClient()
		.from("channel_connections")
		.select("id, page_id, page_access_token, token_encrypted, metadata")
		.eq("organization_id", orgId)
		.eq("channel", "messenger")
		.eq("is_active", true)
		.limit(1)
		.maybeSingle();
}

export async function GET(request: Request) {
	const orgId = new URL(request.url).searchParams.get("orgId")?.trim();
	if (!orgId)
		return NextResponse.json(
			{ error: "Organization ID шаардлагатай" },
			{ status: 400 },
		);
	const { data, error } = await connection(orgId);
	if (error || !data)
		return NextResponse.json(
			{ error: "Messenger холболт олдсонгүй" },
			{ status: 404 },
		);
	const metadata = (data.metadata as Record<string, unknown> | null) ?? {};
	return NextResponse.json({
		menu: metadata.persistent_menu ?? [],
		iceBreakers: metadata.ice_breakers ?? [],
	});
}

export async function PUT(request: Request) {
	try {
		const body = (await request.json()) as {
			orgId?: string;
			menu?: MenuButton[];
			iceBreakers?: IceBreaker[];
		};
		const orgId = body.orgId?.trim();
		if (!orgId)
			return NextResponse.json(
				{ error: "Organization ID шаардлагатай" },
				{ status: 400 },
			);
		const menu = body.menu ?? [];
		const iceBreakers = body.iceBreakers ?? [];
		const invalid = validate(menu, iceBreakers);
		if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
		const { data, error } = await connection(orgId);
		if (error || !data?.page_access_token || !data.page_id)
			return NextResponse.json(
				{ error: "Messenger холболт олдсонгүй" },
				{ status: 404 },
			);
		const token = data.token_encrypted
			? decryptSecret(data.page_access_token)
			: data.page_access_token;
		const ok = await new FacebookChannel({
			pageId: data.page_id,
			pageAccessToken: token,
		}).setMessengerProfile({
			persistent_menu: [
				{
					locale: "default",
					composer_input_disabled: false,
					call_to_actions: menu,
				},
			],
			ice_breakers: iceBreakers,
		});
		if (!ok)
			return NextResponse.json(
				{ error: "Meta Messenger тохиргоог хадгалж чадсангүй" },
				{ status: 502 },
			);
		const metadata = {
			...((data.metadata as Record<string, unknown> | null) ?? {}),
			persistent_menu: menu,
			ice_breakers: iceBreakers,
		};
		const { error: updateError } = await createServiceClient()
			.from("channel_connections")
			.update({ metadata })
			.eq("id", data.id)
			.eq("organization_id", orgId);
		if (updateError)
			return NextResponse.json(
				{ error: "Тохиргоог хадгалж чадсангүй" },
				{ status: 500 },
			);
		return NextResponse.json({ menu, iceBreakers });
	} catch {
		return NextResponse.json({ error: "Хүсэлт буруу байна" }, { status: 400 });
	}
}
