/** FCM `data` map — all values are strings per backend guide. */
export type FcmPushData = Record<string, string | undefined>;

type Portal = "buyer" | "seller";

/**
 * Fixed recipient portal from Push_Notifications_Frontend_Guide §4.
 * Chat is excluded — use `activeRole` for CHAT_MESSAGE only.
 */
export function recipientPortalForType(type: string, status?: string | null): Portal {
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
    case "RFQ_STATUS_UPDATED":
      return isSellerRfqUpdateStatus(status) ? "seller" : "buyer";
    default:
      return "buyer";
  }
}

function sellerRfqLeadPath(rfqId: string): string {
  return `/seller/lead/${rfqId}?from=feed`;
}

function buyerRfqPath(rfqId: string): string {
  return `/buyer/rfq/${rfqId}`;
}

/** RFQ/quotation status that means the seller should open lead detail (Updated / revision). */
function isSellerRfqUpdateStatus(status?: string | null): boolean {
  const value = (status ?? "").toUpperCase();
  return (
    value.includes("UPDATE") ||
    value.includes("REVISION") ||
    value.includes("NEGOTIAT")
  );
}

function resolveByTypeAndAction(
  data: FcmPushData,
  type: string,
  action: string,
  activeRole?: Portal | null
): string {
  const status = data.status?.trim() || "";
  const portal = recipientPortalForType(type || actionToTypeHint(action), status);
  const ref = data.reference_id?.trim() || "";

  // Chat only: use tradenexa_active_role (buyer ↔ seller switch).
  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    const cid = data.conversation_id?.trim() || ref;
    const chatPortal = activeRole === "seller" ? "seller" : "buyer";
    const base = chatPortal === "seller" ? "/seller/chats" : "/buyer/chats";
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

  if (type === "RFQ_NEW_QUOTATION" || type === "RFQ_QUOTATION_UPDATED") {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }

  if (type === "RFQ_QUOTATION_ACCEPTED" || type === "RFQ_QUOTATION_REJECTED") {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? sellerRfqLeadPath(rid) : "/seller/leads";
  }

  if (action === "OPEN_RFQ") {
    const rid = data.rfq_id?.trim() || ref;
    if (!rid) return portal === "seller" ? "/seller/leads" : "/buyer/inquiries";
    return portal === "seller" ? sellerRfqLeadPath(rid) : buyerRfqPath(rid);
  }

  if (type === "RFQ_STATUS_UPDATED") {
    const rid = data.rfq_id?.trim() || ref;
    if (portal === "seller") {
      return rid ? sellerRfqLeadPath(rid) : "/seller/leads";
    }
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }

  return portal === "seller" ? "/seller/dashboard" : "/buyer/notifications";
}

/**
 * Resolve in-app path from FCM `type` / `click_action` + ids.
 * `activeRole` is used only for CHAT_MESSAGE / OPEN_CHAT.
 */
export function resolveFcmNavigationPath(
  data: FcmPushData,
  activeRole?: Portal | null
): string {
  const type = (data.type || "").toUpperCase();
  const action = (data.click_action || "").toUpperCase();
  return resolveByTypeAndAction(data, type, action, activeRole);
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
function recipientPortalForType(type, status) {
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
    case "RFQ_STATUS_UPDATED":
      return isSellerRfqUpdateStatus(status) ? "seller" : "buyer";
    default:
      return "buyer";
  }
}

function sellerRfqLeadPath(rfqId) {
  return "/seller/lead/" + rfqId + "?from=feed";
}

function buyerRfqPath(rfqId) {
  return "/buyer/rfq/" + rfqId;
}

function isSellerRfqUpdateStatus(status) {
  var value = (status || "").toUpperCase();
  return value.indexOf("UPDATE") >= 0 || value.indexOf("REVISION") >= 0 || value.indexOf("NEGOTIAT") >= 0;
}

function resolveByTypeAndAction(data, type, action, activeRole) {
  var status = (data.status || "").trim();
  var portal = recipientPortalForType(type, status);
  var ref = (data.reference_id || "").trim();

  // Chat only: use active role (tradenexa_active_role mirrored into SW).
  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    var cid = (data.conversation_id || ref).trim();
    var chatPortal = activeRole === "seller" ? "seller" : "buyer";
    var base = chatPortal === "seller" ? "/seller/chats" : "/buyer/chats";
    return cid ? base + "?conversation=" + encodeURIComponent(cid) : base;
  }
  if (type === "INQUIRY_RECEIVED" || (action === "OPEN_INQUIRY" && portal === "seller")) {
    var iid = (data.inquiry_id || ref).trim();
    return iid ? "/seller/inquiries/" + iid : "/seller/inquiries";
  }
  if (type === "INQUIRY_REJECTED" || (action === "OPEN_INQUIRY" && portal === "buyer")) {
    var iid2 = (data.inquiry_id || ref).trim();
    return iid2 ? "/buyer/product-inquiries/" + iid2 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_RECEIVED" || type === "QUOTATION_UPDATED" || (action === "OPEN_QUOTATION" && portal === "buyer")) {
    var iid3 = (data.inquiry_id || "").trim();
    return iid3 ? "/buyer/product-inquiries/" + iid3 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_ACCEPTED" || type === "QUOTATION_REJECTED" || (action === "OPEN_QUOTATION" && portal === "seller")) {
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
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }
  if (type === "RFQ_QUOTATION_ACCEPTED" || type === "RFQ_QUOTATION_REJECTED") {
    var rid2 = (data.rfq_id || ref).trim();
    return rid2 ? sellerRfqLeadPath(rid2) : "/seller/leads";
  }
  if (action === "OPEN_RFQ") {
    var ridOpen = (data.rfq_id || ref).trim();
    if (!ridOpen) return portal === "seller" ? "/seller/leads" : "/buyer/inquiries";
    return portal === "seller" ? sellerRfqLeadPath(ridOpen) : buyerRfqPath(ridOpen);
  }
  if (type === "RFQ_STATUS_UPDATED") {
    var rid3 = (data.rfq_id || ref).trim();
    if (portal === "seller") return rid3 ? sellerRfqLeadPath(rid3) : "/seller/leads";
    return rid3 ? buyerRfqPath(rid3) : "/buyer/inquiries";
  }
  return portal === "seller" ? "/seller/dashboard" : "/buyer/notifications";
}

function resolveFcmNavigationPath(data, activeRole) {
  data = data || {};
  var type = (data.type || "").toUpperCase();
  var action = (data.click_action || "").toUpperCase();
  return resolveByTypeAndAction(data, type, action, activeRole);
}
`;
}
