/**
 * Scopes requested from the Facebook OAuth dialog.
 *
 * This flow connects Facebook Pages for Messenger AND the Page comment
 * auto-reply agent. Instagram messaging uses a separate Meta product and
 * login flow; requesting Instagram permissions here makes the entire
 * Facebook dialog fail when that product is not enabled for the app.
 *
 * Permission → capability:
 * - pages_messaging        — DMs, private replies to comments
 * - pages_show_list        — list the user's Pages at page-select
 * - pages_manage_metadata  — subscribe the Page to webhook fields
 * - pages_manage_engagement— publish comment replies as the Page
 * - pages_read_engagement  — read Page content/comments metadata
 * - pages_read_user_content— read commenter content on Page posts
 */
const FACEBOOK_SCOPES = [
	"pages_messaging",
	"pages_show_list",
	"pages_manage_metadata",
	"pages_manage_engagement",
	"pages_read_engagement",
	"pages_read_user_content",
];

export function getFacebookOAuthScopes(): string {
	return FACEBOOK_SCOPES.join(",");
}
