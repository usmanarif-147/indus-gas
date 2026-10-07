import { ImageResponse } from "next/og";

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: rawSize } = await params;
  const size = rawSize === "192" ? 192 : 512;
  const fontSize = Math.round(size * 0.28);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f5c4e", color: "#f7f8f5", fontSize, fontWeight: 800, fontFamily: "Arial", borderRadius: Math.round(size * 0.18) }}>IG</div>,
    { width: size, height: size }
  );
}
