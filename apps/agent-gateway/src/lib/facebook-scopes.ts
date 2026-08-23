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

export function getFacebookOAuthScopes(): string {
	return FACEBOOK_SCOPES.join(",");
}
