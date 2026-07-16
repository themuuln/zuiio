import { ImageResponse } from "next/og";

export const runtime = "edge";

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "#0f0a1a",
				padding: "80px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "16px",
					marginBottom: "40px",
				}}
			>
				<div
					style={{
						width: "48px",
						height: "48px",
						borderRadius: "12px",
						backgroundColor: "#6b3fa0",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "white",
						fontSize: "24px",
						fontWeight: "bold",
					}}
				>
					Z
				</div>
				<span
					style={{
						color: "white",
						fontSize: "32px",
						fontWeight: "600",
						letterSpacing: "-0.02em",
					}}
				>
					zuiio
				</span>
			</div>
			<div
				style={{
					color: "white",
					fontSize: "56px",
					fontWeight: "600",
					letterSpacing: "-0.03em",
					textAlign: "center",
					lineHeight: "1.1",
					maxWidth: "900px",
				}}
			>
				Software for Mongolian businesses
			</div>
			<div
				style={{
					color: "#a78bfa",
					fontSize: "24px",
					marginTop: "24px",
					textAlign: "center",
				}}
			>
				zuiio.com
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
