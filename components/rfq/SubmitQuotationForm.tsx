"use client";

import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Select } from "@/components/common/Select";
import type { CreateQuotationPayload } from "@/types/rfq";
import { submitQuotation } from "@/services/rfqService";
import { formatPrice } from "@/utils/catalogHelpers";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export const SUBMIT_QUOTATION_FORM_ID = "submit-quotation-form";

interface SubmitQuotationFormProps {
  rfqId: number;
  defaultQuantity?: number | null;
  defaultUnit?: string | null;
  onSubmitted?: () => void;
  onCancel?: () => void;
  hideHeader?: boolean;
}

interface SubmitQuotationFormModalProps extends SubmitQuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  rfqTitle: string;
}

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

export type QuotationFormState = typeof initialForm;
type FormState = QuotationFormState;
type FormErrors = Partial<Record<keyof FormState, string>>;

type LiveTotal = {
  subtotal: number;
  gstAmount: number;
  transport: number;
  total: number;
};

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

export const QUOTATION_FIELD_ERROR_ORDER: (keyof QuotationFormState)[] = ["price", "quantity", "unit"];
const FIELD_ERROR_ORDER = QUOTATION_FIELD_ERROR_ORDER;

export function quotationToFormState(quotation: {
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  gst_percentage?: number | null;
  transportation_charge?: number | null;
  delivery_days?: number | null;
  payment_terms?: string | null;
  validity_days?: number | null;
  remarks?: string | null;
}): QuotationFormState {
  return {
    price: quotation.price != null ? String(quotation.price) : "",
    quantity: quotation.quantity != null ? String(quotation.quantity) : "",
    unit: quotation.unit?.trim() || "pcs",
    gstPercentage: quotation.gst_percentage != null ? String(quotation.gst_percentage) : "18",
    transportationCharge:
      quotation.transportation_charge != null ? String(quotation.transportation_charge) : "",
    deliveryDays: quotation.delivery_days != null ? String(quotation.delivery_days) : "7",
    paymentTerms: quotation.payment_terms ?? "",
    validityDays: quotation.validity_days != null ? String(quotation.validity_days) : "15",
    remarks: quotation.remarks ?? "",
  };
}

export function buildQuotationPayload(form: QuotationFormState): CreateQuotationPayload {
  return {
    price: Number(form.price),
    quantity: Math.floor(Number(form.quantity)),
    unit: form.unit.trim(),
    gst_percentage: form.gstPercentage ? Number(form.gstPercentage) : undefined,
    transportation_charge: form.transportationCharge ? Number(form.transportationCharge) : undefined,
    delivery_days: form.deliveryDays ? Number(form.deliveryDays) : undefined,
    payment_terms: form.paymentTerms.trim() || undefined,
    validity_days: form.validityDays ? Number(form.validityDays) : undefined,
    remarks: form.remarks.trim() || undefined,
  };
}

export function validateQuotationForm(form: QuotationFormState): FormErrors {
  const errors: FormErrors = {};

  const priceStr = form.price.trim();
  if (!priceStr) {
    errors.price = "Price is required";
  } else {
    const price = Number(priceStr);
    if (!Number.isFinite(price) || price <= 0) {
      errors.price = "Price must be a positive number";
    }
  }

  const quantityStr = form.quantity.trim();
  if (!quantityStr) {
    errors.quantity = "Quantity is required";
  } else {
    const quantity = Number(quantityStr);
    if (!Number.isFinite(quantity) || quantity < 1) {
      errors.quantity = "Quantity must be at least 1";
    }
  }

  if (!form.unit.trim()) {
    errors.unit = "Unit is required";
  }

  return errors;
}

export function mapQuotationApiErrorsToForm(apiErrors: Record<string, string>): FormErrors {
  const errors: FormErrors = {};
  for (const [apiField, message] of Object.entries(apiErrors)) {
    const formField = API_TO_FORM_FIELD[apiField];
    if (formField) errors[formField] = message;
  }
  return errors;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted p-4 ring-1 ring-border/80">
      <p className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-fg">{title}</p>
      {children}
    </div>
  );
}

export function useQuotationFormState({
  initialValues,
  lockedUnit,
}: {
  initialValues: QuotationFormState;
  lockedUnit?: string | null;
}) {
  const rfqUnit = lockedUnit?.trim() || "";
  const [form, setForm] = useState<FormState>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const unitOptions = useMemo(() => {
    if (rfqUnit && !QUOTATION_UNITS.some((option) => option.value === rfqUnit)) {
      return [{ value: rfqUnit, label: rfqUnit }, ...QUOTATION_UNITS];
    }
    return QUOTATION_UNITS;
  }, [rfqUnit]);

  const liveTotal = useMemo((): LiveTotal | null => {
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const gstPct = Number(form.gstPercentage) || 0;
    const transport = Number(form.transportationCharge) || 0;
    if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0 || quantity <= 0) {
      return null;
    }
    const subtotal = price * quantity;
    const gstAmount = subtotal * (gstPct / 100);
    return { subtotal, gstAmount, transport, total: subtotal + gstAmount + transport };
  }, [form.price, form.quantity, form.gstPercentage, form.transportationCharge]);

  function fieldError(name: keyof FormState): string | undefined {
    return fieldErrors[name];
  }

  function inputClass(name: keyof FormState): string {
    const base = "w-full rounded-xl border px-4 py-3 text-sm outline-none";
    return fieldError(name)
      ? `${base} border-red-300 focus:border-red-500`
      : `${base} border-border focus:border-primary`;
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  return {
    form,
    rfqUnit,
    unitOptions,
    liveTotal,
    submitting,
    setSubmitting,
    fieldErrors,
    setFieldErrors,
    fieldError,
    inputClass,
    updateField,
  };
}

function useSubmitQuotationForm({
  rfqId,
  defaultQuantity,
  defaultUnit,
  onSubmitted,
}: SubmitQuotationFormProps) {
  const lockedUnit = defaultUnit?.trim() || "";
  const vm = useQuotationFormState({
    initialValues: {
      ...initialForm,
      quantity: defaultQuantity != null ? String(defaultQuantity) : "",
      unit: lockedUnit || "pcs",
    },
    lockedUnit: defaultUnit,
  });
  const { form, submitting, setSubmitting, setFieldErrors, ...rest } = vm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientErrors = validateQuotationForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      scrollToFirstFormError(clientErrors as Record<string, string>, {
        fieldOrder: FIELD_ERROR_ORDER,
      });
      return;
    }

    const payload = buildQuotationPayload(form);

    setSubmitting(true);
    setFieldErrors({});

    try {
      await submitQuotation(rfqId, payload);
      showSuccessToast("Quotation submitted");
      onSubmitted?.();
    } catch (err) {
      const apiErrors = mapQuotationApiErrorsToForm(getApiFieldErrors(err));
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        scrollToFirstFormError(apiErrors as Record<string, string>, {
          fieldOrder: FIELD_ERROR_ORDER,
        });
        return;
      }
      showErrorToast(formatApiValidationSummary(err, "Failed to submit quotation"));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    form,
    rfqUnit: vm.rfqUnit,
    unitOptions: vm.unitOptions,
    liveTotal: vm.liveTotal,
    submitting,
    fieldError: vm.fieldError,
    inputClass: vm.inputClass,
    updateField: vm.updateField,
    handleSubmit,
  };
}

function FieldHint({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function QuotationTotalSummary({
  liveTotal,
  compact = false,
}: {
  liveTotal: LiveTotal | null;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-primary-soft/60 ring-1 ring-primary/10 ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-fg">Total amount</p>
      {liveTotal ? (
        <>
          <p className={`mt-0.5 font-extrabold text-primary ${compact ? "text-xl" : "text-2xl"}`}>
            {formatPrice(liveTotal.total)}
          </p>
          <p className="mt-0.5 text-xs text-muted-fg">
            {formatPrice(liveTotal.subtotal)} subtotal
            {liveTotal.gstAmount > 0 ? ` + ${formatPrice(liveTotal.gstAmount)} GST` : ""}
            {liveTotal.transport > 0 ? ` + ${formatPrice(liveTotal.transport)} transport` : ""}
          </p>
        </>
      ) : (
        <p className={`mt-0.5 text-muted-fg ${compact ? "text-xs" : "text-sm"}`}>
          Enter unit price and quantity to see the quoted total.
        </p>
      )}
    </div>
  );
}

export function QuotationFormActions({
  submitting,
  onCancel,
  formId,
  submitLabel = "Send Quote",
}: {
  submitting: boolean;
  onCancel?: () => void;
  formId?: string;
  submitLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="cursor-pointer rounded-2xl border border-border bg-white px-4 py-3.5 text-sm font-bold text-muted-fg disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          Cancel
        </button>
      ) : null}
      <button
        type="submit"
        form={formId}
        disabled={submitting}
        className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
    </div>
  );
}

export type QuotationFormViewModel = ReturnType<typeof useSubmitQuotationForm>;

export function QuotationFormFields({
  vm,
  hideHeader = false,
}: {
  vm: QuotationFormViewModel;
  hideHeader?: boolean;
}) {
  const labelClass = "mb-1.5 block text-xs font-bold text-muted-fg";
  const hintClass = "mt-1 text-[11px] text-muted-fg";

  function RequiredLabel({ children }: { children: React.ReactNode }) {
    return (
      <label className={labelClass}>
        {children} <span className="text-red-500">*</span>
      </label>
    );
  }

  return (
    <>
      {!hideHeader ? (
        <div>
          <p className="text-lg font-extrabold text-foreground">Submit your quotation</p>
          <p className="mt-1 text-xs text-muted-fg">
            Fields marked with <span className="font-semibold text-red-500">*</span> are required.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-fg">
          Fields marked with <span className="font-semibold text-red-500">*</span> are required.
        </p>
      )}

      <FormSection title="Pricing">
        <div className="grid gap-5 sm:grid-cols-3">
          <div data-form-field="price">
            <RequiredLabel>Unit price (INR)</RequiredLabel>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={vm.form.price}
              onChange={(e) => vm.updateField("price", e.target.value)}
              className={vm.inputClass("price")}
              placeholder="e.g. 440"
            />
            <FieldHint message={vm.fieldError("price")} />
          </div>
          <div data-form-field="quantity">
            <RequiredLabel>Quantity</RequiredLabel>
            <input
              type="number"
              min={1}
              value={vm.form.quantity}
              onChange={(e) => vm.updateField("quantity", e.target.value)}
              className={vm.inputClass("quantity")}
            />
            <FieldHint message={vm.fieldError("quantity")} />
          </div>
          <div data-form-field="unit">
            <RequiredLabel>Unit</RequiredLabel>
            {vm.rfqUnit ? (
              <>
                <input
                  readOnly
                  value={vm.form.unit}
                  className={`${vm.inputClass("unit")} cursor-not-allowed bg-muted text-muted-fg`}
                />
                <p className={hintClass}>Matches the buyer&apos;s RFQ requirement.</p>
              </>
            ) : (
              <Select
                id="quotation-unit"
                options={vm.unitOptions}
                value={vm.form.unit}
                onChange={(e) => vm.updateField("unit", e.target.value)}
                error={Boolean(vm.fieldError("unit"))}
                searchable={false}
              />
            )}
            <FieldHint message={vm.fieldError("unit")} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>GST %</label>
            <input
              type="number"
              min={0}
              value={vm.form.gstPercentage}
              onChange={(e) => vm.updateField("gstPercentage", e.target.value)}
              className={vm.inputClass("gstPercentage")}
            />
            <p className={hintClass}>Pre-filled with a common default — adjust if your GST rate differs.</p>
          </div>
          <div>
            <label className={labelClass}>Transport charge (INR)</label>
            <input
              type="number"
              min={0}
              value={vm.form.transportationCharge}
              onChange={(e) => vm.updateField("transportationCharge", e.target.value)}
              className={vm.inputClass("transportationCharge")}
              placeholder="0"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Terms">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Delivery days</label>
            <input
              type="number"
              min={1}
              value={vm.form.deliveryDays}
              onChange={(e) => vm.updateField("deliveryDays", e.target.value)}
              className={vm.inputClass("deliveryDays")}
            />
            <p className={hintClass}>Pre-filled with a standard lead time — update to match your offer.</p>
          </div>
          <div>
            <label className={labelClass}>Payment terms</label>
            <input
              value={vm.form.paymentTerms}
              onChange={(e) => vm.updateField("paymentTerms", e.target.value)}
              placeholder="30 Days Credit"
              className={vm.inputClass("paymentTerms")}
            />
          </div>
          <div>
            <label className={labelClass}>Validity (days)</label>
            <input
              type="number"
              min={1}
              value={vm.form.validityDays}
              onChange={(e) => vm.updateField("validityDays", e.target.value)}
              className={vm.inputClass("validityDays")}
            />
          </div>
        </div>
      </FormSection>

      <div>
        <label className={labelClass}>Remarks</label>
        <textarea
          value={vm.form.remarks}
          onChange={(e) => vm.updateField("remarks", e.target.value)}
          rows={4}
          className={vm.inputClass("remarks")}
          placeholder="Quality, certification, delivery timeline..."
        />
      </div>
    </>
  );
}

export function SubmitQuotationFormModal({
  isOpen,
  onClose,
  rfqTitle,
  onSubmitted,
  ...props
}: SubmitQuotationFormModalProps) {
  const vm = useSubmitQuotationForm({
    ...props,
    onSubmitted: () => {
      onSubmitted?.();
      onClose();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      bodyClassName="px-5 py-5 sm:px-6"
      title={
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-foreground">Submit your quotation</p>
          <p className="mt-0.5 truncate text-sm font-medium text-muted-fg">{rfqTitle}</p>
        </div>
      }
      footer={
        <div className="space-y-3">
          <QuotationTotalSummary liveTotal={vm.liveTotal} compact />
          <QuotationFormActions
            formId={SUBMIT_QUOTATION_FORM_ID}
            submitting={vm.submitting}
            onCancel={onClose}
          />
        </div>
      }
    >
      <form
        id={SUBMIT_QUOTATION_FORM_ID}
        onSubmit={(e) => void vm.handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        <QuotationFormFields vm={vm} hideHeader />
      </form>
    </Modal>
  );
}

export default function SubmitQuotationForm(props: SubmitQuotationFormProps) {
  const vm = useSubmitQuotationForm(props);

  return (
    <form onSubmit={(e) => void vm.handleSubmit(e)} noValidate className="space-y-5">
      <QuotationFormFields vm={vm} hideHeader={props.hideHeader} />
      <QuotationTotalSummary liveTotal={vm.liveTotal} />
      <QuotationFormActions submitting={vm.submitting} onCancel={props.onCancel} />
    </form>
  );
}
