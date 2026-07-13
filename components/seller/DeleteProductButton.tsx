"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProduct } from "@/services/productService";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface DeleteProductButtonProps {
  productId: number;
  productName: string;
  redirectHref?: string;
  onDeleted?: () => void;
  className?: string;
  label?: string;
}

export default function DeleteProductButton({
  productId,
  productName,
  redirectHref = "/seller/catalog",
  onDeleted,
  className = "",
  label = "Delete",
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={
          className ||
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-error/30 px-3 text-xs font-medium text-error transition hover:border-error/50 hover:bg-error/10"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Delete product?</h3>
            <p className="mt-2 text-sm text-muted-fg">
              Are you sure you want to permanently delete &quot;{productName}&quot;? This cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-fg hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
