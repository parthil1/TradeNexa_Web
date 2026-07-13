"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { requestQuotationRevision } from "@/services/rfqService";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface RequestRevisionModalProps {
  isOpen: boolean;
  quotationId: number | null;
  onClose: () => void;
  onRequested?: () => void;
}

function validateRemarks(remarks: string): string | undefined {
  const value = remarks.trim();
  if (!value) return "Remarks are required";
  if (value.length < 10) return "Remarks must be at least 10 characters";
  return undefined;
}

export default function RequestRevisionModal({
  isOpen,
  quotationId,
  onClose,
  onRequested,
}: RequestRevisionModalProps) {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRemarks("");
    setRemarksError(undefined);
  }, [isOpen, quotationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quotationId) return;

    const error = validateRemarks(remarks);
    if (error) {
      setRemarksError(error);
      return;
    }

    setSubmitting(true);
    setRemarksError(undefined);

    try {
      await requestQuotationRevision(quotationId, { remarks: remarks.trim() });
      showSuccessToast("Revision requested");
      onRequested?.();
      onClose();
    } catch (err) {
      const apiErrors = getApiFieldErrors(err);
      if (apiErrors.remarks) {
        setRemarksError(apiErrors.remarks);
        return;
      }
      showErrorToast(formatApiValidationSummary(err, "Failed to request revision"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      bodyClassName="px-5 py-5 sm:px-6"
      title={
        <div>
          <p className="text-lg font-extrabold text-foreground">Request revision</p>
          <p className="mt-0.5 text-xs font-medium text-muted-fg">
            Tell the seller what to change in their quotation.
          </p>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-muted-fg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="request-revision-form"
            disabled={submitting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send request
          </button>
        </div>
      }
    >
      <form id="request-revision-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
        <label className="mb-1.5 block text-xs font-bold text-muted-fg">
          Revision remarks <span className="text-red-500">*</span>
        </label>
        <textarea
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value);
            if (remarksError) setRemarksError(undefined);
          }}
          rows={5}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${
            remarksError
              ? "border-red-300 focus:border-red-500"
              : "border-border focus:border-primary"
          }`}
          placeholder="Please revise your quotation by reducing the unit price by 5% and confirm whether delivery can be completed within 5 working days."
        />
        {remarksError ? <p className="mt-1 text-xs text-red-600">{remarksError}</p> : null}
      </form>
    </Modal>
  );
}
