"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { deleteProduct } from "@/services/productService";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface DeleteProductButtonProps {
  productId: number;
  productName: string;
  redirectHref?: string;
  onDeleted?: () => void;
  className?: string;
  label?: string;
  /** Called when the confirm dialog is opened (e.g. close a parent menu). */
  onOpenConfirm?: () => void;
  /** Controlled confirm dialog — use when trigger lives in an unmounting menu. */
  confirmOpen?: boolean;
  onConfirmOpenChange?: (open: boolean) => void;
  /** Hide the built-in trigger (pair with controlled confirmOpen). */
  hideTrigger?: boolean;
}

export default function DeleteProductButton({
  productId,
  productName,
  redirectHref = "/seller/catalog",
  onDeleted,
  className = "",
  label = "Delete",
  onOpenConfirm,
  confirmOpen: confirmOpenProp,
  onConfirmOpenChange,
  hideTrigger = false,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isControlled = confirmOpenProp !== undefined;
  const confirmOpen = isControlled ? Boolean(confirmOpenProp) : internalOpen;

  function setConfirmOpen(open: boolean) {
    if (isControlled) {
      onConfirmOpenChange?.(open);
    } else {
      setInternalOpen(open);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmOpen]);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteProduct(productId);
      showSuccessToast("Product deleted successfully");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push(redirectHref);
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to delete product";
      showErrorToast(message);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  function openConfirm() {
    onOpenConfirm?.();
    setConfirmOpen(true);
  }

  const dialog =
    mounted && confirmOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !loading) setConfirmOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`delete-product-title-${productId}`}
              className="surface-card w-full max-w-sm p-6 shadow-[var(--shadow-elevated)]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <h3
                id={`delete-product-title-${productId}`}
                className="text-base font-semibold text-foreground"
              >
                Delete product?
              </h3>
              <p className="mt-2 text-sm text-muted-fg">
                Are you sure you want to permanently delete &quot;{productName}&quot;? This cannot be
                undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  loading={loading}
                  loadingText="Deleting..."
                  onClick={() => void handleDelete()}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          onClick={openConfirm}
          aria-label={label.trim() ? undefined : "Delete product"}
          title={label.trim() ? undefined : "Delete"}
          className={
            className ||
            "inline-flex h-10 items-center gap-1.5 rounded-lg border border-error/30 px-3 text-sm font-semibold text-error transition hover:border-error/50 hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          }
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {label.trim() ? label : null}
        </button>
      ) : null}
      {dialog}
    </>
  );
}
