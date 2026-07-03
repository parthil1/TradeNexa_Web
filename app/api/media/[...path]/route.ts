import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ORIGIN } from "@/config/api";

/**
 * Proxies backend /media/* files through the Next.js origin.
 * Required because Railway serves media with `Cross-Origin-Resource-Policy: same-origin`,
 * which blocks <img> tags on localhost / Vercel from loading images directly.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = path.join("/");
  const url = `${BACKEND_ORIGIN}/media/${targetPath}${request.nextUrl.search}`;

  try {
    const response = await fetch(url, { cache: "force-cache" });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load media from backend." },
      { status: 502 }
    );
  }
}
