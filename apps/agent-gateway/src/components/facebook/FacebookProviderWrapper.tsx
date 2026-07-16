"use client";

import { FacebookProvider } from "./FacebookProvider";

export function FacebookProviderWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
	if (!appId) return <>{children}</>;

	return <FacebookProvider appId={appId}>{children}</FacebookProvider>;
}
