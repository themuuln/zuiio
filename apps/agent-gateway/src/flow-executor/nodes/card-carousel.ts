import type { FlowContext, NodeResult, OutboundMessage } from "../types";

/**
 * Card Carousel node — sends a horizontally scrollable carousel of cards.
 * Each card has a title, subtitle, image, and buttons.
 *
 * Messenger: Generic Template (max 10 cards)
 * Instagram: Not supported — falls back to text list
 * Telegram: Media Group or sequential messages
 */
export async function handleCardCarousel(
	ctx: FlowContext,
	node: {
		data: {
			cards: Array<{
				id: string;
				title: string;
				subtitle: string;
				imageUrl: string;
				buttons: Array<{
					id: string;
					text: string;
					type: "postback" | "url";
					value: string;
				}>;
			}>;
		};
	},
): Promise<NodeResult> {
	const { cards } = node.data;

	// For channels that support carousels (Messenger), send as carousel
	// For others, fall back to sequential text messages
	const messages: OutboundMessage[] = cards.map((card) => ({
		text: `**${card.title}**\n${card.subtitle}`,
		cards: [card],
		buttons: card.buttons.map((b) => ({
			text: b.text,
			callbackData:
				b.type === "postback" ? `flow:${ctx.run.id}:${b.value}` : b.value,
		})),
	}));

	return {
		action: { type: "next" },
		messages,
	};
}
