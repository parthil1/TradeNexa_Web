import { NextRequest, NextResponse } from "next/server";
import { BACKEND_ORIGIN } from "@/config/api";

/**
 * Proxies an arbitrary same-origin backend media URL.
 * Used when chat/product files are not under /media/* (e.g. /uploads/...)
 * or when absolute backend URLs need to bypass Cross-Origin-Resource-Policy.
 *
 * GET /api/media/proxy?url=<encoded absolute or path>
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ success: false, message: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, BACKEND_ORIGIN);
  } catch {
    return NextResponse.json({ success: false, message: "Invalid url" }, { status: 400 });
  }

  let backendHost: string;
  try {
    backendHost = new URL(BACKEND_ORIGIN).host;
  } catch {
    return NextResponse.json({ success: false, message: "Bad backend origin" }, { status: 500 });
  }

  if (target.host !== backendHost) {
    return NextResponse.json({ success: false, message: "Host not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(target.toString(), { cache: "force-cache" });
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
