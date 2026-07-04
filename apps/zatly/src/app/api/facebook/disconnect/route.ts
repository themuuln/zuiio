import { NextResponse } from "next/server";
import { clearFacebookConnection } from "@/lib/facebookConnection";

export async function POST() {
	try {
		await clearFacebookConnection();
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error clearing Facebook connection:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect" },
			{ status: 500 },
		);
	}
}
