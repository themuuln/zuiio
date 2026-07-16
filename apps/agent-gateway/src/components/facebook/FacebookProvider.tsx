"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

interface FacebookContextValue {
	/** Whether the FB SDK script has loaded and `FB.init()` completed */
	ready: boolean;
	/** Current login+authorization status from `FB.getLoginStatus()` */
	status: FacebookLoginStatus | null;
	/** Auth response available when `status === "connected"` */
	authResponse: FacebookAuthResponse | null;
	/**
	 * Full Page connection flow:
	 * 1. `FB.login()` popup with pages_messaging scope
	 * 2. On success, POST the short-lived user token to the server callback
	 * 3. Server exchanges for a long-lived page token, stores in org_channels
	 */
	connectPage: (options?: FacebookLoginOptions) => Promise<void>;
	/** Trigger `FB.login()` popup (raw, no server exchange) */
	login: (options?: FacebookLoginOptions) => Promise<FacebookLoginResponse>;
	/** Trigger `FB.logout()` */
	logout: () => Promise<void>;
	/** Raw FB API instance (null until ready) */
	fb: FB | null;
}

const FacebookContext = createContext<FacebookContextValue>({
	ready: false,
	status: null,
	authResponse: null,
	connectPage: async () => {},
	login: async () => ({ status: "unknown", authResponse: null }),
	logout: async () => {},
	fb: null,
});

export function useFacebook(): FacebookContextValue {
	return useContext(FacebookContext);
}

interface FacebookProviderProps {
	appId: string;
	apiVersion?: string;
	children: React.ReactNode;
}

export function FacebookProvider({
	appId,
	apiVersion = "v23.0",
	children,
}: FacebookProviderProps) {
	const [ready, setReady] = useState(false);
	const [status, setStatus] = useState<FacebookLoginStatus | null>(null);
	const [authResponse, setAuthResponse] = useState<FacebookAuthResponse | null>(
		null,
	);
	const sdkLoaded = useRef(false);

	// --- SDK loader ---
	useEffect(() => {
		if (sdkLoaded.current) return;
		sdkLoaded.current = true;

		window.fbAsyncInit = () => {
			window.FB?.init({
				appId,
				cookie: true,
				xfbml: false,
				version: apiVersion,
			});

			window.FB?.AppEvents.logPageView();

			window.FB?.getLoginStatus((response) => {
				setStatus(response.status);
				setAuthResponse(response.authResponse ?? null);
				setReady(true);
			});
		};

		if (document.getElementById("facebook-jssdk")) {
			if (window.FB) window.fbAsyncInit();
			return;
		}

		const js = document.createElement("script");
		js.id = "facebook-jssdk";
		js.src = "https://connect.facebook.net/en_US/sdk.js";
		js.async = true;
		js.defer = true;
		const fjs = document.getElementsByTagName("script")[0]!;
		fjs.parentNode!.insertBefore(js, fjs);
	}, [appId, apiVersion]);

	// --- FB.login() raw (no server exchange) ---
	const login = useCallback(
		(options?: FacebookLoginOptions): Promise<FacebookLoginResponse> =>
			new Promise((resolve) => {
				window.FB?.login((response) => {
					setStatus(response.status);
					setAuthResponse(response.authResponse ?? null);
					resolve(response);
				}, options);
			}),
		[],
	);

	// --- FB.logout() ---
	const logout = useCallback(
		(): Promise<void> =>
			new Promise((resolve) => {
				window.FB?.logout(() => {
					setStatus("unknown");
					setAuthResponse(null);
					resolve();
				});
			}),
		[],
	);

	// --- Connect Page (full flow: login → server exchange) ---
	const connectPage = useCallback(
		async (options?: FacebookLoginOptions): Promise<void> => {
			const { scope, ...rest } = options ?? {};

			const response = await new Promise<FacebookLoginResponse>((resolve) => {
				window.FB?.login(resolve, {
					scope:
						scope ??
						"pages_messaging,pages_manage_metadata,pages_show_list,pages_read_engagement",
					...rest,
				});
			});

			if (response.status !== "connected" || !response.authResponse) {
				throw new Error(
					response.status === "not_authorized"
						? "You must authorize the app to connect your Page."
						: "Facebook login was cancelled.",
				);
			}

			setStatus(response.status);
			setAuthResponse(response.authResponse);

			// Read orgId from the URL — set by Zer/Tolom when redirecting here
			const params = new URLSearchParams(window.location.search);
			const orgId = params.get("orgId");

			// Exchange short-lived user token for long-lived page token on the server
			const res = await fetch("/api/facebook/callback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					accessToken: response.authResponse.accessToken,
					userId: response.authResponse.userID,
					orgId,
				}),
			});

			if (!res.ok) {
				const err = (await res.json().catch(() => ({}))) as { error?: string };
				throw new Error(err.error ?? "Failed to exchange Facebook token.");
			}
		},
		[],
	);

	return (
		<FacebookContext.Provider
			value={{
				ready,
				status,
				authResponse,
				connectPage,
				login,
				logout,
				fb: typeof window !== "undefined" ? (window.FB ?? null) : null,
			}}
		>
			{children}
		</FacebookContext.Provider>
	);
}
