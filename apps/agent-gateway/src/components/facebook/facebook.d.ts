interface FacebookAuthResponse {
	accessToken: string;
	expiresIn: string;
	signedRequest: string;
	userID: string;
}

type FacebookLoginStatus = "connected" | "not_authorized" | "unknown";

interface FacebookStatusResponse {
	status: FacebookLoginStatus;
	authResponse: FacebookAuthResponse | null;
}

interface FacebookLoginOptions {
	scope?: string;
	return_scopes?: boolean;
	enable_profile_selector?: boolean;
	profile_selector_ids?: string;
	auth_type?: string;
}

interface FacebookLoginResponse {
	status: FacebookLoginStatus;
	authResponse: FacebookAuthResponse | null;
}

interface FB {
	init(params: {
		appId: string;
		cookie?: boolean;
		xfbml?: boolean;
		version: string;
		status?: boolean;
		frictionlessRequests?: boolean;
		hideFlashCallback?: boolean;
	}): void;
	getLoginStatus(
		callback: (response: FacebookStatusResponse) => void,
		force?: boolean,
	): void;
	login(
		callback: (response: FacebookLoginResponse) => void,
		options?: FacebookLoginOptions,
	): void;
	logout(callback?: (response: unknown) => void): void;
	api(
		path: string,
		method?: "get" | "post" | "delete",
		params?: Record<string, unknown>,
		callback?: (response: unknown) => void,
	): void;
	AppEvents: {
		logPageView(): void;
	};
	XFBML: {
		parse(): void;
	};
	Event: {
		subscribe(event: string, callback: (...args: unknown[]) => void): void;
	};
}

interface Window {
	fbAsyncInit?: () => void;
	FB?: FB;
}
