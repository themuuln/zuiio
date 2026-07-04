import {
	getFacebookConnection,
	saveFacebookConnection,
	clearFacebookConnection,
} from "@/lib/facebookConnection";
import { revalidatePath } from "next/cache";

export default async function AdminFacebookPage() {
	const connection = await getFacebookConnection();

	async function connectPage(formData: FormData) {
		"use server";
		const pageId = formData.get("pageId") as string;
		const pageName = formData.get("pageName") as string;
		const pageAccessToken = formData.get("pageAccessToken") as string;

		if (!pageId || !pageName || !pageAccessToken) return;

		await saveFacebookConnection({
			pageId,
			pageName,
			pageAccessToken,
			connectedAt: new Date().toISOString(),
		});

		revalidatePath("/admin/facebook");
	}

	async function disconnectPage() {
		"use server";
		await clearFacebookConnection();
		revalidatePath("/admin/facebook");
	}

	return (
		<div className="p-8 max-w-2xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Facebook Page Connection</h1>
				<p className="text-gray-600">
					Connect your Facebook Page manually to receive messages via Webhook.
				</p>
			</div>

			{connection ? (
				<div className="bg-green-50 border border-green-200 p-6 rounded-lg">
					<h2 className="text-lg font-semibold text-green-800 mb-4">
						Page Connected!
					</h2>
					<div className="space-y-2 mb-6 text-sm">
						<p>
							<span className="font-medium">Page Name:</span>{" "}
							{connection.pageName}
						</p>
						<p>
							<span className="font-medium">Page ID:</span> {connection.pageId}
						</p>
						<p>
							<span className="font-medium">Connected On:</span>{" "}
							{new Date(connection.connectedAt).toLocaleDateString()}
						</p>
					</div>
					<form action={disconnectPage}>
						<button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
							Disconnect Page
						</button>
					</form>
				</div>
			) : (
				<form
					action={connectPage}
					className="bg-white border border-gray-200 p-6 rounded-lg space-y-4"
				>
					<h2 className="text-lg font-semibold mb-4">Manual Connection Form</h2>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Page Name
						</label>
						<input
							name="pageName"
							required
							placeholder="e.g. My Cool Business Page"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Page ID
						</label>
						<input
							name="pageId"
							required
							placeholder="e.g. 1234567890"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p className="text-xs text-gray-500 mt-1">
							You can find this in your Page&apos;s About section.
						</p>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Page Access Token
						</label>
						<input
							name="pageAccessToken"
							required
							type="password"
							placeholder="Starts with EAA..."
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p className="text-xs text-gray-500 mt-1">
							Generated from the Meta App Dashboard or Graph API Explorer.
						</p>
					</div>

					<button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mt-6">
						Connect Page
					</button>
				</form>
			)}
		</div>
	);
}
