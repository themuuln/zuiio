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
	 * Full Page connection flow is SERVER-side: the product app mints a
	 * compact link token, asks the gateway for a verified OAuth dialog URL
	 * (/api/facebook/start), and the browser navigates there. The dialog
	 * cookie lives on the gateway origin, so a client-side SDK popup cannot
	 * participate. See zer's settings > facebook-actions.ts.
	 */
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
		fjs.parentNode?.insertBefore(js, fjs);
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

	return (
		<FacebookContext.Provider
			value={{
				ready,
				status,
				authResponse,
				login,
				logout,
				fb: typeof window !== "undefined" ? (window.FB ?? null) : null,
			}}
		>
			{children}
		</FacebookContext.Provider>
	);
}
