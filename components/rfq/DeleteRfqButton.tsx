"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteRfq } from "@/services/rfqService";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface DeleteRfqButtonProps {
  rfqId: number;
  rfqTitle: string;
  redirectHref?: string;
  onDeleted?: () => void;
  className?: string;
  label?: string;
}

export default function DeleteRfqButton({
  rfqId,
  rfqTitle,
  redirectHref = "/buyer/inquiries",
  onDeleted,
  className = "",
  label = "Delete draft",
}: DeleteRfqButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteRfq(rfqId);
      showSuccessToast("Draft RFQ deleted");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push(redirectHref);
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to delete RFQ";
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
          "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Delete draft RFQ?</h3>
            <p className="mt-2 text-sm text-muted-fg">
              Permanently delete &quot;{rfqTitle}&quot;? This only works for draft requirements and
              cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-muted-fg hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
