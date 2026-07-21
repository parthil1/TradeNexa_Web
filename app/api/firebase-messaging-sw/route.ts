import { NextResponse } from "next/server";
import {
  buildFirebaseMessagingSwSource,
  getFirebaseWebConfigFromEnv,
} from "@/config/firebaseMessagingSw";

export const dynamic = "force-dynamic";

/**
 * Firebase messaging SW — config from NEXT_PUBLIC_FIREBASE_* env (not hardcoded).
 * Also exposed as /firebase-messaging-sw.js via next.config rewrite.
 */
export async function GET() {
  const body = buildFirebaseMessagingSwSource(getFirebaseWebConfigFromEnv());

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "Service-Worker-Allowed": "/",
    },
  });
}
