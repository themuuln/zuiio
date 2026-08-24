/**
 * Scopes requested from the Facebook OAuth dialog.
 *
 * This flow connects Facebook Pages for Messenger. Instagram messaging uses
 * a separate Meta product and login flow; requesting Instagram permissions
 * here makes the entire Facebook dialog fail when that product is not
 * enabled for the app.
 */
const FACEBOOK_SCOPES = [
	"pages_messaging",
	"pages_show_list",
	"pages_manage_metadata",
];

const INSTAGRAM_SCOPES = ["instagram_basic", "instagram_manage_messages"];

export function getFacebookOAuthScopes(): string {
	const scopes = [...FACEBOOK_SCOPES];
	if (process.env.FB_ENABLE_INSTAGRAM === "1") {
		scopes.push(...INSTAGRAM_SCOPES);
	}
	return scopes.join(",");
}
