"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  IndianRupee,
  MessageSquare,
  Package,
  Send,
} from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { fetchProductById } from "@/services/catalogService";
import {
  createInquiry,
  findMyInquiryForProduct,
  getInquiryErrorMessage,
} from "@/services/inquiryService";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import {
  formatPrice,
  getInitials,
  productGradient,
  resolveImageUrl,
} from "@/utils/catalogHelpers";
import { isActiveInquiryStatus } from "@/utils/inquiryHelpers";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { toApiDateTime } from "@/utils/dateFormat";
import type { ApiProductDetail } from "@/types/catalog";
import type { ApiInquiry } from "@/types/inquiry";

type FormErrors = Partial<Record<"quantity" | "message" | "expected_price", string>>;

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      {required ? <span className="ml-0.5 text-error">*</span> : null}
    </label>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex gap-4 p-4 sm:p-5">
          <div className="h-24 w-24 shrink-0 rounded-xl bg-primary-soft sm:h-28 sm:w-28" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-3 w-24 rounded bg-primary-soft" />
            <div className="h-5 w-3/4 rounded bg-primary-soft" />
            <div className="h-4 w-1/2 rounded bg-primary-soft" />
          </div>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="h-4 w-40 rounded bg-primary-soft" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-11 rounded-lg bg-primary-soft" />
          <div className="h-11 rounded-lg bg-primary-soft" />
        </div>
        <div className="h-28 rounded-lg bg-primary-soft" />
        <div className="h-12 rounded-xl bg-primary-soft" />
      </div>
    </div>
  );
}

export default function SendInquiryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const productId = Number(searchParams.get("product"));

  const [product, setProduct] = useState<ApiProductDetail | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(Boolean(productId));
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [requiredBefore, setRequiredBefore] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [openingExisting, setOpeningExisting] = useState(false);
  /** Active inquiry blocks a new send; rejected/cancelled/closed allows resubmit. */
  const [activeInquiry, setActiveInquiry] = useState<ApiInquiry | null>(null);
  const [checkingInquiry, setCheckingInquiry] = useState(false);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setLoadingProduct(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingProduct(true);
      try {
        const data = await fetchProductById(productId);
        if (cancelled) return;
        setProduct(data);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Lock unit from the loaded product (quantity stays empty for the buyer to fill).
  useEffect(() => {
    if (!product) return;
    const productUnit = product.pricing?.unit?.trim();
    if (productUnit) {
      setUnit(productUnit);
    }
  }, [product]);

  useEffect(() => {
    if (!productId || Number.isNaN(productId) || !product) {
      setActiveInquiry(null);
      setCheckingInquiry(false);
      return;
    }
    if (product.user_actions?.is_inquiry_sent !== true) {
      setActiveInquiry(null);
      setCheckingInquiry(false);
      return;
    }
    let cancelled = false;
    setCheckingInquiry(true);
    void (async () => {
      try {
        const existing = await findMyInquiryForProduct(productId);
        if (cancelled) return;
        if (existing && isActiveInquiryStatus(existing.status)) {
          setActiveInquiry(existing);
        } else {
          setActiveInquiry(null);
        }
      } catch {
        if (!cancelled) setActiveInquiry(null);
      } finally {
        if (!cancelled) setCheckingInquiry(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, product]);

  const acceptInquiry =
    product?.marketplace?.accept_inquiry !== false && product?.accept_inquiry !== false;
  const canContact = product?.user_actions?.can_contact_seller !== false;
  const alreadySent = activeInquiry != null;
  const formDisabled = alreadySent || !acceptInquiry || !canContact || checkingInquiry;

  const backHref = useMemo(() => {
    if (productId) return `/buyer/product/${productId}`;
    return "/buyer/product-inquiries";
  }, [productId]);

  const thumb = resolveImageUrl(product?.images?.thumbnail);
  const sellerName = product?.seller?.company?.name || "Seller";
  const productName = product?.basic_details?.name || "Product";
  const gradient = productGradient(productId || 0);
  const messageLen = message.trim().length;

  async function openExistingChat() {
    if (!productId) return;
    setOpeningExisting(true);
    try {
      const existing =
        activeInquiry ??
        (await findMyInquiryForProduct(productId, { activeOnly: true }));
      if (!existing) {
        // Prior inquiry was rejected/cancelled — allow a new send instead of chat.
        return;
      }
      router.replace(`/buyer/product-inquiries/${existing.id}?chat=1`);
    } catch (err) {
      showErrorToast(getInquiryErrorMessage(err, "Could not open inquiry chat"));
    } finally {
      setOpeningExisting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAuthenticated) {
      showErrorToast("Please sign in to send an inquiry.");
      router.push("/");
      return;
    }
    if (!productId || Number.isNaN(productId)) {
      showErrorToast("Select a product before sending an inquiry.");
      return;
    }
    if (alreadySent) {
      void openExistingChat();
      return;
    }
    if (!acceptInquiry || !canContact) {
      showErrorToast("This product is not accepting inquiries right now.");
      return;
    }

    const nextErrors: FormErrors = {};
    const qty = Number(quantity);
    if (!quantity.trim() || !Number.isFinite(qty) || qty < 1) {
      nextErrors.quantity = "Enter a quantity of at least 1";
    }
    const msg = message.trim();
    if (msg.length < 10) {
      nextErrors.message = "Message must be at least 10 characters";
    } else if (msg.length > 2000) {
      nextErrors.message = "Message must be under 2000 characters";
    }
    if (
      expectedPrice.trim() &&
      (Number.isNaN(Number(expectedPrice)) || Number(expectedPrice) < 0)
    ) {
      nextErrors.expected_price = "Enter a valid expected price";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const submitUnit = unit.trim() || product?.pricing?.unit?.trim() || "";
      const inquiry = await createInquiry({
        product_id: productId,
        quantity: qty,
        message: msg,
        ...(submitUnit ? { unit: submitUnit } : {}),
        ...(expectedPrice.trim() ? { expected_price: Number(expectedPrice) } : {}),
        ...(product?.pricing?.currency ? { currency: product.pricing.currency } : {}),
        ...(requiredBefore
          ? { required_before: toApiDateTime(requiredBefore) }
          : {}),
      });

      showSuccessToast("Inquiry sent — opening chat");
      router.replace(`/buyer/product-inquiries/${inquiry.id}?chat=1`);
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      setErrors({
        quantity: fieldErrors.quantity,
        message: fieldErrors.message,
        expected_price: fieldErrors.expected_price,
      });
      showErrorToast(
        formatApiValidationSummary(
          err,
          getInquiryErrorMessage(err, "Could not send inquiry")
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-5 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-2 h-48 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft)_0%,_transparent_70%)] opacity-80"
      />

      <div className="relative">
        <PortalBackLink href={backHref} label="Back to product" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Product inquiry
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Tell the seller what you need
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-fg">
            Share quantity and details — we&apos;ll open a chat thread with the supplier right
            after you send.
          </p>
        </motion.div>

        {loadingProduct ? (
          <LoadingSkeleton />
        ) : !productId ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-fg" />
            <p className="mt-3 text-sm font-medium text-foreground">No product selected</p>
            <p className="mt-1 text-sm text-muted-fg">
              Open a product page and tap Send Inquiry to start.
            </p>
            <Link href="/buyer/search" className="mt-5 inline-block">
              <Button variant="primary">Browse products</Button>
            </Link>
          </div>
        ) : !product ? (
          <div className="rounded-2xl border border-error/20 bg-error-soft px-6 py-10 text-center">
            <p className="text-sm font-medium text-error">Product not found</p>
            <Link href="/buyer/search" className="mt-4 inline-block">
              <Button variant="secondary">Back to search</Button>
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* Product anchor */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
              <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                <div
                  className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28 ${
                    thumb ? "bg-muted" : gradient
                  }`}
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={productName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/80">
                      {productName.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-muted-fg">
                    {[
                      product.basic_details.category?.name,
                      product.basic_details.subcategory?.name,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Marketplace product"}
                  </p>
                  <h2 className="mt-0.5 line-clamp-2 text-base font-semibold text-foreground sm:text-lg">
                    {productName}
                  </h2>
                  <p className="mt-1.5 text-lg font-bold text-primary">
                    {formatPrice(product.pricing.price, product.pricing.currency)}
                    <span className="ml-1 text-xs font-medium text-muted-fg">
                      / {product.pricing.unit}
                    </span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-soft text-[9px] font-bold text-primary">
                        {getInitials(sellerName)}
                      </span>
                      {sellerName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">
                      <Package className="h-3 w-3" aria-hidden />
                      MOQ {product.pricing.minimum_order_quantity} {product.pricing.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {checkingInquiry ? (
              <div className="flex justify-center rounded-2xl border border-border bg-card py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : alreadySent ? (
              <div className="rounded-2xl border border-primary/20 bg-primary-soft/60 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Inquiry already sent</p>
                    <p className="mt-1 text-sm text-muted-fg">
                      You already started a conversation about this product. Continue in chat
                      or view it under Inquiries.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        loading={openingExisting}
                        onClick={() => void openExistingChat()}
                      >
                        Continue chat
                      </Button>
                      <Link href="/buyer/product-inquiries">
                        <Button type="button" variant="secondary">
                          View inquiries
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
              >
                <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Send className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Your requirement</p>
                    <p className="text-xs text-muted-fg">Seller replies in the shared chat</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_7.5rem]">
                    <div>
                      <FieldLabel htmlFor="inquiry-qty" required>
                        Quantity required
                      </FieldLabel>
                      <input
                        id="inquiry-qty"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);
                          setErrors((prev) => ({ ...prev, quantity: undefined }));
                        }}
                        type="number"
                        min={1}
                        placeholder="e.g. 500"
                        className="input-base"
                        disabled={formDisabled}
                      />
                      {errors.quantity ? (
                        <p className="mt-1 text-xs text-error">{errors.quantity}</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-fg">
                          Minimum order is {product.pricing.minimum_order_quantity}{" "}
                          {product.pricing.unit}
                        </p>
                      )}
                    </div>
                    <div>
                      <FieldLabel htmlFor="inquiry-unit">Unit</FieldLabel>
                      <input
                        id="inquiry-unit"
                        value={unit || product.pricing.unit || ""}
                        readOnly
                        tabIndex={-1}
                        placeholder="Unit"
                        className="input-base cursor-default bg-muted text-muted-fg"
                        aria-readonly="true"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="inquiry-price">Expected price</FieldLabel>
                      <div className="relative">
                        <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-fg" />
                        <input
                          id="inquiry-price"
                          value={expectedPrice}
                          onChange={(e) => {
                            setExpectedPrice(e.target.value);
                            setErrors((prev) => ({ ...prev, expected_price: undefined }));
                          }}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Optional target"
                          className="input-base !pl-10"
                          disabled={formDisabled}
                        />
                      </div>
                      {errors.expected_price ? (
                        <p className="mt-1 text-xs text-error">{errors.expected_price}</p>
                      ) : null}
                    </div>
                    <div>
                      <FieldLabel htmlFor="inquiry-needed">Needed by</FieldLabel>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-fg" />
                        <input
                          id="inquiry-needed"
                          value={requiredBefore}
                          onChange={(e) => setRequiredBefore(e.target.value)}
                          type="date"
                          lang="en-GB"
                          className="input-base !pl-10"
                          disabled={formDisabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="inquiry-message" required>
                      Message to seller
                    </FieldLabel>
                    <textarea
                      id="inquiry-message"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setErrors((prev) => ({ ...prev, message: undefined }));
                      }}
                      rows={5}
                      placeholder="Specs, delivery city, payment preference, or any questions…"
                      className="w-full resize-y rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors duration-200 hover:border-border-hover focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                      disabled={formDisabled}
                    />
                    {errors.message ? (
                      <p className="mt-1 text-xs text-error">{errors.message}</p>
                    ) : (
                      <p
                        className={`mt-1 text-xs ${
                          messageLen > 0 && messageLen < 10
                            ? "text-warning"
                            : "text-muted-fg"
                        }`}
                      >
                        {messageLen < 10
                          ? `${Math.max(0, 10 - messageLen)} more characters needed`
                          : `${messageLen}/2000`}
                      </p>
                    )}
                  </div>
                </div>

                {!acceptInquiry || !canContact ? (
                  <p className="mt-4 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
                    This product is not accepting new inquiries right now.
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="sm:flex-1"
                    loading={submitting}
                    disabled={formDisabled}
                  >
                    {submitting ? (
                      "Sending…"
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Send className="h-4 w-4" aria-hidden />
                        Send inquiry &amp; open chat
                      </span>
                    )}
                  </Button>
                  <Link
                    href={backHref}
                    className="text-center text-sm font-medium text-muted-fg transition hover:text-primary sm:px-2"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
