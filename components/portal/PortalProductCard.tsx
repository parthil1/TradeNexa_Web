"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Pencil, Star } from "lucide-react";
import type { ApiProductListItem } from "@/types/catalog";
import type { ProductApprovalStatus } from "@/types/product";
import { formatLocation, formatPrice, getInitials, productGradient, resolveImageUrl } from "@/utils/catalogHelpers";
import {
  canSellerEditProduct,
  canSellerSubmitForReview,
} from "@/utils/productApprovalHelpers";
import { productHasWishlistField } from "@/utils/wishlistHelpers";
import { isPortalPath } from "@/utils/roleNavigation";
import PortalWishlistButton from "@/components/portal/PortalWishlistButton";
import DeleteProductButton from "@/components/seller/DeleteProductButton";
import ProductApprovalBadge from "@/components/seller/ProductApprovalBadge";
import SubmitProductForReviewButton from "@/components/seller/SubmitProductForReviewButton";
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
  onApprovalUpdated?: (status: ProductApprovalStatus) => void;
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
  onApprovalUpdated,
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
  const canSubmit = showApprovalStatus && canSellerSubmitForReview(product.approval_status);
  const resolvedEditHref = editHref && canEdit ? editHref : undefined;
  const footerCols = [resolvedEditHref, showDelete, canSubmit].filter(Boolean).length;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="h-full">
      <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:border-muted hover:shadow-sm">
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
              <span className="pointer-events-none absolute left-2 top-2 max-w-[85%] truncate rounded-md bg-portal-buyer/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {badgeLabel}
              </span>
            ) : null}
            {showApprovalStatus && product.approval_status ? (
              <span className="absolute bottom-2 left-2 z-[1]">
                <ProductApprovalBadge status={product.approval_status} />
              </span>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h4 className="line-clamp-2 min-h-[2.5rem] truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
              {product.name}
            </h4>
            <p className="mt-2 text-sm font-semibold text-primary">
              {formatPrice(product.price, product.currency)}
              <span className="text-xs font-normal text-muted-fg"> / {product.unit}</span>
            </p>
            <div className="mt-auto space-y-1 pt-3 text-xs text-muted-fg">
              <p className="truncate font-medium text-muted-fg">{product.supplier_name}</p>
              <p className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatLocation(product.city, product.state)}
              </p>
              <p className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {(product.rating ?? 0).toFixed(1)}
              </p>
            </div>
          </div>
        </Link>
        {showWishlistIcon ? (
          <div className="absolute right-2 top-2 z-10">
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
        {footerCols > 0 ? (
          <div
            className={`grid border-t border-border ${
              footerCols === 1
                ? "grid-cols-1"
                : footerCols === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
            }`}
          >
            {resolvedEditHref ? (
              <Link
                href={resolvedEditHref}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-fg transition hover:bg-muted hover:text-primary ${
                  footerCols > 1 ? "border-r border-border" : ""
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            ) : null}
            {canSubmit ? (
              <SubmitProductForReviewButton
                productId={product.id}
                label="Submit"
                onSubmitted={onApprovalUpdated}
                className={`flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary transition hover:bg-primary/5 ${
                  showDelete ? "border-r border-border" : ""
                }`}
              />
            ) : null}
            {showDelete ? (
              <DeleteProductButton
                productId={product.id}
                productName={product.name}
                onDeleted={onDeleted}
                className="flex w-full items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-error transition hover:bg-error/10"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
