import type {
  ApiChatConversation,
  ApiChatMessage,
  ApiChatParticipant,
  ApiChatProductPreview,
  ApiChatQuotationPreview,
  ApiChatRfqPreview,
  ChatMessageType,
  ChatRole,
  ChatUnreadConversationSnap,
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
    name:
      pickString(item.name) ??
      pickString(item.full_name) ??
      pickString(item.fullName),
    company_name: pickString(item.company_name) ?? pickString(item.company),
    profile_image:
      pickString(item.profile_image) ??
      pickString(item.profileImage) ??
      pickString(item.avatar) ??
      pickString(item.image),
    company_logo:
      pickString(item.company_logo) ??
      pickString(item.companyLogo) ??
      pickString(item.logo),
    role: pickString(item.role),
    is_online: typeof item.is_online === "boolean" ? item.is_online : null,
  };
}

function mergeParticipant(
  existing: ApiChatParticipant | null | undefined,
  incoming: ApiChatParticipant | null | undefined
): ApiChatParticipant | null {
  if (!existing && !incoming) return null;
  if (!incoming) return existing ?? null;
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    id: incoming.id ?? existing.id,
    user_id: incoming.user_id ?? existing.user_id,
    name: incoming.name ?? existing.name ?? null,
    company_name: incoming.company_name ?? existing.company_name ?? null,
    profile_image: incoming.profile_image ?? existing.profile_image ?? null,
    company_logo: incoming.company_logo ?? existing.company_logo ?? null,
    role: incoming.role ?? existing.role ?? null,
    is_online: incoming.is_online ?? existing.is_online ?? null,
  };
}

/** Counterparty avatar from conversations API (`user.profile_image`). */
export function conversationCounterpartyLogo(
  conversation: ApiChatConversation | null | undefined,
  role: ChatRole
): string | null {
  if (!conversation) return null;
  const other =
    conversation.other_party ??
    (role === "buyer" ? conversation.seller : conversation.buyer);
  return (
    other?.profile_image?.trim() ||
    other?.company_logo?.trim() ||
    null
  );
}

function normalizeProductPreview(raw: unknown): ApiChatProductPreview | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.id) ?? pickNumber(item.product_id);
  if (id == null) return null;
  return {
    id,
    name:
      pickString(item.name) ??
      pickString(item.product_name) ??
      pickString(item.title),
    thumbnail:
      pickString(item.thumbnail) ??
      pickString(item.image) ??
      pickString(item.product_image) ??
      pickString(item.thumbnail_url) ??
      pickString(item.image_url),
    price: pickNumber(item.price),
    currency: pickString(item.currency) ?? "INR",
    unit: pickString(item.unit),
  };
}

/** Build product card data from nested `product`, `metadata`, or top-level fields. */
function resolveChatProductPreview(item: Record<string, unknown>): ApiChatProductPreview | null {
  const metadata = readRecord(item.metadata) ?? readRecord(item.meta);
  const fromNested =
    normalizeProductPreview(item.product) ?? normalizeProductPreview(metadata);
  if (fromNested) return fromNested;

  const id = pickNumber(item.product_id);
  if (id == null) return null;

  // Fall back: top-level product_id + content like "Product: Name"
  const content = pickString(item.content) ?? pickString(item.message);
  let name: string | null = null;
  if (content) {
    const match = content.match(/^product\s*[:#]?\s*(.+)$/i);
    name = (match?.[1] ?? content).trim() || null;
  }

  return {
    id,
    name,
    thumbnail: null,
    price: pickNumber(item.price),
    currency: pickString(item.currency) ?? "INR",
    unit: pickString(item.unit),
  };
}

function normalizeQuotationPreview(raw: unknown): ApiChatQuotationPreview | null {
  const item = readRecord(raw);
  if (!item) return null;
  const nested = readRecord(item.quotation);
  const src = nested ?? item;
  const id =
    pickNumber(src.id) ??
    pickNumber(src.quotation_id) ??
    pickNumber(item.quotation_id) ??
    pickNumber(item.id);
  if (id == null) return null;
  return {
    id,
    price: pickNumber(src.price) ?? pickNumber(item.price),
    quantity: pickNumber(src.quantity) ?? pickNumber(item.quantity),
    unit: pickString(src.unit) ?? pickString(item.unit),
    delivery_days: pickNumber(src.delivery_days) ?? pickNumber(item.delivery_days),
    currency: pickString(src.currency) ?? pickString(item.currency) ?? "INR",
    status: pickString(src.status) ?? pickString(item.status),
    quotation_number:
      pickString(src.quotation_number) ??
      pickString(item.quotation_number) ??
      pickString(item.content),
    total_amount: pickNumber(src.total_amount) ?? pickNumber(item.total_amount),
    gst_percentage: pickNumber(src.gst_percentage) ?? pickNumber(item.gst_percentage),
    gst_amount: pickNumber(src.gst_amount) ?? pickNumber(item.gst_amount),
    transportation_charge:
      pickNumber(src.transportation_charge) ?? pickNumber(item.transportation_charge),
    validity_days: pickNumber(src.validity_days) ?? pickNumber(item.validity_days),
    payment_terms: pickString(src.payment_terms) ?? pickString(item.payment_terms),
    remarks: pickString(src.remarks) ?? pickString(item.remarks),
    rfq_id: pickNumber(src.rfq_id) ?? pickNumber(item.rfq_id),
    rfq_title:
      pickString(item.rfq_title) ??
      pickString(readRecord(item.rfq)?.title) ??
      pickString(item.title),
    rfq_number:
      pickString(item.rfq_number) ?? pickString(readRecord(item.rfq)?.rfq_number),
  };
}

function normalizeRfqPreview(raw: unknown): ApiChatRfqPreview | null {
  const item = readRecord(raw);
  if (!item) return null;
  const nested = readRecord(item.rfq);
  const src = nested ?? item;
  const id = pickNumber(src.id) ?? pickNumber(src.rfq_id) ?? pickNumber(item.rfq_id);
  if (id == null) return null;
  return {
    id,
    title: pickString(src.title) ?? pickString(item.rfq_title) ?? pickString(item.title),
    rfq_number: pickString(src.rfq_number) ?? pickString(item.rfq_number),
    quantity: pickNumber(src.quantity) ?? pickNumber(item.quantity),
    unit: pickString(src.unit) ?? pickString(item.unit),
    currency: pickString(src.currency) ?? pickString(item.currency) ?? "INR",
    expected_price: pickNumber(src.expected_price) ?? pickNumber(item.expected_price),
    category_name: pickString(src.category_name) ?? pickString(item.category_name),
    subcategory_name: pickString(src.subcategory_name) ?? pickString(item.subcategory_name),
    city: pickString(src.city) ?? pickString(item.city),
    status: pickString(src.status) ?? pickString(item.status),
    description: pickString(src.description) ?? pickString(item.description),
    quotation_deadline:
      pickString(src.quotation_deadline) ?? pickString(item.quotation_deadline),
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
  /^(quotation\s+(revised|accepted|rejected|submitted|withdrawn)|rfq\s+(awarded|cancelled|canceled|closed|published)|inquiry\s+(created|rejected|cancelled|canceled|accepted)|awarded)$/i;

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
 * unread_count; strip only that tip — do not wipe earlier human unread.
 */
export function effectiveConversationUnread(conversation: {
  unread_count?: number | null;
  last_message?:
    | string
    | {
        message_type?: string | null;
        is_system?: boolean;
        sender_role?: string | null;
        sender_id?: number | null;
        is_mine?: boolean;
        content?: string | null;
      }
    | null;
}): number {
  const count = conversation.unread_count ?? 0;
  if (count <= 0) return 0;
  const last = conversation.last_message;
  if (last && typeof last !== "string" && isSystemChatMessage(last)) {
    return Math.max(0, count - 1);
  }
  return count;
}

/** System/status events alone do not count as a started conversation.
 *  An empty thread (no last_message) means the buyer accepted/opened chat. */
export function isConversationStartedByHuman(conversation: {
  last_message?:
    | string
    | {
        message_type?: string | null;
        is_system?: boolean;
        sender_role?: string | null;
        sender_id?: number | null;
        is_mine?: boolean;
        content?: string | null;
      }
    | null;
} | null | undefined): boolean {
  const last = conversation?.last_message;
  if (!last) return true;
  if (typeof last === "string") return Boolean(last.trim());
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
  const content = message.content?.trim();
  const contentName =
    content && looksLikePlainFileName(content) ? content : null;

  const explicit = message.file_name?.trim();
  if (
    explicit &&
    !/^document$/i.test(explicit) &&
    !/^image$/i.test(explicit) &&
    !looksLikeGeneratedStorageName(explicit)
  ) {
    return explicit;
  }

  if (contentName) return contentName;

  const fromUrl = fileNameFromUrl(message.media_url || message.file_url);
  if (fromUrl) return fromUrl;

  return message.message_type === "IMAGE" ? "Image" : "Document";
}

function looksLikePlainFileName(value: string): boolean {
  if (!value || value.length > 240) return false;
  if (value.includes("://") || value.includes("\n")) return false;
  return /\.[\w]{2,5}$/i.test(value);
}

/** Backend storage keys like `1784144393500458.pdf` — not useful as a display name. */
function looksLikeGeneratedStorageName(name: string): boolean {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return /^\d{10,}$/.test(base);
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

  const product = resolveChatProductPreview(item);
  const metadata = readRecord(item.metadata) ?? readRecord(item.meta);
  const quotationRaw =
    normalizeQuotationPreview(item.quotation) ??
    normalizeQuotationPreview(metadata?.quotation) ??
    (metadata
      ? normalizeQuotationPreview({
          ...metadata,
          id: metadata.quotation_id ?? metadata.id,
        })
      : null);
  const rfqMetaRecord = readRecord(metadata?.rfq);
  const quotation = quotationRaw
    ? {
        ...quotationRaw,
        rfq_id:
          quotationRaw.rfq_id ??
          pickNumber(metadata?.rfq_id) ??
          pickNumber(rfqMetaRecord?.id) ??
          null,
        rfq_title:
          quotationRaw.rfq_title ??
          pickString(metadata?.rfq_title) ??
          pickString(rfqMetaRecord?.title) ??
          null,
        rfq_number:
          quotationRaw.rfq_number ??
          pickString(metadata?.rfq_number) ??
          pickString(rfqMetaRecord?.rfq_number) ??
          null,
      }
    : null;
  const rfq =
    normalizeRfqPreview(item.rfq) ??
    normalizeRfqPreview(metadata?.rfq) ??
    (metadata?.rfq_id != null || metadata?.context_type === "rfq"
      ? normalizeRfqPreview(metadata)
      : null);
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
    pickString(metadata?.file_name) ??
    pickString(metadata?.fileName) ??
    pickString(metadata?.filename) ??
    pickString(metadata?.original_name) ??
    pickString(metadata?.originalName) ??
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
      pickString(metadata?.file_url) ??
      pickString(metadata?.fileUrl) ??
      pickString(metadata?.file_path) ??
      pickString(metadata?.filePath) ??
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
    quotation_id:
      pickNumber(item.quotation_id) ??
      pickNumber(metadata?.quotation_id) ??
      quotation?.id ??
      null,
    product,
    quotation,
    rfq,
    media_url: mediaUrl,
    file_url:
      pickString(item.file_url) ??
      pickString(item.fileUrl) ??
      pickString(metadata?.file_url) ??
      pickString(metadata?.fileUrl) ??
      mediaUrl,
    file_name:
      fileName ??
      (content && looksLikePlainFileName(content) ? content : null) ??
      fileNameFromUrl(mediaUrl) ??
      null,
    file_size:
      pickNumber(item.file_size) ??
      pickNumber(item.fileSize) ??
      pickNumber(metadata?.file_size) ??
      pickNumber(metadata?.fileSize) ??
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

function normalizeLastContext(raw: unknown): import("@/types/chat").ApiChatLastContext | null {
  const item = readRecord(raw);
  if (!item) return null;
  const type = pickString(item.type);
  if (!type) return null;
  return {
    type,
    id: pickNumber(item.id),
    title: pickString(item.title) ?? pickString(item.name),
  };
}

export function normalizeChatConversation(raw: unknown): ApiChatConversation | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id =
    pickNumber(item.id) ??
    pickNumber(item.conversation_id) ??
    pickNumber(item.conversationId);
  if (id == null) return null;

  const participantsRaw = Array.isArray(item.participants) ? item.participants : [];
  const participants = participantsRaw
    .map(normalizeParticipant)
    .filter((p): p is ApiChatParticipant => p !== null);

  const rfq = readRecord(item.rfq);
  const lastContext =
    normalizeLastContext(item.last_context) ?? normalizeLastContext(item.context);

  const lastMessageRaw = item.last_message;
  const lastMessage =
    typeof lastMessageRaw === "string"
      ? lastMessageRaw
      : normalizeChatMessage(lastMessageRaw);

  const buyer = normalizeParticipant(item.buyer);
  const seller = normalizeParticipant(item.seller);
  // Guide inbox `user` is the counterparty preview
  const userParty = normalizeParticipant(item.user);

  return {
    id,
    conversation_id: pickNumber(item.conversation_id) ?? id,
    rfq_id: pickNumber(item.rfq_id) ?? pickNumber(rfq?.id),
    rfq_title:
      pickString(item.rfq_title) ??
      pickString(rfq?.title) ??
      (lastContext?.type === "rfq" ? lastContext.title : null),
    rfq_reference:
      pickString(item.rfq_reference) ??
      pickString(item.reference) ??
      (pickNumber(item.rfq_id) != null ? `RFQ-${pickNumber(item.rfq_id)}` : null),
    inquiry_id: pickNumber(item.inquiry_id),
    last_context: lastContext,
    unread_count: pickNumber(item.unread_count) ?? 0,
    last_message: lastMessage,
    last_message_at: pickString(item.last_message_at) ?? pickString(item.updated_at),
    last_message_sender_id: pickNumber(item.last_message_sender_id),
    participants,
    buyer,
    seller,
    other_party:
      normalizeParticipant(item.other_party) ??
      normalizeParticipant(item.counterpart) ??
      userParty,
    buyer_id: pickNumber(item.buyer_id) ?? buyer?.id ?? buyer?.user_id ?? null,
    seller_id: pickNumber(item.seller_id) ?? seller?.id ?? seller?.user_id ?? null,
    is_active: typeof item.is_active === "boolean" ? item.is_active : null,
    created_at: pickString(item.created_at),
    updated_at: pickString(item.updated_at),
  };
}

/**
 * Merge conversation snapshots without wiping identity fields.
 * Socket `conversation:updated` often only sends last_message / unread —
 * spreading that over inbox rows clears seller/buyer and shows "Seller".
 */
export function mergeConversationMeta(
  existing: ApiChatConversation | undefined,
  incoming: ApiChatConversation
): ApiChatConversation {
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    id: incoming.id ?? existing.id,
    rfq_id: incoming.rfq_id ?? existing.rfq_id ?? null,
    inquiry_id: incoming.inquiry_id ?? existing.inquiry_id ?? null,
    rfq_title: incoming.rfq_title ?? existing.rfq_title ?? null,
    rfq_reference: incoming.rfq_reference ?? existing.rfq_reference ?? null,
    last_context: incoming.last_context ?? existing.last_context ?? null,
    buyer: mergeParticipant(existing.buyer, incoming.buyer),
    seller: mergeParticipant(existing.seller, incoming.seller),
    other_party: mergeParticipant(existing.other_party, incoming.other_party),
    buyer_id: incoming.buyer_id ?? existing.buyer_id ?? null,
    seller_id: incoming.seller_id ?? existing.seller_id ?? null,
    participants:
      incoming.participants && incoming.participants.length > 0
        ? incoming.participants
        : existing.participants,
    last_message: incoming.last_message ?? existing.last_message ?? null,
    last_message_at: incoming.last_message_at ?? existing.last_message_at ?? null,
    unread_count: incoming.unread_count ?? existing.unread_count ?? 0,
  };
}

export function normalizeUnreadSummary(raw: unknown): ChatUnreadSummary {
  const item = readRecord(raw) ?? {};
  const asBuyer = pickNumber(item.as_buyer) ?? undefined;
  const asSeller = pickNumber(item.as_seller) ?? undefined;
  const conversationsRaw = Array.isArray(item.conversations) ? item.conversations : [];
  const conversations = conversationsRaw
    .map(normalizeUnreadConversationSnap)
    .filter((c): c is ChatUnreadConversationSnap => c !== null);

  return {
    // Guide badge fields: total, as_buyer, as_seller
    total_unread:
      pickNumber(item.total) ??
      pickNumber(item.total_unread) ??
      pickNumber(item.unread_count) ??
      ((asBuyer ?? 0) + (asSeller ?? 0) || 0),
    as_buyer: asBuyer,
    as_seller: asSeller,
    conversations: conversations.length > 0 ? conversations : undefined,
    conversations_unread: pickNumber(item.conversations_unread) ?? undefined,
  };
}

function normalizeUnreadConversationSnap(raw: unknown): ChatUnreadConversationSnap | null {
  const item = readRecord(raw);
  if (!item) return null;
  const id = pickNumber(item.conversation_id) ?? pickNumber(item.id);
  if (id == null) return null;

  let lastMessage: string | null = null;
  if (typeof item.last_message === "string") {
    lastMessage = item.last_message.trim() || null;
  } else {
    const nested = readRecord(item.last_message);
    lastMessage =
      pickString(nested?.content) ??
      pickString(nested?.message) ??
      pickString(nested?.text) ??
      null;
  }

  return {
    conversation_id: id,
    unread_count: Math.max(0, pickNumber(item.unread_count) ?? 0),
    last_message_at: pickString(item.last_message_at),
    last_message: lastMessage,
    last_message_sender_id: pickNumber(item.last_message_sender_id),
  };
}

/**
 * Guide: merge socket unread_summary.conversations into REST-rich conversation meta.
 * Keeps unread_count, last_message preview, and last_message_at fresh without wiping identity.
 */
export function applyUnreadInboxSnapshot(
  existing: Record<number, ApiChatConversation>,
  summary: ChatUnreadSummary
): Record<number, ApiChatConversation> {
  const snaps = summary.conversations;
  if (!snaps?.length) return existing;

  const next = { ...existing };
  for (const snap of snaps) {
    const id = snap.conversation_id;
    const prev = next[id];
    next[id] = mergeConversationMeta(prev, {
      id,
      conversation_id: id,
      unread_count: snap.unread_count,
      last_message_at: snap.last_message_at ?? prev?.last_message_at ?? null,
      last_message: snap.last_message ?? prev?.last_message ?? null,
      last_message_sender_id:
        snap.last_message_sender_id ?? prev?.last_message_sender_id ?? null,
    });
  }
  return next;
}

/** Inbox order: newest last_message_at first (guide unread_summary sort). */
export function sortConversationsByLastMessage(
  rows: ApiChatConversation[]
): ApiChatConversation[] {
  return [...rows].sort((a, b) => {
    const ta = a.last_message_at ? Date.parse(a.last_message_at) : 0;
    const tb = b.last_message_at ? Date.parse(b.last_message_at) : 0;
    const na = Number.isFinite(ta) ? ta : 0;
    const nb = Number.isFinite(tb) ? tb : 0;
    return nb - na;
  });
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
