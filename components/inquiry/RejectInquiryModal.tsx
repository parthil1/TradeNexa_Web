"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";

const FORM_ID = "reject-inquiry-form";

export function RejectInquiryModal({
  isOpen,
  onClose,
  productTitle,
  submitting,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  submitting?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onConfirm(reason.trim());
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      bodyClassName="px-5 py-5 sm:px-6"
      title={
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">Reject inquiry</p>
          {productTitle ? (
            <p className="mt-0.5 truncate text-sm font-medium text-muted-fg">
              {productTitle}
            </p>
          ) : null}
        </div>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="sm:min-w-[7rem]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            loading={submitting}
            className="sm:min-w-[9rem]"
          >
            Reject inquiry
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <label
          htmlFor="reject-inquiry-reason"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Reject reason <span className="font-normal text-muted-fg">(optional)</span>
        </label>
        <textarea
          id="reject-inquiry-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          disabled={submitting}
          className="w-full resize-y rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
          placeholder="Unable to fulfill quantity…"
        />
      </form>
    </Modal>
  );
}
