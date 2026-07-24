import "server-only";

/**
 * Confidence scoring for tool responses.
 * Assesses how reliable an agent's response is, and whether
 * it should be shown as-is, shown with a caveat, or escalated.
 */

export interface ConfidenceScore {
	score: number; // 0.0 - 1.0
	level: "high" | "medium" | "low";
	reasoning: string;
	shouldEscalate: boolean;
	displayPrefix: string;
}

/**
 * Score confidence based on multiple factors.
 */
export function scoreConfidence(params: {
	toolName: string;
	toolResult: unknown;
	llmResponse?: string;
	hallucinationIndicators?: string[];
	dataCompleteness?: "full" | "partial" | "empty";
}): ConfidenceScore {
	const checks: Array<{ passed: boolean; weight: number; label: string }> = [];

	// Data completeness check
	if (params.dataCompleteness) {
		if (params.dataCompleteness === "full") {
			checks.push({ passed: true, weight: 0.3, label: "Бүрэн өгөгдөл" });
		} else if (params.dataCompleteness === "empty") {
			checks.push({ passed: false, weight: 0.3, label: "Өгөгдөл хоосон" });
		} else {
			checks.push({ passed: true, weight: 0.15, label: "Хэсэгчилсэн өгөгдөл" });
		}
	} else {
		// Tool result exists and is not an error
		const hasResult =
			params.toolResult !== undefined &&
			params.toolResult !== null &&
			!(
				typeof params.toolResult === "object" &&
				"error" in (params.toolResult as Record<string, unknown>)
			);
		checks.push({
			passed: hasResult,
			weight: 0.3,
			label: "Үр дүн байгаа эсэх",
		});
	}

	// No hallucination indicators in response
	if (params.llmResponse) {
		const hasHallucinationMarkers =
			params.hallucinationIndicators?.some((marker) =>
				params.llmResponse?.toLowerCase().includes(marker.toLowerCase()),
			) ?? false;

		if (!hasHallucinationMarkers) {
			// Check for common hallucination patterns
			const hallucinationPatterns = [
				"мэдэхгүй",
				"тодорхойгүй",
				"бололтой",
				"магадгүй",
				"ойролцоогоор",
				"таамаглаж",
			];
			const hasUncertainty = hallucinationPatterns.some((p) =>
				params.llmResponse?.toLowerCase().includes(p),
			);

			checks.push({
				passed: !hasUncertainty,
				weight: 0.25,
				label: "Тодорхой хариулт",
			});
		} else {
			checks.push({
				passed: false,
				weight: 0.25,
				label: "Хиймэл мэдээллийн шинж илэрсэн",
			});
		}
	} else {
		checks.push({ passed: true, weight: 0.25, label: "Баталгаажсан өгөгдөл" });
	}

	// Tool-specific confidence
	const toolConfidenceMap: Record<string, number> = {
		getDailySummary: 0.9,
		getWorkOrderDetails: 0.9,
		readData: 0.85,
		getVehicleAnalytics: 0.9,
		getFinancialSummary: 0.9,
		exportData: 0.85,
		partsLookup: 0.85,
		getSparePartsSales: 0.9,
		getSalesByCategory: 0.9,
	};
	const toolConfidence = toolConfidenceMap[params.toolName] ?? 0.7;
	checks.push({
		passed: toolConfidence > 0.8,
		weight: 0.2,
		label: "Багажийн найдвартай байдал",
	});

	// Calculate score
	const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
	const weightedScore =
		checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0) / totalWeight;

	// Determine level
	let level: ConfidenceScore["level"];
	let shouldEscalate: boolean;
	let displayPrefix: string;

	if (weightedScore >= 0.8) {
		level = "high";
		shouldEscalate = false;
		displayPrefix = "";
	} else if (weightedScore >= 0.6) {
		level = "medium";
		shouldEscalate = false;
		displayPrefix =
			"⚠️ Энэ мэдээлэл баталгаажаагүй байж болзошгүй. Баталгаажуулахыг зөвлөж байна.\n\n";
	} else {
		level = "low";
		shouldEscalate = true;
		displayPrefix =
			"🚨 АНХААРУУЛГА: Энэ мэдээллийн найдвартай байдал бага байна. Хүний баталгаажуулалт шаардлагатай.\n\n";
	}

	return {
		score: Math.round(weightedScore * 100) / 100,
		level,
		reasoning: checks
			.map((c) => `${c.passed ? "✅" : "❌"} ${c.label}`)
			.join(" | "),
		shouldEscalate,
		displayPrefix,
	};
}
