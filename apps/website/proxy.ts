import type { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

const handleI18n = createMiddleware(routing);

function detectLocale(acceptLanguage: string | null): string | null {
	if (!acceptLanguage) return null;
	const idxEn = acceptLanguage.indexOf("en");
	const idxMn = acceptLanguage.indexOf("mn");
	if (idxEn >= 0 && (idxMn < 0 || idxEn < idxMn)) return "mn";
	if (idxMn >= 0 && (idxEn < 0 || idxMn < idxEn)) return "mn";
	return null;
}

function setLocaleCookie(res: NextResponse, locale: string): void {
	res.cookies.set("NEXT_LOCALE", locale, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	});
}

export default async function proxy(request: NextRequest) {
	const response = handleI18n(request);

	if (!request.cookies.has("NEXT_LOCALE")) {
		const detected =
			detectLocale(request.headers.get("accept-language")) ?? "mn";
		setLocaleCookie(response, detected);
	}

	return response;
}

export const config = {
	matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
