/**
 * SMS Payment Parser
 * Parses Mongolian bank SMS notifications into structured payment data.
 * Uses GPT-4o-mini for Cyrillic text parsing (~$0.00005/call).
 */

import { withResilientFetch } from "@/lib/resilience";
import type { ServiceClient } from "./supabase";

interface ParsedPayment {
	bank: string;
	amount: number;
	sender_name: string | null;
	sender_account: string | null;
	reference: string | null;
	transaction_type: "incoming" | "outgoing";
	raw_message: string;
}

/**
 * Parse a bank SMS using regex templates first, then LLM fallback.
 */
export async function parseSms(
	message: string,
	sender: string,
	supabase: ServiceClient,
): Promise<ParsedPayment> {
	// Try regex templates first (free, instant)
	const regexResult = tryRegexParsing(message, sender);
	if (regexResult) return regexResult;

	// Fallback to LLM parsing
	return llmParsing(message, sender, supabase);
}

/**
 * Try to parse using stored regex templates.
 */
function tryRegexParsing(
	message: string,
	sender: string,
): ParsedPayment | null {
	// Common Mongolian bank SMS patterns
	const patterns = [
		{
			bank: "khanbank",
			senders: ["khanbank", "khan bank", "хаан банк", "хаанбанк"],
			amount: /(\d[\d,.]+)\s*₮/,
			sender_name: /илгээгч:\s*([^\s.]+)/i,
			reference: /утга:\s*([^\s.]+)/i,
		},
		{
			bank: "golomt",
			senders: ["golomt", "голомт"],
			amount: /(\d[\d,.]+)\s*₮/,
			sender_name: /илгээгч:\s*([^\s.]+)/i,
			reference: /утга:\s*([^\s.]+)/i,
		},
		{
			bank: "tdb",
			senders: ["tdb", "тдб", "тdb"],
			amount: /(\d[\d,.]+)\s*₮/,
			sender_name: /илгээгч:\s*([^\s.]+)/i,
			reference: /утга:\s*([^\s.]+)/i,
		},
	];

	const senderLower = sender.toLowerCase();
	const messageLower = message.toLowerCase();

	for (const pattern of patterns) {
		const isSenderMatch = pattern.senders.some((s) => senderLower.includes(s));
		const isContentMatch = pattern.senders.some((s) =>
			messageLower.includes(s),
		);

		if (!isSenderMatch && !isContentMatch) continue;

		const amountMatch = message.match(pattern.amount);
		const senderNameMatch = message.match(pattern.sender_name);
		const referenceMatch = message.match(pattern.reference);

		if (amountMatch) {
			const amountStr = amountMatch[1].replace(/,/g, "");
			const amount = Number.parseFloat(amountStr);

			if (!Number.isNaN(amount) && amount > 0) {
				return {
					bank: pattern.bank,
					amount,
					sender_name: senderNameMatch?.[1] ?? null,
					sender_account: null,
					reference: referenceMatch?.[1] ?? null,
					transaction_type: "incoming",
					raw_message: message,
				};
			}
		}
	}

	return null;
}

/**
 * Parse using LLM API (GPT-4o-mini).
 * Falls back to DeepSeek if OpenAI not configured.
 */
async function llmParsing(
	message: string,
	sender: string,
	_supabase: ServiceClient,
): Promise<ParsedPayment> {
	const apiKey = process.env.OPENAI_API_KEY;
	const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
	const model = process.env.SMS_PARSE_MODEL ?? "gpt-4o-mini";

	if (!apiKey) {
		throw new Error(
			"OPENAI_API_KEY required for SMS parsing. Set SMS_PARSE_MODEL for custom model.",
		);
	}

	const prompt = `You are a Mongolian bank SMS parser. Extract payment information from this SMS message.

SMS sender: ${sender}
SMS message: ${message}

Return a JSON object with these fields:
{
  "bank": "khanbank|golomt|tdb|xacbank|other",
  "amount": number (payment amount in MNT, no currency symbol),
  "sender_name": "who sent the money" or null,
  "sender_account": "account number" or null,
  "reference": "payment reference/memo" or null,
  "transaction_type": "incoming|outcoming"
}

Rules:
- Amount must be a number (no commas, no currency symbol)
- If the SMS is not a payment notification, return {"error": "not_a_payment"}
- Mongolian names use Cyrillic (e.g., БАТ-ЭРДЭНЭ)
- "орлого" = incoming, "гарлага" = outgoing
- Parse amounts like "100,000₮" or "100000" or "100.000"

Return ONLY the JSON object, no other text.`;

	const response = await withResilientFetch(
		`${baseUrl}/chat/completions`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [{ role: "user", content: prompt }],
				temperature: 0,
				max_tokens: 200,
				response_format: { type: "json_object" },
			}),
		},
		{
			key: `llm:${baseUrl}:${model}`,
			label: "SMS parser LLM",
			maxRetries: 2,
			timeoutMs: 15_000,
			concurrency: 4,
			queueCapacity: 16,
			throwOnNonOk: false,
			retryable: true,
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`LLM API error: ${response.status} ${error}`);
	}

	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;

	if (!content) {
		throw new Error("No content in LLM response");
	}

	const parsed = JSON.parse(content) as Record<string, unknown>;

	if ("error" in parsed) {
		throw new Error(`Not a payment SMS: ${parsed.error}`);
	}

	if (typeof parsed.amount !== "number" || parsed.amount <= 0) {
		throw new Error(`Invalid amount: ${String(parsed.amount)}`);
	}

	return {
		bank: String(parsed.bank || "unknown"),
		amount: parsed.amount,
		sender_name: parsed.sender_name ? String(parsed.sender_name) : null,
		sender_account: parsed.sender_account
			? String(parsed.sender_account)
			: null,
		reference: parsed.reference ? String(parsed.reference) : null,
		transaction_type:
			parsed.transaction_type === "outgoing" ? "outgoing" : "incoming",
		raw_message: message,
	};
}

/**
 * Store parsed SMS and payment record in Supabase.
 */
export async function storeParsedSms(
	orgId: string,
	sender: string,
	message: string,
	receivedAt: string,
	parsed: ParsedPayment,
	supabase: ServiceClient,
): Promise<string> {
	// Store the raw SMS
	const { data: smsData, error: smsError } = await supabase
		.from("sms_messages")
		.insert({
			org_id: orgId,
			sender,
			message,
			received_at: receivedAt,
			parsed: {
				bank: parsed.bank,
				amount: parsed.amount,
				sender_name: parsed.sender_name,
				reference: parsed.reference,
				transaction_type: parsed.transaction_type,
			},
			parsed_at: new Date().toISOString(),
		})
		.select("id")
		.single();

	if (smsError) {
		throw new Error(`Failed to store SMS: ${smsError.message}`);
	}

	// Store the parsed payment
	const { data: paymentData, error: paymentError } = await supabase
		.from("sms_payments")
		.insert({
			org_id: orgId,
			sms_message_id: smsData.id,
			bank: parsed.bank,
			amount: parsed.amount,
			sender_name: parsed.sender_name,
			sender_account: parsed.sender_account,
			reference: parsed.reference,
			transaction_type: parsed.transaction_type,
			status: "pending",
		})
		.select("id")
		.single();

	if (paymentError) {
		throw new Error(`Failed to store payment: ${paymentError.message}`);
	}

	// Link SMS to payment
	await supabase
		.from("sms_messages")
		.update({ matched_payment_id: paymentData.id })
		.eq("id", smsData.id);

	return paymentData.id;
}
