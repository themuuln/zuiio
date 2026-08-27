import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import { isGatewayApiKeyValid } from "@/lib/api-auth";
import { decryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";

const facebookChannel = new FacebookChannel();

export async function POST(request: Request): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as { orgId?: string; pageId?: string };
		if (!body.orgId || !body.pageId) {
			return NextResponse.json(
				{ error: "orgId and pageId are required" },
				{ status: 400 },
			);
		}

		const supabase = createServiceClient();
		const { data: connections, error: readError } = await supabase
			.from("channel_connections")
			.select("id, page_access_token, token_encrypted")
			.eq("organization_id", body.orgId)
			.eq("page_id", body.pageId)
			.in("channel", ["messenger", "instagram"])
			.eq("is_active", true);
		if (readError) throw readError;

		const messengerConnection = connections?.find(
			(connection) => connection.page_access_token,
		);
		let webhookUnsubscribed = true;
		if (messengerConnection?.page_access_token) {
			webhookUnsubscribed = await facebookChannel.unsubscribeFromWebhook(
				body.pageId,
				messengerConnection.token_encrypted
					? decryptSecret(messengerConnection.page_access_token)
					: messengerConnection.page_access_token,
			);
		}

		const { error: updateError } = await supabase
			.from("channel_connections")
			.update({
				is_active: false,
				page_access_token: null,
				token_expires_at: null,
				metadata: {},
			})
			.eq("organization_id", body.orgId)
			.eq("page_id", body.pageId)
			.in("channel", ["messenger", "instagram"])
			.eq("is_active", true);
		if (updateError) throw updateError;

		return NextResponse.json({ success: true, webhookUnsubscribed });
	} catch (error) {
		capture(error, { context: "facebook: disconnect" });
		return NextResponse.json(
			{ error: "Failed to disconnect Facebook" },
			{ status: 500 },
		);
	}
}
