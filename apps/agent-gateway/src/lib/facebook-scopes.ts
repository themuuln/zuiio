const MESSENGER_SCOPES = [
	"pages_messaging",
	"pages_show_list",
	"pages_manage_metadata",
] as const;

const INSTAGRAM_SCOPES = [
	"instagram_basic",
	"instagram_manage_messages",
] as const;

export function getEnabledMetaChannels(): Array<"messenger" | "instagram"> {
	const configured = process.env.META_ENABLED_CHANNELS ?? "messenger";
	const channels: Array<"messenger" | "instagram"> = ["messenger"];
	if (
		configured
			.split(",")
			.map((value) => value.trim())
			.includes("instagram")
	) {
		channels.push("instagram");
	}
	return channels;
}

export function getFacebookOAuthScopes(): string {
	const scopes: string[] = [...MESSENGER_SCOPES];
	if (getEnabledMetaChannels().includes("instagram")) {
		scopes.push(...INSTAGRAM_SCOPES);
	}
	return scopes.join(",");
}
