/** Same-origin typing relay (Next.js) — fallback when socket typing is not broadcast. */

export type TypingRelayState = {
  is_typing: boolean;
  user_id: number | null;
  rfq_id: number | null;
  conversation_id: number;
};

export async function publishTypingRelay(options: {
  conversationId: number;
  userId: number;
  isTyping: boolean;
  rfqId?: number | null;
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
    await fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: options.conversationId,
        user_id: options.userId,
        is_typing: options.isTyping,
        rfq_id: options.rfqId ?? null,
      }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export async function fetchTypingRelay(
  conversationId: number,
  excludeUserId: number
): Promise<TypingRelayState | null> {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return null;
  try {
    const params = new URLSearchParams({
      conversation_id: String(conversationId),
      exclude_user_id: String(excludeUserId > 0 ? excludeUserId : 0),
    });
    const res = await fetch(`/api/chat/typing?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TypingRelayState;
  } catch {
    return null;
  }
}
