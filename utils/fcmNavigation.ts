import type { ActiveRole } from "@/utils/roleNavigation";

/** FCM `data` map — all values are strings per backend guide. */
export type FcmPushData = Record<string, string | undefined>;

/**
 * Recipient portal from Push_Notifications_Frontend_Guide §4 / §10.
 * Ambiguous types (CHAT_MESSAGE, RFQ_STATUS_UPDATED) use `activeRole`.
 */
export function recipientPortalForType(
  type: string,
  activeRole: ActiveRole
): ActiveRole {
  switch ((type || "").toUpperCase()) {
    case "INQUIRY_RECEIVED":
    case "QUOTATION_ACCEPTED":
    case "QUOTATION_REJECTED":
    case "PRODUCT_APPROVED":
    case "PRODUCT_REVISION_REQUIRED":
    case "PRODUCT_REJECTED":
    case "RFQ_QUOTATION_ACCEPTED":
    case "RFQ_QUOTATION_REJECTED":
      return "seller";
    case "INQUIRY_REJECTED":
    case "QUOTATION_RECEIVED":
    case "QUOTATION_UPDATED":
    case "RFQ_NEW_QUOTATION":
    case "RFQ_QUOTATION_UPDATED":
      return "buyer";
    case "CHAT_MESSAGE":
    case "RFQ_STATUS_UPDATED":
    default:
      return activeRole === "seller" ? "seller" : "buyer";
  }
}

/** Only trust click_url when it already targets a portal path. */
export function parseRoleScopedClickUrl(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "/") return null;

  try {
    const path = trimmed.startsWith("http")
      ? new URL(trimmed).pathname + new URL(trimmed).search
      : trimmed.startsWith("/")
        ? trimmed
        : null;
    if (!path) return null;
    if (
      path === "/buyer" ||
      path.startsWith("/buyer/") ||
      path === "/seller" ||
      path.startsWith("/seller/")
    ) {
      return path;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Resolve in-app path from FCM data (guide §10), role-aware for web portals.
 * Prefer type + ids over generic backend click_url (/chats/41, /inquiries/12).
 */
export function resolveFcmNavigationPath(
  data: FcmPushData,
  activeRole: ActiveRole = "buyer"
): string {
  const fromClick = parseRoleScopedClickUrl(data.click_url || data.url);
  if (fromClick) return fromClick;

  const type = (data.type || "").toUpperCase();
  const action = (data.click_action || "").toUpperCase();
  const portal = recipientPortalForType(type || actionToTypeHint(action), activeRole);
  const ref = data.reference_id?.trim() || "";

  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    const cid = data.conversation_id?.trim() || ref;
    const base = portal === "seller" ? "/seller/chats" : "/buyer/chats";
    return cid ? `${base}?conversation=${encodeURIComponent(cid)}` : base;
  }

  if (type === "INQUIRY_RECEIVED" || (action === "OPEN_INQUIRY" && portal === "seller")) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/seller/inquiries/${iid}` : "/seller/inquiries";
  }

  if (type === "INQUIRY_REJECTED" || (action === "OPEN_INQUIRY" && portal === "buyer")) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/buyer/product-inquiries/${iid}` : "/buyer/product-inquiries";
  }

  if (
    type === "QUOTATION_RECEIVED" ||
    type === "QUOTATION_UPDATED" ||
    (action === "OPEN_QUOTATION" && portal === "buyer")
  ) {
    const iid = data.inquiry_id?.trim();
    return iid ? `/buyer/product-inquiries/${iid}` : "/buyer/product-inquiries";
  }

  if (
    type === "QUOTATION_ACCEPTED" ||
    type === "QUOTATION_REJECTED" ||
    (action === "OPEN_QUOTATION" && portal === "seller")
  ) {
    const iid = data.inquiry_id?.trim();
    return iid ? `/seller/inquiries/${iid}` : "/seller/inquiries";
  }

  if (type === "PRODUCT_APPROVED") {
    const pid = data.product_id?.trim() || ref;
    return pid ? `/seller/product/${pid}` : "/seller/catalog";
  }

  if (
    type === "PRODUCT_REVISION_REQUIRED" ||
    type === "PRODUCT_REJECTED" ||
    action === "OPEN_PRODUCT"
  ) {
    const pid = data.product_id?.trim() || ref;
    return pid ? `/seller/edit-product/${pid}` : "/seller/catalog";
  }

  if (
    type === "RFQ_NEW_QUOTATION" ||
    type === "RFQ_QUOTATION_UPDATED" ||
    (action === "OPEN_RFQ" && portal === "buyer")
  ) {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? `/buyer/rfq/${rid}` : "/buyer/inquiries";
  }

  if (
    type === "RFQ_QUOTATION_ACCEPTED" ||
    type === "RFQ_QUOTATION_REJECTED" ||
    (action === "OPEN_RFQ" && portal === "seller")
  ) {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? `/seller/lead/${rid}` : "/seller/leads";
  }

  if (type === "RFQ_STATUS_UPDATED") {
    const rid = data.rfq_id?.trim() || ref;
    if (portal === "seller") {
      return rid ? `/seller/lead/${rid}` : "/seller/leads";
    }
    return rid ? `/buyer/rfq/${rid}` : "/buyer/inquiries";
  }

  return portal === "seller" ? "/seller/dashboard" : "/buyer/notifications";
}

function actionToTypeHint(action: string): string {
  switch (action) {
    case "OPEN_CHAT":
      return "CHAT_MESSAGE";
    case "OPEN_INQUIRY":
      return "INQUIRY_RECEIVED";
    case "OPEN_QUOTATION":
      return "QUOTATION_RECEIVED";
    case "OPEN_PRODUCT":
      return "PRODUCT_APPROVED";
    case "OPEN_RFQ":
      return "RFQ_STATUS_UPDATED";
    default:
      return "";
  }
}

/**
 * Plain JS source embedded in firebase-messaging-sw.js (no imports / localStorage).
 * Must stay aligned with resolveFcmNavigationPath above.
 */
export function buildFcmNavigationSwHelpersSource(): string {
  return `
function recipientPortalForType(type, activeRole) {
  switch ((type || "").toUpperCase()) {
    case "INQUIRY_RECEIVED":
    case "QUOTATION_ACCEPTED":
    case "QUOTATION_REJECTED":
    case "PRODUCT_APPROVED":
    case "PRODUCT_REVISION_REQUIRED":
    case "PRODUCT_REJECTED":
    case "RFQ_QUOTATION_ACCEPTED":
    case "RFQ_QUOTATION_REJECTED":
      return "seller";
    case "INQUIRY_REJECTED":
    case "QUOTATION_RECEIVED":
    case "QUOTATION_UPDATED":
    case "RFQ_NEW_QUOTATION":
    case "RFQ_QUOTATION_UPDATED":
      return "buyer";
    default:
      return activeRole === "seller" ? "seller" : "buyer";
  }
}

function parseRoleScopedClickUrl(raw) {
  var trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed || trimmed === "/") return null;
  try {
    var path = trimmed.indexOf("http") === 0
      ? (new URL(trimmed).pathname + new URL(trimmed).search)
      : (trimmed.charAt(0) === "/" ? trimmed : null);
    if (!path) return null;
    if (path === "/buyer" || path.indexOf("/buyer/") === 0 || path === "/seller" || path.indexOf("/seller/") === 0) {
      return path;
    }
  } catch (e) {}
  return null;
}

function resolveFcmNavigationPath(data, activeRole) {
  data = data || {};
  var fromClick = parseRoleScopedClickUrl(data.click_url || data.url);
  if (fromClick) return fromClick;

  var type = (data.type || "").toUpperCase();
  var action = (data.click_action || "").toUpperCase();
  var portal = recipientPortalForType(type, activeRole);
  var ref = (data.reference_id || "").trim();

  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    var cid = (data.conversation_id || ref).trim();
    var base = portal === "seller" ? "/seller/chats" : "/buyer/chats";
    return cid ? base + "?conversation=" + encodeURIComponent(cid) : base;
  }
  if (type === "INQUIRY_RECEIVED") {
    var iid = (data.inquiry_id || ref).trim();
    return iid ? "/seller/inquiries/" + iid : "/seller/inquiries";
  }
  if (type === "INQUIRY_REJECTED") {
    var iid2 = (data.inquiry_id || ref).trim();
    return iid2 ? "/buyer/product-inquiries/" + iid2 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_RECEIVED" || type === "QUOTATION_UPDATED") {
    var iid3 = (data.inquiry_id || "").trim();
    return iid3 ? "/buyer/product-inquiries/" + iid3 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_ACCEPTED" || type === "QUOTATION_REJECTED") {
    var iid4 = (data.inquiry_id || "").trim();
    return iid4 ? "/seller/inquiries/" + iid4 : "/seller/inquiries";
  }
  if (type === "PRODUCT_APPROVED") {
    var pid = (data.product_id || ref).trim();
    return pid ? "/seller/product/" + pid : "/seller/catalog";
  }
  if (type === "PRODUCT_REVISION_REQUIRED" || type === "PRODUCT_REJECTED" || action === "OPEN_PRODUCT") {
    var pid2 = (data.product_id || ref).trim();
    return pid2 ? "/seller/edit-product/" + pid2 : "/seller/catalog";
  }
  if (type === "RFQ_NEW_QUOTATION" || type === "RFQ_QUOTATION_UPDATED") {
    var rid = (data.rfq_id || ref).trim();
    return rid ? "/buyer/rfq/" + rid : "/buyer/inquiries";
  }
  if (type === "RFQ_QUOTATION_ACCEPTED" || type === "RFQ_QUOTATION_REJECTED") {
    var rid2 = (data.rfq_id || ref).trim();
    return rid2 ? "/seller/lead/" + rid2 : "/seller/leads";
  }
  if (type === "RFQ_STATUS_UPDATED" || action === "OPEN_RFQ") {
    var rid3 = (data.rfq_id || ref).trim();
    if (portal === "seller") return rid3 ? "/seller/lead/" + rid3 : "/seller/leads";
    return rid3 ? "/buyer/rfq/" + rid3 : "/buyer/inquiries";
  }
  return portal === "seller" ? "/seller/dashboard" : "/buyer/notifications";
}
`;
}
