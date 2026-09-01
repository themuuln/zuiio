import "server-only";

export interface QpayBankUrl {
	name: string;
	link: string;
	description?: string;
	logo?: string;
}

const COMMON_BANKS: Array<{ id: string; name: string; scheme: string }> = [
	{ id: "khan", name: "Хаан банк", scheme: "khanbank://q?qPay_QRcode=" },
	{ id: "xac", name: "Хас банк", scheme: "xacbank://q?qPay_QRcode=" },
	{ id: "golomt", name: "Голомт банк", scheme: "golomtbank://q?qPay_QRcode=" },
	{ id: "state", name: "Төрийн банк", scheme: "statebank://q?qPay_QRcode=" },
	{ id: "tdb", name: "ХХБ", scheme: "tdbbank://q?qPay_QRcode=" },
	{ id: "mbank", name: "М банк", scheme: "mbank://q?qPay_QRcode=" },
	{ id: "ard", name: "Ард Апп", scheme: "ard://q?qPay_QRcode=" },
	{ id: "most", name: "Мост мони", scheme: "most://q?qPay_QRcode=" },
];

/**
 * Resolve public base URL of agent-gateway for redirect links.
 */
export function getGatewayBaseUrl(): string {
	const custom = process.env.AGENT_GATEWAY_URL?.trim();
	if (custom) return custom.replace(/\/+$/, "");
	const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
	if (prod)
		return `https://${prod.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
	const vercel = process.env.VERCEL_URL?.trim();
	if (vercel)
		return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
	return "";
}

/**
 * Resolve bank deep link for a given bank name and qrText or provided bankUrls.
 */
export function resolveBankDeeplink(
	bankKeyOrName: string,
	paymentUrls?: QpayBankUrl[] | null,
	qrText?: string | null,
): { name: string; link: string; logo?: string } | null {
	const search = bankKeyOrName.trim().toLowerCase();

	// 1. Search in returned QPay payment_urls
	if (Array.isArray(paymentUrls) && paymentUrls.length > 0) {
		const matched = paymentUrls.find(
			(b) =>
				b.name.toLowerCase().includes(search) ||
				search.includes(b.name.toLowerCase()),
		);
		if (matched) {
			return {
				name: matched.name,
				link: matched.link,
				logo: matched.logo,
			};
		}
	}

	// 2. Derive from standard Mongolian bank schemes if qrText is present
	const cleanQr = qrText?.trim() ?? "";
	const matchedCommon = COMMON_BANKS.find(
		(b) =>
			b.name.toLowerCase().includes(search) ||
			search.includes(b.name.toLowerCase()) ||
			b.id === search,
	);

	if (matchedCommon) {
		const link = cleanQr
			? `${matchedCommon.scheme}${encodeURIComponent(cleanQr)}`
			: "";
		return {
			name: matchedCommon.name,
			link,
		};
	}

	// 3. Fallback to first available url if requested "all" or not found
	if (Array.isArray(paymentUrls) && paymentUrls.length > 0 && paymentUrls[0]) {
		return {
			name: paymentUrls[0].name,
			link: paymentUrls[0].link,
			logo: paymentUrls[0].logo,
		};
	}

	return null;
}

/**
 * Build bank buttons as Quick Replies for Facebook Messenger & Instagram.
 */
export function buildQpayBankQuickReplies(
	orderId: string,
	paymentUrls?: QpayBankUrl[] | null,
	qrText?: string | null,
): Array<{ text: string; callbackData: string }> {
	const buttons: Array<{ text: string; callbackData: string }> = [];

	if (Array.isArray(paymentUrls) && paymentUrls.length > 0) {
		for (const bank of paymentUrls.slice(0, 8)) {
			const safeName = bank.name.trim();
			buttons.push({
				text: `🏦 ${safeName.slice(0, 16)}`,
				callbackData: `QPAY_BANK:${encodeURIComponent(safeName)}:${orderId}`,
			});
		}
	} else if (qrText?.trim()) {
		for (const bank of COMMON_BANKS.slice(0, 6)) {
			buttons.push({
				text: `🏦 ${bank.name}`,
				callbackData: `QPAY_BANK:${encodeURIComponent(bank.name)}:${orderId}`,
			});
		}
	}

	buttons.push({
		text: "🔗 QPay линк",
		callbackData: `QPAY_LINK:${orderId}`,
	});
	buttons.push({
		text: "📦 Захиалга шалгах",
		callbackData: "order_status",
	});

	return buttons.slice(0, 11);
}

/**
 * Format message sent when user taps a bank button.
 */
export function formatBankPaymentMessage(params: {
	bankName: string;
	deeplink?: string | null;
	paymentLink?: string | null;
}): string {
	const { bankName, deeplink, paymentLink } = params;
	const gatewayUrl = getGatewayBaseUrl();

	const lines: string[] = [`🏦 <b>${bankName}</b>-аар төлөх:\n`];

	if (deeplink) {
		if (gatewayUrl) {
			const redirectUrl = `${gatewayUrl}/api/qpay/open?link=${encodeURIComponent(deeplink)}${paymentLink ? `&qpay=${encodeURIComponent(paymentLink)}` : ""}&name=${encodeURIComponent(bankName)}`;
			lines.push(`📱 <b>Банкны апп нээх:</b>\n👉 ${redirectUrl}\n`);
		}
		lines.push(`Эсвэл шууд холбоос (хуулж нээх):\n<code>${deeplink}</code>\n`);
		lines.push(
			"<i>(Хэрэв дээрх линк шууд нээгдэхгүй бол банкны аппаа нээж QR кодыг уншуулна уу)</i>\n",
		);
	}

	if (paymentLink) {
		lines.push(`🔗 <b>QPay ерөнхий холбоос:</b>\n${paymentLink}`);
	}

	lines.push("\n💡 Төлбөр төлөгдсөний дараа захиалга автоматаар баталгаажна.");

	return lines.join("\n");
}
