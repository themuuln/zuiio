import { describe, expect, it } from "vitest";

describe("handleCardCarousel", () => {
	it("returns one message per card with markdown formatting", async () => {
		const { handleCardCarousel } = await import(
			"@/flow-executor/nodes/card-carousel"
		);

		const result = await handleCardCarousel({ run: { id: "run-1" } } as never, {
			data: {
				cards: [
					{
						id: "card-1",
						title: "Product A",
						subtitle: "$10.00",
						imageUrl: "https://example.com/a.jpg",
						buttons: [
							{ id: "btn-1", text: "Buy", type: "postback", value: "buy_a" },
						],
					},
				],
			},
		});

		expect(result.action).toEqual({ type: "next" });
		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].text).toBe("**Product A**\n$10.00");
	});

	it("maps postback buttons to flow callback data", async () => {
		const { handleCardCarousel } = await import(
			"@/flow-executor/nodes/card-carousel"
		);

		const result = await handleCardCarousel(
			{ run: { id: "run-42" } } as never,
			{
				data: {
					cards: [
						{
							id: "card-1",
							title: "Test",
							subtitle: "Sub",
							imageUrl: "https://example.com/img.jpg",
							buttons: [
								{ id: "b1", text: "Go", type: "postback", value: "go_now" },
							],
						},
					],
				},
			},
		);

		const btn = result.messages[0].buttons?.[0];
		expect(btn.callbackData).toBe("flow:run-42:go_now");
	});

	it("passes URL-type button values directly as callbackData", async () => {
		const { handleCardCarousel } = await import(
			"@/flow-executor/nodes/card-carousel"
		);

		const result = await handleCardCarousel({ run: { id: "run-1" } } as never, {
			data: {
				cards: [
					{
						id: "card-1",
						title: "Link",
						subtitle: "Click",
						imageUrl: "https://example.com/img.jpg",
						buttons: [
							{
								id: "b1",
								text: "Visit",
								type: "url",
								value: "https://example.com/page",
							},
						],
					},
				],
			},
		});

		const btn = result.messages[0].buttons?.[0];
		expect(btn.callbackData).toBe("https://example.com/page");
	});

	it("handles multiple cards", async () => {
		const { handleCardCarousel } = await import(
			"@/flow-executor/nodes/card-carousel"
		);

		const result = await handleCardCarousel({ run: { id: "run-1" } } as never, {
			data: {
				cards: [
					{
						id: "c1",
						title: "Card 1",
						subtitle: "First",
						imageUrl: "https://example.com/1.jpg",
						buttons: [],
					},
					{
						id: "c2",
						title: "Card 2",
						subtitle: "Second",
						imageUrl: "https://example.com/2.jpg",
						buttons: [],
					},
				],
			},
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].text).toContain("Card 1");
		expect(result.messages[1].text).toContain("Card 2");
	});

	it("includes card data in the message", async () => {
		const { handleCardCarousel } = await import(
			"@/flow-executor/nodes/card-carousel"
		);

		const card = {
			id: "c1",
			title: "Product",
			subtitle: "Description",
			imageUrl: "https://example.com/img.jpg",
			buttons: [],
		};

		const result = await handleCardCarousel({ run: { id: "run-1" } } as never, {
			data: { cards: [card] },
		});

		expect(result.messages[0].cards).toHaveLength(1);
		expect(result.messages[0].cards?.[0]).toEqual(card);
	});
});
