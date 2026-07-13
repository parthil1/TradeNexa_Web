import { NextRequest, NextResponse } from "next/server";

/**
 * Local presence relay for buyer ↔ seller online/offline when
 * socket `presence:update` (S→C) is delayed. Primary flow remains
 * conversation:join / leave + presence:ping per the Chat Module guide.
 */

type PresenceEntry = {
  conversationId: number;
  userId: number;
  online: boolean;
  at: number;
};

type PresenceStore = Map<string, PresenceEntry>;

declare global {
  // eslint-disable-next-line no-var
  var __tradenexaPresenceStore: PresenceStore | undefined;
}

function getStore(): PresenceStore {
  if (!globalThis.__tradenexaPresenceStore) {
    globalThis.__tradenexaPresenceStore = new Map();
  }
  return globalThis.__tradenexaPresenceStore;
}

/** Consider offline if no heartbeat/join refresh within this window. */
const ONLINE_TTL_MS = 20_000;

function prune(store: PresenceStore) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.online && now - entry.at > ONLINE_TTL_MS) {
      store.set(key, { ...entry, online: false, at: now });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const conversationId = Number(body.conversation_id);
    const userId = Number(body.user_id);
    const online = Boolean(body.is_online ?? body.online);

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return NextResponse.json({ message: "Invalid conversation_id" }, { status: 400 });
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ message: "Invalid user_id" }, { status: 400 });
    }

    const store = getStore();
    prune(store);
    const key = `${conversationId}:${userId}`;
    store.set(key, {
      conversationId,
      userId,
      online,
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

  const users: { user_id: number; is_online: boolean }[] = [];
  for (const entry of store.values()) {
    if (entry.conversationId !== conversationId) continue;
    if (excludeUserId > 0 && entry.userId === excludeUserId) continue;
    users.push({ user_id: entry.userId, is_online: entry.online });
  }

  const onlinePeer = users.find((u) => u.is_online) ?? null;

  return NextResponse.json({
    conversation_id: conversationId,
    users,
    is_online: Boolean(onlinePeer),
    user_id: onlinePeer?.user_id ?? null,
  });
}
