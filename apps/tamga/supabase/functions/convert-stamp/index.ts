const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { image_base64, mime_type } = await req.json();

		if (!image_base64 || !mime_type) {
			return new Response(
				JSON.stringify({ error: "image_base64 and mime_type are required" }),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const allowedTypes = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/heic",
			"image/heif",
		];
		if (!allowedTypes.includes(mime_type)) {
			return new Response(
				JSON.stringify({
					error: `Invalid mime type. Allowed: ${allowedTypes.join(", ")}`,
				}),
				{
					status: 400,
					headers: { ...corsHeaders, "Content-Type": "application/json" },
				},
			);
		}

		const apiKey = Deno.env.get("OPENCODE_API_KEY");
		if (!apiKey) {
			throw new Error("OPENCODE_API_KEY not configured");
		}

		const prompt = `You are an expert at converting real-world brand/stamp images to clean vector SVG graphics.

This image shows a traditional Mongolian horse brand (тамга). These are simple, bold marks burned or pressed into horse skin.

Your task:
1. Identify the stamp/brand pattern in the image
2. Ignore background, shadows, textures, and any non-stamp elements
3. Create a clean, minimal SVG of JUST the stamp design
4. The stamp should be solid black (#000000) on transparent background
5. Use simple geometric paths - circles, lines, curves that match the original shape
6. Make it scalable (use viewBox, no fixed pixels where possible)
7. Output ONLY the raw SVG code - no markdown, no explanations, no code blocks

The result should look like a clean logo or icon - simplified, high contrast, vector-perfect.`;

		const response = await fetch(
			"https://opencode.ai/zen/go/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "mimo-v2.5",
					messages: [
						{
							role: "user",
							content: [
								{ type: "text", text: prompt },
								{
									type: "image_url",
									image_url: {
										url: `data:${mime_type};base64,${image_base64}`,
									},
								},
							],
						},
					],
					max_tokens: 4096,
					temperature: 0.1,
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("API error:", errorText);
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();
		const svgText = data?.choices?.[0]?.message?.content;

		if (!svgText) {
			throw new Error("No SVG output from model");
		}

		let svg = svgText.trim();
		const svgMatch = svg.match(/```(?:xml|svg)?\s*([\s\S]*?)```/);
		if (svgMatch) {
			svg = svgMatch[1].trim();
		}

		if (!svg.startsWith("<svg") && !svg.startsWith("<?xml")) {
			throw new Error("Invalid SVG output from conversion");
		}

		return new Response(JSON.stringify({ svg }), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Conversion error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to convert stamp image";
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	}
});
