import "server-only";
import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { QrCodeInline } from "./qr-code-inline";
const GATEWAY_URL = process.env.AGENT_GATEWAY_URL ?? "http://localhost:3999";
async function fetchLinkToken(orgId, userId, productType) {
    try {
        const res = await fetch(`${GATEWAY_URL}/api/link/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId, userId, productType }),
        });
        if (!res.ok)
            return null;
        const { token } = await res.json();
        return token ?? null;
    }
    catch {
        return null;
    }
}
export async function TelegramLink({ organizationId, userId, supabase, }) {
    const { data: links } = await supabase
        .from("telegram_agent_links")
        .select("telegram_username, linked_at")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .order("linked_at", { ascending: false })
        .limit(1);
    const linkedAccount = links?.[0] ?? null;
    const linkToken = linkedAccount
        ? null
        : await fetchLinkToken(organizationId, userId, "zer");
    // tg:// native scheme for more reliable mobile deep linking
    const deeplinkUrl = linkToken
        ? `tg://resolve?domain=zuiio_bot&start=${encodeURIComponent(linkToken)}`
        : null;
    const startCommand = linkToken ? `/start ${linkToken}` : null;
    // Build the content based on state
    let content;
    if (linkedAccount) {
        content = (React.createElement("div", { className: "space-y-3" },
            React.createElement("div", { className: "flex items-center gap-2 text-sm" },
                React.createElement("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" }, "\u2705 \u0425\u043E\u043B\u0431\u043E\u0433\u0434\u0441\u043E\u043D"),
                linkedAccount.telegram_username && (React.createElement("span", { className: "text-muted-foreground" },
                    "@",
                    linkedAccount.telegram_username))),
            React.createElement("p", { className: "text-xs text-muted-foreground" },
                "\u0422\u0430 @zuiio_bot \u0431\u043E\u0442 \u0440\u0443\u0443 \u043C\u0435\u0441\u0441\u0435\u0436 \u0431\u0438\u0447\u0438\u0436 \u04E9\u0433\u04E9\u0433\u0434\u043B\u04E9\u04E9 \u0445\u0430\u0440\u0430\u0445 \u0431\u043E\u043B\u043E\u043C\u0436\u0442\u043E\u0439.",
                React.createElement("br", null),
                "\u0425\u043E\u043B\u0431\u043E\u0433\u0434\u0441\u043E\u043D:",
                " ",
                new Date(linkedAccount.linked_at).toLocaleDateString()),
            React.createElement(Button, { variant: "outline", size: "sm", asChild: true },
                React.createElement("a", { href: "https://t.me/zuiio_bot", target: "_blank", rel: "noopener noreferrer" }, "@zuiio_bot \u043D\u044D\u044D\u0445"))));
    }
    else if (deeplinkUrl && startCommand) {
        content = (React.createElement("div", { className: "space-y-4" },
            React.createElement(QrCodeInline, { value: deeplinkUrl, startCommand: startCommand, size: 200 }),
            React.createElement(Button, { variant: "outline", size: "sm", asChild: true },
                React.createElement("a", { href: "https://t.me/zuiio_bot", target: "_blank", rel: "noopener noreferrer" },
                    React.createElement(TelegramLogo, { className: "size-4", weight: "fill" }),
                    "@zuiio_bot \u043D\u044D\u044D\u0445"))));
    }
    else {
        content = (React.createElement("div", { className: "space-y-3" },
            React.createElement("p", { className: "text-sm text-muted-foreground" }, "QR \u043A\u043E\u0434 \u04AF\u04AF\u0441\u0433\u044D\u0445 \u0431\u043E\u043B\u043E\u043C\u0436\u0433\u04AF\u0439 \u0431\u0430\u0439\u043D\u0430. \u0425\u0443\u0443\u0434\u0441\u044B\u0433 \u0434\u0430\u0445\u0438\u043D \u0430\u0447\u0430\u0430\u043B\u043B\u0430\u0430\u0434 \u043E\u0440\u043E\u043B\u0434\u043E\u043D\u043E \u0443\u0443."),
            React.createElement(Button, { variant: "outline", size: "sm", asChild: true },
                React.createElement("a", { href: "https://t.me/zuiio_bot", target: "_blank", rel: "noopener noreferrer" },
                    React.createElement(TelegramLogo, { className: "size-4", weight: "fill" }),
                    "@zuiio_bot \u043D\u044D\u044D\u0445"))));
    }
    return (React.createElement(Card, null,
        React.createElement(CardHeader, null,
            React.createElement(CardTitle, { className: "flex items-center gap-2 text-[#0088cc]" },
                React.createElement(TelegramLogo, { className: "size-5", weight: "fill" }),
                "Telegram \u0445\u043E\u043B\u0431\u043E\u043B\u0442"),
            React.createElement(CardDescription, null, "Telegram \u0431\u043E\u0442\u0442\u043E\u0439 \u0445\u043E\u043B\u0431\u043E\u0433\u0434\u043E\u043D \u04E9\u0433\u04E9\u0433\u0434\u043B\u04E9\u04E9 \u043D\u0430\u0442\u0443\u0440\u0430\u043B \u0445\u044D\u043B\u044D\u044D\u0440 \u0430\u0441\u0443\u0443\u0445")),
        React.createElement(CardContent, null, content)));
}
