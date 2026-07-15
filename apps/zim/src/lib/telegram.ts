import "server-only";

/**
 * Env-driven Telegram admin alerts. All fire-and-forget: a Telegram
 * outage must never break checkout or provisioning.
 */

async function send(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("telegram: failed to send alert", error);
  }
}

export async function notifyNewSale(params: {
  orderCode: string;
  packageName: string;
  retailMnt: number;
  marginMnt: number;
}): Promise<void> {
  await send(
    [
      "🛒 *New sale*",
      `Order: \`${params.orderCode}\``,
      `Package: ${params.packageName}`,
      `Retail: ₮${params.retailMnt.toLocaleString()}`,
      `Margin: ₮${params.marginMnt.toLocaleString()}`,
    ].join("\n"),
  );
}

export async function notifyProvisioningFailed(params: {
  orderCode: string;
  attempts: number;
  maxAttempts: number;
  error: string;
  permanent: boolean;
}): Promise<void> {
  await send(
    [
      params.permanent
        ? "🚨 *Provisioning FAILED permanently — refund needed*"
        : "⚠️ *Provisioning failed, will retry*",
      `Order: \`${params.orderCode}\``,
      `Attempt: ${params.attempts}/${params.maxAttempts}`,
      `Error: ${params.error}`,
    ].join("\n"),
  );
}

export async function notifyRepricingNeeded(
  providerPackageIds: string[],
): Promise<void> {
  await send(
    [
      "💱 *Provider cost changed — repricing needed*",
      ...providerPackageIds.slice(0, 20).map((id) => `• \`${id}\``),
      providerPackageIds.length > 20
        ? `…and ${providerPackageIds.length - 20} more`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
