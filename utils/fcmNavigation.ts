/** FCM `data` map — all values are strings per backend guide. */
export type FcmPushData = Record<string, string | undefined>;

type Portal = "buyer" | "seller";

/**
 * Audience portal from TradeNexa_Backend `NOTIFICATION_TYPE_DEFAULT_ROLE`
 * + `resolveNotificationRoleCode` (constants/notification.js).
 *
 * Prefer explicit `role` from FCM/inbox when present — required for
 * `RFQ_STATUS_UPDATED` (buyers get admin status changes; sellers get
 * cancel/close/negotiation).
 *
 * Chat is dual-portal — callers should use `activeRole` for paths.
 */
export function recipientPortalForType(
  type: string,
  explicitRole?: string | null
): Portal {
  if (explicitRole === "buyer" || explicitRole === "seller") {
    return explicitRole;
  }

  switch ((type || "").toUpperCase()) {
    // Seller (NOTIFICATION_TYPE_DEFAULT_ROLE)
    case "INQUIRY_RECEIVED":
    case "QUOTATION_ACCEPTED":
    case "QUOTATION_REJECTED":
    case "PRODUCT_APPROVED":
    case "PRODUCT_REVISION_REQUIRED":
    case "PRODUCT_REJECTED":
    case "RFQ_RECEIVED":
    case "RFQ_QUOTATION_ACCEPTED":
    case "RFQ_QUOTATION_REJECTED":
    case "RFQ_STATUS_UPDATED":
    // Legacy / non-canonical aliases seen in older payloads
    case "RFQ_INVITED":
    case "RFQ_ASSIGNED":
    case "NEW_RFQ":
    case "RFQ_PUBLISHED":
      return "seller";

    // Buyer
    case "INQUIRY_REPLY":
    case "INQUIRY_REJECTED":
    case "QUOTATION_RECEIVED":
    case "QUOTATION_UPDATED":
    case "RFQ_NEW_QUOTATION":
    case "RFQ_QUOTATION_UPDATED":
      return "buyer";

    case "CHAT_MESSAGE":
      // Dual-portal; path resolution uses activeRole.
      return "buyer";

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

function isSellerSide(
  portal: Portal,
  activeRole?: Portal | null
): boolean {
  return portal === "seller" || activeRole === "seller";
}

/**
 * Ambiguous actions must NOT map to a one-sided type — that forces the wrong
 * portal when type is empty (e.g. OPEN_RFQ → RFQ_STATUS_UPDATED → seller).
 */
function actionToTypeHint(action: string): string {
  switch (action) {
    case "OPEN_CHAT":
      return "CHAT_MESSAGE";
    case "OPEN_PRODUCT":
      return "PRODUCT_APPROVED";
    default:
      return "";
  }
}

function resolveByTypeAndAction(
  data: FcmPushData,
  type: string,
  action: string,
  activeRole?: Portal | null
): string {
  const explicitRole =
    data.role === "buyer" || data.role === "seller" ? data.role : null;
  const portal = recipientPortalForType(
    type || actionToTypeHint(action),
    explicitRole
  );
  const sellerSide = isSellerSide(portal, activeRole);
  const ref = data.reference_id?.trim() || "";

  // Chat: always follow active portal role (buyer ↔ seller switch).
  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    const cid = data.conversation_id?.trim() || ref;
    const chatPortal = activeRole === "seller" ? "seller" : "buyer";
    const base = chatPortal === "seller" ? "/seller/chats" : "/buyer/chats";
    return cid ? `${base}?conversation=${encodeURIComponent(cid)}` : base;
  }

  if (
    type === "INQUIRY_RECEIVED" ||
    (action === "OPEN_INQUIRY" && sellerSide && type !== "INQUIRY_REJECTED" && type !== "INQUIRY_REPLY")
  ) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/seller/inquiries/${iid}` : "/seller/inquiries";
  }

  if (
    type === "INQUIRY_REJECTED" ||
    type === "INQUIRY_REPLY" ||
    (action === "OPEN_INQUIRY" && !sellerSide)
  ) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/buyer/product-inquiries/${iid}` : "/buyer/product-inquiries";
  }

  if (
    type === "QUOTATION_RECEIVED" ||
    type === "QUOTATION_UPDATED" ||
    (action === "OPEN_QUOTATION" && !sellerSide)
  ) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/buyer/product-inquiries/${iid}` : "/buyer/product-inquiries";
  }

  if (
    type === "QUOTATION_ACCEPTED" ||
    type === "QUOTATION_REJECTED" ||
    (action === "OPEN_QUOTATION" && sellerSide)
  ) {
    const iid = data.inquiry_id?.trim() || ref;
    return iid ? `/seller/inquiries/${iid}` : "/seller/inquiries";
  }

  if (
    type === "PRODUCT_APPROVED" ||
    type === "PRODUCT_REVISION_REQUIRED" ||
    type === "PRODUCT_REJECTED" ||
    action === "OPEN_PRODUCT"
  ) {
    const pid = data.product_id?.trim() || ref;
    return pid ? `/seller/product/${pid}` : "/seller/catalog";
  }

  if (type === "RFQ_NEW_QUOTATION" || type === "RFQ_QUOTATION_UPDATED") {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }

  if (type === "RFQ_QUOTATION_ACCEPTED" || type === "RFQ_QUOTATION_REJECTED") {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? sellerRfqLeadPath(rid) : "/seller/leads";
  }

  // Seller invited / RFQ received — backend type is RFQ_RECEIVED.
  if (
    type === "RFQ_RECEIVED" ||
    type === "RFQ_INVITED" ||
    type === "RFQ_ASSIGNED" ||
    type === "NEW_RFQ" ||
    type === "RFQ_PUBLISHED"
  ) {
    const rid = data.rfq_id?.trim() || ref;
    return rid ? sellerRfqLeadPath(rid) : "/seller/leads";
  }

  if (action === "OPEN_RFQ") {
    const rid = data.rfq_id?.trim() || ref;
    if (!rid) return sellerSide ? "/seller/leads" : "/buyer/inquiries";
    return sellerSide ? sellerRfqLeadPath(rid) : buyerRfqPath(rid);
  }

  if (type === "RFQ_STATUS_UPDATED") {
    const rid = data.rfq_id?.trim() || ref;
    if (sellerSide) {
      return rid ? sellerRfqLeadPath(rid) : "/seller/leads";
    }
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }

  // Fallback: “New RFQ” invite copy when type is missing/unknown.
  const title = (data.title || "").toUpperCase();
  const body = (data.body || "").toUpperCase();
  const looksLikeNewRfqInvite =
    title.includes("NEW RFQ") || body.includes("INVITED YOU TO QUOTE");
  if (looksLikeNewRfqInvite) {
    const rid = data.rfq_id?.trim() || ref;
    return rid
      ? sellerRfqLeadPath(rid)
      : sellerSide
        ? "/seller/leads"
        : "/buyer/inquiries";
  }

  return sellerSide ? "/seller/dashboard" : "/buyer/notifications";
}

/**
 * Resolve in-app path from FCM `type` / `click_action` + ids.
 * `activeRole` is used for chat and for role-ambiguous OPEN_* actions.
 */
export function resolveFcmNavigationPath(
  data: FcmPushData,
  activeRole?: Portal | null
): string {
  const type = (data.type || "").toUpperCase();
  // Some backends put a site URL in click_action — ignore those.
  const rawAction = (data.click_action || "").trim();
  const action =
    /^https?:\/\//i.test(rawAction) || rawAction === "/"
      ? ""
      : rawAction.toUpperCase();
  return resolveByTypeAndAction(data, type, action, activeRole);
}

/**
 * Plain JS source embedded in firebase-messaging-sw.js (no imports / localStorage).
 * Must stay aligned with resolveFcmNavigationPath above.
 */
export function buildFcmNavigationSwHelpersSource(): string {
  return `
function recipientPortalForType(type, explicitRole) {
  if (explicitRole === "buyer" || explicitRole === "seller") return explicitRole;
  switch ((type || "").toUpperCase()) {
    case "INQUIRY_RECEIVED":
    case "QUOTATION_ACCEPTED":
    case "QUOTATION_REJECTED":
    case "PRODUCT_APPROVED":
    case "PRODUCT_REVISION_REQUIRED":
    case "PRODUCT_REJECTED":
    case "RFQ_RECEIVED":
    case "RFQ_QUOTATION_ACCEPTED":
    case "RFQ_QUOTATION_REJECTED":
    case "RFQ_STATUS_UPDATED":
    case "RFQ_INVITED":
    case "RFQ_ASSIGNED":
    case "NEW_RFQ":
    case "RFQ_PUBLISHED":
      return "seller";
    case "INQUIRY_REPLY":
    case "INQUIRY_REJECTED":
    case "QUOTATION_RECEIVED":
    case "QUOTATION_UPDATED":
    case "RFQ_NEW_QUOTATION":
    case "RFQ_QUOTATION_UPDATED":
      return "buyer";
    case "CHAT_MESSAGE":
      return "buyer";
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

function isSellerSide(portal, activeRole) {
  return portal === "seller" || activeRole === "seller";
}

function actionToTypeHint(action) {
  switch (action) {
    case "OPEN_CHAT":
      return "CHAT_MESSAGE";
    case "OPEN_PRODUCT":
      return "PRODUCT_APPROVED";
    default:
      return "";
  }
}

function resolveByTypeAndAction(data, type, action, activeRole) {
  var explicitRole = data.role === "buyer" || data.role === "seller" ? data.role : null;
  var portal = recipientPortalForType(type || actionToTypeHint(action), explicitRole);
  var sellerSide = isSellerSide(portal, activeRole);
  var ref = (data.reference_id || "").trim();

  if (type === "CHAT_MESSAGE" || action === "OPEN_CHAT") {
    var cid = (data.conversation_id || ref).trim();
    var chatPortal = activeRole === "seller" ? "seller" : "buyer";
    var base = chatPortal === "seller" ? "/seller/chats" : "/buyer/chats";
    return cid ? base + "?conversation=" + encodeURIComponent(cid) : base;
  }
  if (
    type === "INQUIRY_RECEIVED" ||
    (action === "OPEN_INQUIRY" && sellerSide && type !== "INQUIRY_REJECTED" && type !== "INQUIRY_REPLY")
  ) {
    var iid = (data.inquiry_id || ref).trim();
    return iid ? "/seller/inquiries/" + iid : "/seller/inquiries";
  }
  if (type === "INQUIRY_REJECTED" || type === "INQUIRY_REPLY" || (action === "OPEN_INQUIRY" && !sellerSide)) {
    var iid2 = (data.inquiry_id || ref).trim();
    return iid2 ? "/buyer/product-inquiries/" + iid2 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_RECEIVED" || type === "QUOTATION_UPDATED" || (action === "OPEN_QUOTATION" && !sellerSide)) {
    var iid3 = (data.inquiry_id || ref).trim();
    return iid3 ? "/buyer/product-inquiries/" + iid3 : "/buyer/product-inquiries";
  }
  if (type === "QUOTATION_ACCEPTED" || type === "QUOTATION_REJECTED" || (action === "OPEN_QUOTATION" && sellerSide)) {
    var iid4 = (data.inquiry_id || ref).trim();
    return iid4 ? "/seller/inquiries/" + iid4 : "/seller/inquiries";
  }
  if (
    type === "PRODUCT_APPROVED" ||
    type === "PRODUCT_REVISION_REQUIRED" ||
    type === "PRODUCT_REJECTED" ||
    action === "OPEN_PRODUCT"
  ) {
    var pid = (data.product_id || ref).trim();
    return pid ? "/seller/product/" + pid : "/seller/catalog";
  }
  if (type === "RFQ_NEW_QUOTATION" || type === "RFQ_QUOTATION_UPDATED") {
    var rid = (data.rfq_id || ref).trim();
    return rid ? buyerRfqPath(rid) : "/buyer/inquiries";
  }
  if (type === "RFQ_QUOTATION_ACCEPTED" || type === "RFQ_QUOTATION_REJECTED") {
    var rid2 = (data.rfq_id || ref).trim();
    return rid2 ? sellerRfqLeadPath(rid2) : "/seller/leads";
  }
  if (
    type === "RFQ_RECEIVED" ||
    type === "RFQ_INVITED" ||
    type === "RFQ_ASSIGNED" ||
    type === "NEW_RFQ" ||
    type === "RFQ_PUBLISHED"
  ) {
    var ridInvite = (data.rfq_id || ref).trim();
    return ridInvite ? sellerRfqLeadPath(ridInvite) : "/seller/leads";
  }
  if (action === "OPEN_RFQ") {
    var ridOpen = (data.rfq_id || ref).trim();
    if (!ridOpen) return sellerSide ? "/seller/leads" : "/buyer/inquiries";
    return sellerSide ? sellerRfqLeadPath(ridOpen) : buyerRfqPath(ridOpen);
  }
  if (type === "RFQ_STATUS_UPDATED") {
    var rid3 = (data.rfq_id || ref).trim();
    if (sellerSide) return rid3 ? sellerRfqLeadPath(rid3) : "/seller/leads";
    return rid3 ? buyerRfqPath(rid3) : "/buyer/inquiries";
  }
  var title = (data.title || "").toUpperCase();
  var body = (data.body || "").toUpperCase();
  var looksLikeNewRfqInvite =
    title.indexOf("NEW RFQ") >= 0 || body.indexOf("INVITED YOU TO QUOTE") >= 0;
  if (looksLikeNewRfqInvite) {
    var ridTitle = (data.rfq_id || ref).trim();
    return ridTitle ? sellerRfqLeadPath(ridTitle) : sellerSide ? "/seller/leads" : "/buyer/inquiries";
  }
  return sellerSide ? "/seller/dashboard" : "/buyer/notifications";
}

function resolveFcmNavigationPath(data, activeRole) {
  data = data || {};
  var type = (data.type || "").toUpperCase();
  var rawAction = (data.click_action || "").trim();
  var action =
    rawAction.indexOf("http://") === 0 ||
    rawAction.indexOf("https://") === 0 ||
    rawAction === "/"
      ? ""
      : rawAction.toUpperCase();
  return resolveByTypeAndAction(data, type, action, activeRole);
}
`;
}
