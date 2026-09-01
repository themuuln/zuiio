import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const link = url.searchParams.get("link");
	const qpay = url.searchParams.get("qpay");
	const name = url.searchParams.get("name") || "Банк";

	if (!link) {
		if (qpay) {
			return NextResponse.redirect(qpay, 302);
		}
		return new Response("Missing payment link", { status: 400 });
	}

	// Clean and validate the scheme to prevent javascript: or data: injection
	const trimmedLink = link.trim();
	const isSafeScheme =
		/^[a-zA-Z0-9_-]+:\/\//.test(trimmedLink) &&
		!/^javascript:/i.test(trimmedLink) &&
		!/^data:/i.test(trimmedLink);
	if (!isSafeScheme) {
		return new Response("Invalid link scheme", { status: 400 });
	}

	const safeName = name.replace(/[<>"'&]/g, "");
	const safeLink = trimmedLink.replace(
		/[<>"'&]/g,
		(c) => `&#${c.charCodeAt(0)};`,
	);
	const safeQpay = qpay
		? qpay.trim().replace(/[<>"'&]/g, (c) => `&#${c.charCodeAt(0)};`)
		: null;

	const html = `<!DOCTYPE html>
<html lang="mn">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${safeName} нээж байна...</title>
	<meta http-equiv="refresh" content="0;url=${safeLink}">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			background: #f8fafc;
			color: #0f172a;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			padding: 24px;
			box-sizing: border-box;
			text-align: center;
		}
		.card {
			background: #ffffff;
			border-radius: 16px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
			padding: 32px 24px;
			max-width: 400px;
			width: 100%;
		}
		h1 {
			font-size: 20px;
			font-weight: 700;
			margin: 0 0 12px;
		}
		p {
			font-size: 14px;
			color: #64748b;
			margin: 0 0 24px;
			line-height: 1.5;
		}
		.btn {
			display: block;
			background: #0284c7;
			color: #ffffff;
			text-decoration: none;
			font-weight: 600;
			font-size: 16px;
			padding: 14px;
			border-radius: 10px;
			margin-bottom: 12px;
			transition: background 0.2s;
		}
		.btn:hover {
			background: #0369a1;
		}
		.btn-secondary {
			display: block;
			background: #f1f5f9;
			color: #334155;
			text-decoration: none;
			font-weight: 600;
			font-size: 14px;
			padding: 12px;
			border-radius: 10px;
		}
	</style>
	<script>
		window.onload = function() {
			window.location.href = "${safeLink}";
		};
	</script>
</head>
<body>
	<div class="card">
		<h1>🏦 ${safeName} нээж байна...</h1>
		<p>Хэрэв банкны апп автоматаар нээгдэхгүй бол доорх товч дээр дарна уу.</p>
		<a href="${safeLink}" class="btn">📱 Банкны апп нээх</a>
		${safeQpay ? `<a href="${safeQpay}" class="btn-secondary">🔗 QPay ерөнхий линкээр төлөх</a>` : ""}
	</div>
</body>
</html>`;

	return new Response(html, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store, max-age=0",
		},
	});
}
