import { NextRequest, NextResponse } from "next/server";

const API_PROXY_TARGET = (
  process.env.API_PROXY_TARGET?.trim() ||
  "https://tradenexabackend-production.up.railway.app"
).replace(/\/$/, "");

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetPath = path.join("/");
  const search = request.nextUrl.search;
  const url = `${API_PROXY_TARGET}/api/v1/${targetPath}${search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Preserve raw bytes — request.text() corrupts multipart/form-data file uploads
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(url, init);
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to reach backend server." },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
