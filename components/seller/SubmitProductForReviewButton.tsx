"use client";

import React, { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { submitProductForReview } from "@/services/productService";
import type { ProductApprovalStatus } from "@/types/product";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface SubmitProductForReviewButtonProps {
  productId: number;
  className?: string;
  label?: string;
  onSubmitted?: (status: ProductApprovalStatus) => void;
}

export default function SubmitProductForReviewButton({
  productId,
  className = "",
  label = "Submit for review",
  onSubmitted,
}: SubmitProductForReviewButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submitProductForReview(productId);
      showSuccessToast("Product submitted for review");
      onSubmitted?.(result.approval_status ?? "in_review");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to submit for review";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleSubmit()}
      disabled={submitting}
      className={`inline-flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {submitting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      {submitting ? "Submitting..." : label}
    </button>
  );
}
