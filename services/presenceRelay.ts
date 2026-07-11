/** Same-origin presence relay — backs conversation:join online/offline for buyer + seller. */

export async function publishPresenceRelay(options: {
  conversationId: number;
  userId: number;
  online: boolean;
}): Promise<void> {
  if (
    !Number.isFinite(options.conversationId) ||
    options.conversationId <= 0 ||
    !Number.isFinite(options.userId) ||
    options.userId <= 0
  ) {
    return;
  }

  try {
    await fetch("/api/chat/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: options.conversationId,
        user_id: options.userId,
        is_online: options.online,
      }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export async function fetchPresenceRelay(
  conversationId: number,
  excludeUserId: number
): Promise<{ users: { user_id: number; is_online: boolean }[] } | null> {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return null;
  try {
    const params = new URLSearchParams({
      conversation_id: String(conversationId),
      exclude_user_id: String(excludeUserId > 0 ? excludeUserId : 0),
    });
    const res = await fetch(`/api/chat/presence?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: { user_id: number; is_online: boolean }[];
    };
    return { users: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return null;
  }
}
