"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface DeleteAccountButtonProps {
  compact?: boolean;
}

export default function DeleteAccountButton({ compact = false }: DeleteAccountButtonProps) {
  const router = useRouter();
  const { deleteAccountAction } = useAuth();
  const { clearWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const ok = await deleteAccountAction();
      if (ok) {
        clearWishlist();
        showSuccessToast("Account deleted successfully");
        router.replace("/");
      }
    } catch {
      showErrorToast("Failed to delete account");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  if (!confirmOpen) {
    return (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 ${
          compact ? "shrink-0" : "w-full py-3.5"
        }`}
      >
        <Trash2 className="h-4 w-4" />
        Delete Account
      </button>
    );
  }

  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 p-4 ${compact ? "w-full max-w-md" : ""}`}>
      <p className="text-sm font-extrabold text-red-700">Delete your account?</p>
      <p className="mt-1 text-xs text-red-600/80">
        This permanently removes your profile and cannot be undone.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmOpen(false)}
          disabled={loading}
          className="flex-1 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-[#546E7A]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Confirm Delete"}
        </button>
      </div>
    </div>
  );
}
