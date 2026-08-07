import { ImageResponse } from "next/og";

// Route segment config
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#E8832A", // orange primary
        borderRadius: 6,
        fontSize: 20,
        fontWeight: 700,
        color: "#070808", // near-black
        fontFamily: "system-ui, sans-serif",
      }}
    >
      О
    </div>,
    { ...size },
  );
}
