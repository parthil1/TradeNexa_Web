import type {
  ApiChatConversation,
  ApiChatMessage,
  ApiChatParticipant,
  ApiChatProductPreview,
  ApiChatQuotationPreview,
  ChatMessageType,
  ChatUnreadSummary,
  CreateConversationPayload,
  ChatListParams,
  ChatMessagesParams,
  ChatConversationListResult,
  ChatMessageListResult,
  MarkReadPayload,
  SendMessagePayload,
} from "@/types/chat";
import type { ApiPagination } from "@/types/catalog";

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeParticipant(raw: unknown): ApiChatParticipant | null {
  const item = readRecord(raw);
  if (!item) return null;
  return {
    id: pickNumber(item.id) ?? undefined,
    user_id: pickNumber(item.user_id) ?? undefined,
    name: pickString(item.name),
    company_name: pickString(item.company_name) ?? pickString(item.company),
    role: pickString(item.role),
    is_online: typeof item.is_online === "boolean" ? item.is_online : null,
  };
}

function normalizeProductPreview(raw: unknown): ApiChatProductPreview | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  if (id == null) return null;
  return {
    id,
    name: pickString(item.name),
    thumbnail: pickString(item.thumbnail) ?? pickString(item.image),
    price: pickNumber(item.price),
    currency: pickString(item.currency) ?? "INR",
    unit: pickString(item.unit),
  };
}

function normalizeQuotationPreview(raw: unknown): ApiChatQuotationPreview | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  if (id == null) return null;
  return {
    id,
    price: pickNumber(item.price),
    quantity: pickNumber(item.quantity),
    unit: pickString(item.unit),
    delivery_days: pickNumber(item.delivery_days),
    currency: pickString(item.currency) ?? "INR",
    status: pickString(item.status),
  };
}

function normalizeMessageType(value: unknown): ChatMessageType {
  const raw = pickString(value)?.toUpperCase();
  if (raw === "PRODUCT" || raw === "QUOTATION" || raw === "IMAGE" || raw === "DOCUMENT") {
    return raw;
  }
  if (
    raw === "SYSTEM" ||
    raw === "STATUS" ||
    raw === "EVENT" ||
    raw === "NOTIFICATION" ||
    raw === "SYSTEM_EVENT"
  ) {
    return "SYSTEM";
  }
  return "TEXT";
}

/** Known automated status copy that APIs often send as plain TEXT. */
const SYSTEM_CONTENT_RE =
  /^(quotation\s+(revised|accepted|rejected|submitted|withdrawn)|rfq\s+(awarded|cancelled|canceled|closed|published)|awarded)$/i;

export function matchesSystemChatContent(content?: string | null): boolean {
  const text = (content ?? "").trim();
  if (!text) return false;
  return SYSTEM_CONTENT_RE.test(text);
}

/** True for automated RFQ/quotation status events — not person-typed chat. */
export function isSystemChatMessage(message: {
  message_type?: string | null;
  is_system?: boolean;
  sender_role?: string | null;
  sender_id?: number | null;
  is_mine?: boolean;
  content?: string | null;
}): boolean {
  if (message.is_system) return true;
  if (message.message_type === "SYSTEM") return true;
  const role = (message.sender_role ?? "").toLowerCase();
  if (role === "system" || role === "bot" || role === "status" || role === "automated") {
    return true;
  }
  if (matchesSystemChatContent(message.content) && message.is_mine !== true) {
    return true;
  }
  return false;
}

/** Person-to-person messages that should drive unread badges / dividers. */
export function countsAsUnreadChatMessage(message: {
  id?: number;
  message_type?: string | null;
  is_system?: boolean;
  sender_role?: string | null;
  sender_id?: number | null;
  is_mine?: boolean;
  content?: string | null;
}): boolean {
  if (message.id == null || message.id <= 0) return false;
  if (message.is_mine) return false;
  if (isSystemChatMessage(message)) return false;
  return true;
}

/**
 * Unread to show in UI. Backend often includes SYSTEM status events in
 * unread_count; those should not keep RFQ / nav badges lit.
 */
export function effectiveConversationUnread(conversation: {
  unread_count?: number | null;
  last_message?: {
    message_type?: string | null;
    is_system?: boolean;
    sender_role?: string | null;
    sender_id?: number | null;
    is_mine?: boolean;
    content?: string | null;
  } | null;
}): number {
  const count = conversation.unread_count ?? 0;
  if (count <= 0) return 0;
  // Status-only tip of the thread (e.g. "RFQ cancelled") is not chat unread.
  if (conversation.last_message && isSystemChatMessage(conversation.last_message)) {
    return 0;
  }
  return count;
}

/** System/status events alone do not count as a started conversation.
 *  An empty thread (no last_message) means the buyer accepted/opened chat. */
export function isConversationStartedByHuman(conversation: {
  last_message?: {
    message_type?: string | null;
    is_system?: boolean;
    sender_role?: string | null;
    sender_id?: number | null;
    is_mine?: boolean;
    content?: string | null;
  } | null;
} | null | undefined): boolean {
  const last = conversation?.last_message;
  if (!last) return true;
  return !isSystemChatMessage(last);
}

export function messagesIncludeHumanChat(
  messages: Array<{
    id?: number;
    message_type?: string | null;
    is_system?: boolean;
    sender_role?: string | null;
    sender_id?: number | null;
    is_mine?: boolean;
    content?: string | null;
  }>
): boolean {
  return messages.some((m) => (m.id == null || m.id > 0) && !isSystemChatMessage(m));
}

function looksLikeMediaUrl(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 4000) return false;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("blob:") || v.startsWith("data:image")) return true;
  if (
    v.startsWith("/media/") ||
    v.startsWith("/uploads/") ||
    v.startsWith("/storage/") ||
    v.startsWith("/files/") ||
    v.startsWith("/static/")
  ) {
    return true;
  }
  // Path-like key with a directory segment + image extension (no spaces)
  if (
    v.includes("/") &&
    /\.(jpe?g|png|gif|webp|bmp|heic)(\?.*)?$/i.test(v) &&
    !/\s/.test(v)
  ) {
    return true;
  }
  return false;
}

const MEDIA_URL_KEYS = [
  "media_url",
  "mediaUrl",
  "file_url",
  "fileUrl",
  "image_url",
  "imageUrl",
  "thumbnail_url",
  "thumbnailUrl",
  "download_url",
  "downloadUrl",
  "signed_url",
  "signedUrl",
  "public_url",
  "publicUrl",
  "url",
  "href",
  "src",
  "path",
  "file_path",
  "filePath",
  "location",
  "key",
  "storage_key",
  "storageKey",
  "s3_url",
  "s3Url",
] as const;

/** Walk message payloads for the first string that looks like a media URL/path. */
function findMediaUrlDeep(value: unknown, depth = 0): string | null {
  if (value == null || depth > 5) return null;

  if (typeof value === "string") {
    return looksLikeMediaUrl(value) ? value.trim() : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findMediaUrlDeep(entry, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;

  for (const key of MEDIA_URL_KEYS) {
    const raw = record[key];
    if (typeof raw === "string" && looksLikeMediaUrl(raw)) return raw.trim();
  }

  for (const [key, nested] of Object.entries(record)) {
    if (
      key === "content" ||
      key === "body" ||
      key === "text" ||
      key === "file_name" ||
      key === "filename" ||
      key === "name" ||
      key === "original_name" ||
      key === "sender_name"
    ) {
      continue;
    }
    const found = findMediaUrlDeep(nested, depth + 1);
    if (found) return found;
  }

  return null;
}

function normalizeMediaUrlValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let mediaUrl = raw.trim();
  if (!mediaUrl) return null;

  if (
    !/^https?:\/\//i.test(mediaUrl) &&
    !mediaUrl.startsWith("/") &&
    !mediaUrl.startsWith("blob:") &&
    !mediaUrl.startsWith("data:")
  ) {
    mediaUrl = mediaUrl.includes("/")
      ? `/media/${mediaUrl.replace(/^\/+/, "")}`
      : `/media/${mediaUrl}`;
  }
  return mediaUrl;
}

/** Best display name for IMAGE/DOCUMENT bubbles (never invent WhatsApp names). */
export function getChatFileDisplayName(message: {
  message_type?: string | null;
  file_name?: string | null;
  content?: string | null;
  media_url?: string | null;
  file_url?: string | null;
}): string {
  const explicit = message.file_name?.trim();
  if (explicit && !/^document$/i.test(explicit) && !/^image$/i.test(explicit)) {
    return explicit;
  }

  const fromUrl = fileNameFromUrl(message.media_url || message.file_url);
  if (fromUrl) return fromUrl;

  const content = message.content?.trim();
  if (content && looksLikePlainFileName(content)) return content;

  return message.message_type === "IMAGE" ? "Image" : "Document";
}

function looksLikePlainFileName(value: string): boolean {
  if (!value || value.length > 240) return false;
  if (value.includes("://") || value.includes("\n")) return false;
  return /\.[\w]{2,5}$/i.test(value);
}

function fileNameFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const clean = url.split("?")[0]?.split("#")[0] ?? "";
    const base = decodeURIComponent(clean.split("/").pop() || "").trim();
    if (!base || base === "media" || base === "file" || base === "download") return null;
    if (!/\.[\w]{2,8}$/i.test(base)) return null;
    return base;
  } catch {
    return null;
  }
}

export function normalizeChatMessage(
  raw: unknown,
  currentUserId?: number | null
): ApiChatMessage | null {
  const item = readRecord(raw);
  if (!item) return null;
  // Support socket envelopes: { message: {...} }
  if (!("conversation_id" in item) && "message" in item) {
    return normalizeChatMessage(item.message, currentUserId);
  }
  const id = pickNumber(item.id);
  const conversationId =
    pickNumber(item.conversation_id) ?? pickNumber(item.conversationId);
  if (id == null || conversationId == null) return null;

  const product = normalizeProductPreview(item.product);
  const quotation = normalizeQuotationPreview(item.quotation);
  const media = readRecord(item.media);
  const attachment =
    readRecord(item.attachment) ??
    readRecord(item.file) ??
    (Array.isArray(item.attachments) ? readRecord(item.attachments[0]) : null);
  const senderRecord = readRecord(item.sender);

  const messageType = normalizeMessageType(item.message_type ?? item.type);
  const content = pickString(item.content) ?? pickString(item.body) ?? pickString(item.text);
  const senderRole =
    pickString(item.sender_role) ??
    pickString(item.role) ??
    pickString(senderRecord?.role);
  const senderId =
    pickNumber(item.sender_id) ??
    pickNumber(item.senderId) ??
    pickNumber(item.user_id) ??
    pickNumber(item.userId) ??
    pickNumber(senderRecord?.user_id) ??
    pickNumber(senderRecord?.id);
  const fileName =
    pickString(item.file_name) ??
    pickString(item.fileName) ??
    pickString(item.filename) ??
    pickString(item.original_name) ??
    pickString(item.originalName) ??
    pickString(media?.name) ??
    pickString(media?.file_name) ??
    pickString(media?.fileName) ??
    pickString(attachment?.name) ??
    pickString(attachment?.file_name) ??
    pickString(attachment?.fileName) ??
    pickString(attachment?.original_name);

  let mediaUrl = normalizeMediaUrlValue(
    pickString(item.media_url) ??
      pickString(item.mediaUrl) ??
      pickString(item.file_url) ??
      pickString(item.fileUrl) ??
      pickString(item.image_url) ??
      pickString(item.imageUrl) ??
      pickString(item.thumbnail_url) ??
      pickString(item.thumbnailUrl) ??
      pickString(item.download_url) ??
      pickString(item.downloadUrl) ??
      pickString(item.signed_url) ??
      pickString(item.signedUrl) ??
      pickString(item.url) ??
      pickString(item.path) ??
      pickString(item.file_path) ??
      pickString(item.filePath) ??
      pickString(item.key) ??
      pickString(item.storage_key) ??
      pickString(item.storageKey) ??
      (typeof item.media === "string" ? pickString(item.media) : null) ??
      pickString(media?.url) ??
      pickString(media?.file_url) ??
      pickString(media?.fileUrl) ??
      pickString(media?.path) ??
      pickString(media?.thumbnail) ??
      pickString(media?.key) ??
      pickString(attachment?.url) ??
      pickString(attachment?.file_url) ??
      pickString(attachment?.fileUrl) ??
      pickString(attachment?.path) ??
      pickString(attachment?.key) ??
      findMediaUrlDeep(item)
  );

  // media_id-only payloads — try conventional /media/{id} path
  if (!mediaUrl) {
    const mediaId =
      pickNumber(item.media_id) ??
      pickNumber(item.mediaId) ??
      pickNumber(media?.id) ??
      pickNumber(attachment?.id);
    if (mediaId != null) {
      mediaUrl = `/media/${mediaId}`;
    }
  }

  // Some APIs send IMAGE payloads as TEXT with only a filename in content.
  let resolvedType = messageType;
  if (
    resolvedType === "TEXT" &&
    !mediaUrl &&
    fileName &&
    /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(fileName)
  ) {
    resolvedType = "IMAGE";
  }
  if (
    resolvedType === "TEXT" &&
    mediaUrl &&
    /\.(jpe?g|png|gif|webp|bmp|heic)(\?|$)/i.test(mediaUrl)
  ) {
    resolvedType = "IMAGE";
  }

  const isSystemFlag =
    item.is_system === true ||
    item.system === true ||
    resolvedType === "SYSTEM" ||
    matchesSystemChatContent(content);

  const message: ApiChatMessage = {
    id,
    conversation_id: conversationId,
    message_type: isSystemFlag && resolvedType === "TEXT" ? "SYSTEM" : resolvedType,
    content,
    sender_id: senderId,
    sender_role: senderRole,
    sender_name:
      pickString(item.sender_name) ??
      pickString(senderRecord?.name) ??
      pickString(senderRecord?.full_name) ??
      pickString(senderRecord?.company_name),
    is_mine: typeof item.is_mine === "boolean" ? item.is_mine : undefined,
    is_system: isSystemFlag || undefined,
    created_at: pickString(item.created_at) ?? pickString(item.sent_at),
    read_at: pickString(item.read_at),
    delivered_at: pickString(item.delivered_at),
    product_id: pickNumber(item.product_id) ?? product?.id ?? null,
    quotation_id: pickNumber(item.quotation_id) ?? quotation?.id ?? null,
    product,
    quotation,
    media_url: mediaUrl,
    file_url: pickString(item.file_url) ?? pickString(item.fileUrl) ?? mediaUrl,
    file_name:
      fileName ??
      fileNameFromUrl(mediaUrl) ??
      (resolvedType === "IMAGE" || resolvedType === "DOCUMENT"
        ? content && looksLikePlainFileName(content)
          ? content
          : null
        : null),
    file_size:
      pickNumber(item.file_size) ??
      pickNumber(item.fileSize) ??
      pickNumber(media?.size) ??
      pickNumber(attachment?.size),
  };

  return applyMessageOwnership(message, currentUserId);
}

/**
 * Resolve numeric auth user id for comparing against message.sender_id.
 * Prefers User.user_id, then numeric User.id, then JWT payload.
 */
export function resolveAuthNumericUserId(
  user?: { id?: string; user_id?: number | null } | null
): number | null {
  if (user?.user_id != null && Number.isFinite(user.user_id) && user.user_id > 0) {
    return user.user_id;
  }
  if (user?.id) {
    const fromId = Number(user.id);
    if (Number.isFinite(fromId) && fromId > 0) return fromId;
  }
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<
      string,
      unknown
    >;
    return (
      pickNumber(payload.user_id) ??
      pickNumber(payload.id) ??
      (typeof payload.sub === "string" || typeof payload.sub === "number"
        ? pickNumber(payload.sub)
        : null)
    );
  } catch {
    return null;
  }
}

/** Set is_mine from sender_id vs logged-in user id (authoritative over API flag). */
export function applyMessageOwnership(
  message: ApiChatMessage,
  currentUserId?: number | null,
  activeRole?: "buyer" | "seller" | null
): ApiChatMessage {
  if (currentUserId != null && Number.isFinite(currentUserId) && message.sender_id != null) {
    const isMine = message.sender_id === currentUserId;
    if (message.is_mine === isMine) return message;
    return { ...message, is_mine: isMine };
  }

  // Fallback when sender_id is missing: match sender_role to active portal role.
  if (activeRole && message.sender_role) {
    const role = message.sender_role.toLowerCase();
    if (role === "buyer" || role === "seller") {
      const isMine = role === activeRole;
      if (message.is_mine === isMine) return message;
      return { ...message, is_mine: isMine };
    }
  }

  return message;
}

export function normalizeChatConversation(raw: unknown): ApiChatConversation | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id);
  if (id == null) return null;

  const participantsRaw = Array.isArray(item.participants) ? item.participants : [];
  const participants = participantsRaw
    .map(normalizeParticipant)
    .filter((p): p is ApiChatParticipant => p !== null);

  const rfq = readRecord(item.rfq);

  return {
    id,
    rfq_id: pickNumber(item.rfq_id) ?? pickNumber(rfq?.id),
    rfq_title: pickString(item.rfq_title) ?? pickString(rfq?.title),
    rfq_reference:
      pickString(item.rfq_reference) ??
      pickString(item.reference) ??
      (pickNumber(item.rfq_id) != null ? `RFQ-${pickNumber(item.rfq_id)}` : null),
    unread_count: pickNumber(item.unread_count) ?? 0,
    last_message: normalizeChatMessage(item.last_message),
    last_message_at: pickString(item.last_message_at) ?? pickString(item.updated_at),
    participants,
    buyer: normalizeParticipant(item.buyer),
    seller: normalizeParticipant(item.seller),
    other_party: normalizeParticipant(item.other_party) ?? normalizeParticipant(item.counterpart),
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
  };
}

export function normalizeUnreadSummary(raw: unknown): ChatUnreadSummary {
  const item = readRecord(raw) ?? {};
  return {
    total_unread:
      pickNumber(item.total_unread) ??
      pickNumber(item.unread_count) ??
      pickNumber(item.total) ??
      0,
    conversations_unread: pickNumber(item.conversations_unread) ?? undefined,
  };
}

export function unwrapChatPaginated<T>(
  payload: unknown,
  normalize: (item: unknown) => T | null,
  page = 1,
  limit = 20
): { results: T[]; pagination: ApiPagination } {
  const record = readRecord(payload);
  const list =
    (Array.isArray(payload) && payload) ||
    (Array.isArray(record?.results) && record.results) ||
    (Array.isArray(record?.data) && record.data) ||
    (Array.isArray(record?.messages) && record.messages) ||
    (Array.isArray(record?.conversations) && record.conversations) ||
    [];

  const results = list.map(normalize).filter((item): item is T => item !== null);
  const paginationSource = readRecord(record?.pagination) ?? record ?? {};
  const pageLimit = pickNumber(paginationSource.limit) ?? limit;
  const total = pickNumber(paginationSource.total) ?? results.length;
  const currentPage = pickNumber(paginationSource.page) ?? page;
  const totalPages =
    pickNumber(paginationSource.totalPages) ??
    pickNumber(paginationSource.total_pages) ??
    (pageLimit > 0 ? Math.max(1, Math.ceil(total / pageLimit)) : 1);

  return {
    results,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
    },
  };
}

export type {
  ChatConversationListResult,
  ChatMessageListResult,
  CreateConversationPayload,
  ChatListParams,
  ChatMessagesParams,
  MarkReadPayload,
  SendMessagePayload,
};
