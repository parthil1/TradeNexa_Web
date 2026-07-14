"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import type { ApiProductListItem } from "@/types/catalog";
import { formatLocation, formatPrice, getInitials, productGradient, resolveImageUrl } from "@/utils/catalogHelpers";
import { canSellerEditProduct } from "@/utils/productApprovalHelpers";
import { productHasWishlistField } from "@/utils/wishlistHelpers";
import { isPortalPath } from "@/utils/roleNavigation";
import PortalWishlistButton from "@/components/portal/PortalWishlistButton";
import DeleteProductButton from "@/components/seller/DeleteProductButton";
import ProductApprovalBadge from "@/components/seller/ProductApprovalBadge";
import { useWishlist } from "@/hooks/useWishlist";

interface PortalProductCardProps {
  product: ApiProductListItem;
  href?: string;
  editHref?: string;
  showDelete?: boolean;
  onDeleted?: () => void;
  subcategoryLabel?: string;
  showWishlist?: boolean;
  onWishlistToggle?: (product: ApiProductListItem) => void;
  showApprovalStatus?: boolean;
}

export default function PortalProductCard({
  product,
  href,
  editHref,
  showDelete = false,
  onDeleted,
  subcategoryLabel,
  showWishlist,
  onWishlistToggle,
  showApprovalStatus = false,
}: PortalProductCardProps) {
  const pathname = usePathname() ?? "";
  const onPortal = isPortalPath(pathname);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const link = href ?? `/buyer/product/${product.id}`;
  const gradient = productGradient(product.id);
  const badgeLabel = subcategoryLabel || product.subcategory_name;
  const showWishlistIcon = onPortal
    ? showWishlist === false
      ? false
      : showWishlist === true
        ? true
        : productHasWishlistField(product)
    : false;
  const wishlisted = isWishlisted(product.id, product.is_wishlist === true);
  const canEdit = canSellerEditProduct(product.approval_status);
  const resolvedEditHref = editHref && canEdit ? editHref : undefined;
  const showActionsMenu = Boolean(resolvedEditHref || showDelete);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
      <div className="group surface-card-hover relative flex h-full flex-col overflow-hidden">
        <Link href={link} className="flex flex-1 flex-col hover:cursor-pointer">
          <div className="relative aspect-[4/3] overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            {product.thumbnail ? (
              <Image
                src={resolveImageUrl(product.thumbnail) || ""}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-white/25">{getInitials(product.name)}</span>
              </div>
            )}
            {badgeLabel ? (
              <span className="pointer-events-none absolute left-2 top-2 max-w-[75%] truncate rounded-md bg-navy/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-3.5">
            {showApprovalStatus && product.approval_status ? (
              <div className="mb-1.5">
                <ProductApprovalBadge status={product.approval_status} />
              </div>
            ) : null}

            <h4 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {product.name}
            </h4>

            <p className="mt-1.5 text-base font-bold text-primary">
              {formatPrice(product.price, product.currency)}
              <span className="ml-1 text-xs font-medium text-muted-fg">/ {product.unit}</span>
            </p>

            <div className="mt-auto space-y-1.5 border-t border-border pt-2.5 text-xs text-muted-fg">
              <p className="truncate font-medium">{product.supplier_name}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{formatLocation(product.city, product.state)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-medium text-foreground/70">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                  {(product.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {showWishlistIcon ? (
          <div
            className={`absolute top-2 z-10 ${showActionsMenu ? "right-12" : "right-2"}`}
          >
            <PortalWishlistButton
              isWishlisted={wishlisted}
              onToggle={() => {
                if (onWishlistToggle) {
                  onWishlistToggle(product);
                } else {
                  void toggleWishlist(product.id, wishlisted);
                }
              }}
            />
          </div>
        ) : null}

        {showActionsMenu ? (
          <div ref={menuRef} className="absolute right-2 top-2 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${
                menuOpen
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border text-muted-fg hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              }`}
              aria-label="Product actions"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
            >
              <MoreVertical className="h-4 w-4" aria-hidden />
            </button>

            <AnimatePresence>
              {menuOpen ? (
                <motion.div
                  id={menuId}
                  role="menu"
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-30 mt-2 flex w-10 flex-col items-center gap-0.5 rounded-xl border border-border bg-card p-1.5 shadow-[var(--shadow-elevated)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {resolvedEditHref ? (
                    <Link
                      href={resolvedEditHref}
                      role="menuitem"
                      aria-label="Edit product"
                      title="Edit"
                      onClick={() => setMenuOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-fg transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  ) : null}
                  {resolvedEditHref && showDelete ? (
                    <div className="my-0.5 h-px w-6 bg-border" aria-hidden />
                  ) : null}
                  {showDelete ? (
                    <button
                      type="button"
                      role="menuitem"
                      aria-label="Delete product"
                      title="Delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuOpen(false);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-error transition-colors hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {showDelete ? (
          <DeleteProductButton
            productId={product.id}
            productName={product.name}
            onDeleted={onDeleted}
            hideTrigger
            confirmOpen={deleteConfirmOpen}
            onConfirmOpenChange={setDeleteConfirmOpen}
          />
        ) : null}
      </div>
    </motion.div>
  );
}
