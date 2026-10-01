import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/brand";

export const runtime = "edge";

// PNG-Icons aus dem SVG-Logo: /icons/180 (iOS), /icons/192, /icons/512 (optional ?maskable=1)
export async function GET(req: Request, { params }: { params: { size: string } }) {
  const size = params.size === "180" ? 180 : params.size === "192" ? 192 : 512;
  const maskable = new URL(req.url).searchParams.has("maskable") || size === 180;
  return new ImageResponse(<AppIcon size={size} maskable={maskable} />, { width: size, height: size });
}
