import { NextRequest, NextResponse } from "next/server";

/**
 * Local typing relay for buyer ↔ seller when the Railway socket
 * does not broadcast `typing:indicator` (S→C) reliably.
 * Client still emits guide events `typing:start` / `typing:stop` on the socket.
 * Works on a single Next.js process (local `next dev` / one Node instance).
 */

type TypingEntry = {
  conversationId: number;
  rfqId: number | null;
  userId: number;
  at: number;
};

type TypingStore = Map<string, TypingEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __tradenexaTypingStore: TypingStore | undefined;
}

function getStore(): TypingStore {
  if (!globalThis.__tradenexaTypingStore) {
    globalThis.__tradenexaTypingStore = new Map();
  }
  return globalThis.__tradenexaTypingStore;
}

const TTL_MS = 4000;

function prune(store: TypingStore) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.at > TTL_MS) store.delete(key);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const conversationId = Number(body.conversation_id);
    const userId = Number(body.user_id);
    const rfqRaw = body.rfq_id;
    const rfqId =
      rfqRaw == null || rfqRaw === ""
        ? null
        : Number.isFinite(Number(rfqRaw))
          ? Number(rfqRaw)
          : null;
    const isTyping = Boolean(body.is_typing);

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return NextResponse.json({ message: "Invalid conversation_id" }, { status: 400 });
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ message: "Invalid user_id" }, { status: 400 });
    }

    const store = getStore();
    prune(store);
    const key = `${conversationId}:${userId}`;

    if (!isTyping) {
      store.delete(key);
      return NextResponse.json({ ok: true });
    }

    store.set(key, {
      conversationId,
      rfqId,
      userId,
      at: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const conversationId = Number(request.nextUrl.searchParams.get("conversation_id"));
  const excludeUserId = Number(request.nextUrl.searchParams.get("exclude_user_id") ?? 0);

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return NextResponse.json({ message: "Invalid conversation_id" }, { status: 400 });
  }

  const store = getStore();
  prune(store);

  const now = Date.now();
  let active: TypingEntry | null = null;
  for (const entry of store.values()) {
    if (entry.conversationId !== conversationId) continue;
    if (excludeUserId > 0 && entry.userId === excludeUserId) continue;
    if (now - entry.at > TTL_MS) continue;
    if (!active || entry.at > active.at) active = entry;
  }

  return NextResponse.json({
    is_typing: Boolean(active),
    user_id: active?.userId ?? null,
    rfq_id: active?.rfqId ?? null,
    conversation_id: conversationId,
  });
}
