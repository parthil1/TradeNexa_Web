"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import type { CreateInquiryQuotationPayload } from "@/types/inquiry";
import { submitInquiryQuotation } from "@/services/inquiryService";
import { formatPrice } from "@/utils/catalogHelpers";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const QUOTATION_UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "tons", label: "Tons" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
  { value: "boxes", label: "Boxes" },
  { value: "units", label: "Units" },
];

const initialForm = {
  price: "",
  quantity: "",
  unit: "pcs",
  gstPercentage: "18",
  transportationCharge: "",
  deliveryDays: "7",
  paymentTerms: "",
  validityDays: "15",
  remarks: "",
};

type FormState = typeof initialForm;
type FormErrors = Partial<Record<keyof FormState, string>>;

const API_TO_FORM_FIELD: Record<string, keyof FormState> = {
  price: "price",
  quantity: "quantity",
  unit: "unit",
  gst_percentage: "gstPercentage",
  transportation_charge: "transportationCharge",
  delivery_days: "deliveryDays",
  payment_terms: "paymentTerms",
  validity_days: "validityDays",
  remarks: "remarks",
};

interface SubmitInquiryQuotationFormProps {
  inquiryId: number;
  defaultQuantity?: number | null;
  defaultUnit?: string | null;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

export default function SubmitInquiryQuotationForm({
  inquiryId,
  defaultQuantity,
  defaultUnit,
  onSubmitted,
  onCancel,
}: SubmitInquiryQuotationFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    quantity: defaultQuantity != null ? String(defaultQuantity) : "",
    unit: defaultUnit?.trim() || "pcs",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const liveTotal = useMemo(() => {
    const price = Number(form.price) || 0;
    const qty = Number(form.quantity) || 0;
    const gst = Number(form.gstPercentage) || 0;
    const transport = Number(form.transportationCharge) || 0;
    const subtotal = price * qty;
    const gstAmount = (subtotal * gst) / 100;
    return {
      subtotal,
      gstAmount,
      transport,
      total: subtotal + gstAmount + transport,
    };
  }, [form]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.price.trim() || Number(form.price) < 0 || Number.isNaN(Number(form.price))) {
      next.price = "Enter a valid price";
    }
    if (form.quantity.trim() && (Number(form.quantity) < 1 || Number.isNaN(Number(form.quantity)))) {
      next.quantity = "Quantity must be at least 1";
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      scrollToFirstFormError(
        Object.fromEntries(
          Object.entries(nextErrors).filter(([, v]) => Boolean(v))
        ) as Record<string, string>,
        { fieldOrder: ["price", "quantity"] }
      );
      return;
    }

    const payload: CreateInquiryQuotationPayload = {
      price: Number(form.price),
      ...(form.quantity.trim() ? { quantity: Number(form.quantity) } : {}),
      ...(form.unit.trim() ? { unit: form.unit.trim() } : {}),
      ...(form.gstPercentage.trim()
        ? { gst_percentage: Number(form.gstPercentage) }
        : {}),
      ...(form.transportationCharge.trim()
        ? { transportation_charge: Number(form.transportationCharge) }
        : {}),
      ...(form.deliveryDays.trim() ? { delivery_days: Number(form.deliveryDays) } : {}),
      ...(form.paymentTerms.trim() ? { payment_terms: form.paymentTerms.trim() } : {}),
      ...(form.validityDays.trim() ? { validity_days: Number(form.validityDays) } : {}),
      ...(form.remarks.trim() ? { remarks: form.remarks.trim() } : {}),
    };

    setSubmitting(true);
    try {
      await submitInquiryQuotation(inquiryId, payload);
      showSuccessToast("Quotation submitted");
      onSubmitted?.();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      const mapped: FormErrors = {};
      for (const [apiField, message] of Object.entries(fieldErrors)) {
        const formField = API_TO_FORM_FIELD[apiField];
        if (formField) mapped[formField] = message;
      }
      if (Object.keys(mapped).length > 0) setErrors(mapped);
      showErrorToast(formatApiValidationSummary(err, "Could not submit quotation"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="submit-inquiry-quotation-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Price *</label>
          <input
            value={form.price}
            onChange={(e) => setField("price", e.target.value)}
            type="number"
            min={0}
            step="0.01"
            className="input-base"
            data-form-error={errors.price ? "price" : undefined}
          />
          {errors.price ? <p className="mt-1 text-xs text-error">{errors.price}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Quantity</label>
          <input
            value={form.quantity}
            onChange={(e) => setField("quantity", e.target.value)}
            type="number"
            min={1}
            className="input-base"
            data-form-error={errors.quantity ? "quantity" : undefined}
          />
          {errors.quantity ? <p className="mt-1 text-xs text-error">{errors.quantity}</p> : null}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Unit</label>
          <Select
            id="inquiry-quotation-unit"
            value={form.unit}
            onChange={(e) => setField("unit", e.target.value)}
            options={QUOTATION_UNITS}
            searchable={false}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">GST %</label>
          <input
            value={form.gstPercentage}
            onChange={(e) => setField("gstPercentage", e.target.value)}
            type="number"
            min={0}
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Transportation
          </label>
          <input
            value={form.transportationCharge}
            onChange={(e) => setField("transportationCharge", e.target.value)}
            type="number"
            min={0}
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Delivery days
          </label>
          <input
            value={form.deliveryDays}
            onChange={(e) => setField("deliveryDays", e.target.value)}
            type="number"
            min={0}
            className="input-base"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Payment terms
          </label>
          <input
            value={form.paymentTerms}
            onChange={(e) => setField("paymentTerms", e.target.value)}
            className="input-base"
            placeholder="e.g. 30 days"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Validity days
          </label>
          <input
            value={form.validityDays}
            onChange={(e) => setField("validityDays", e.target.value)}
            type="number"
            min={1}
            className="input-base"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Remarks</label>
        <textarea
          value={form.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <div className="rounded-xl bg-muted px-4 py-3 text-sm">
        <p className="font-semibold text-foreground">
          Est. total: {formatPrice(liveTotal.total, "INR")}
        </p>
        <p className="mt-1 text-xs text-muted-fg">
          Subtotal {formatPrice(liveTotal.subtotal, "INR")} · GST{" "}
          {formatPrice(liveTotal.gstAmount, "INR")} · Transport{" "}
          {formatPrice(liveTotal.transport, "INR")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" loading={submitting}>
          Send quotation
        </Button>
      </div>
    </form>
  );
}

export function SubmitInquiryQuotationModal({
  isOpen,
  onClose,
  inquiryId,
  productTitle,
  defaultQuantity,
  defaultUnit,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  inquiryId: number;
  productTitle: string;
  defaultQuantity?: number | null;
  defaultUnit?: string | null;
  onSubmitted?: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quote · ${productTitle}`}>
      <SubmitInquiryQuotationForm
        inquiryId={inquiryId}
        defaultQuantity={defaultQuantity}
        defaultUnit={defaultUnit}
        onCancel={onClose}
        onSubmitted={() => {
          onSubmitted?.();
          onClose();
        }}
      />
    </Modal>
  );
}
