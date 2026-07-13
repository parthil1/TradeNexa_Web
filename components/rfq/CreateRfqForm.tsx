"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { DateInput } from "@/components/common/DateInput";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import ProductSelect from "@/components/rfq/ProductSelect";
import SellerMultiSelect from "@/components/rfq/SellerMultiSelect";
import StateSelect from "@/components/location/StateSelect";
import CitySelect from "@/components/location/CitySelect";
import ProductWizardStepper from "@/components/seller/ProductWizardStepper";
import { useAuth } from "@/hooks/useAuth";
import { fetchCategories, fetchSubcategories } from "@/services/catalogService";
import { fetchCities, fetchStates } from "@/services/locationService";
import { createRfq, fetchPublicRfqById, publishRfq, updateRfq } from "@/services/rfqService";
import { fetchSuppliers } from "@/services/supplierService";
import type { ApiCategory, ApiSubcategory } from "@/types/catalog";
import type { ApiRfqDetail, CreateRfqPayload } from "@/types/rfq";
import type { ApiSupplier } from "@/types/supplier";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import { isRfqDraft, isoToDateInput } from "@/utils/rfqHelpers";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { getUnitOptions } from "@/utils/unitOptions";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const API_TO_FORM_FIELD: Record<string, string> = {
  title: "title",
  category_id: "categoryId",
  subcategory_id: "subcategoryId",
  description: "description",
  quantity: "quantity",
  unit: "unit",
  quotation_deadline: "quotationDeadline",
  address_line_1: "addressLine1",
  address_line_2: "addressLine2",
  city: "city",
  state: "state",
  country: "country",
  pincode: "pincode",
  visibility: "visibility",
  seller_ids: "sellerIds",
};

function dateInputToIso(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

const initialForm = {
  title: "",
  categoryId: "",
  subcategoryId: "",
  description: "",
  quantity: "",
  unit: "",
  quotationDeadline: "",
  requiredBefore: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  productId: "",
  expectedPrice: "",
  budget: "",
  currency: "INR",
  paymentTerms: "",
  visibility: "PUBLIC" as "PUBLIC" | "PRIVATE",
  publishNow: true,
};

type FormState = typeof initialForm;
type FormErrors = Partial<Record<keyof FormState | "sellerIds", string>>;

function mapRfqDetailToForm(detail: ApiRfqDetail): FormState {
  const categoryId = detail.category_id ?? detail.category?.id;
  const subcategoryId = detail.subcategory_id ?? detail.subcategory?.id;
  const productId = detail.product_id ?? detail.product?.id;

  return {
    title: detail.title ?? "",
    categoryId: categoryId ? String(categoryId) : "",
    subcategoryId: subcategoryId ? String(subcategoryId) : "",
    description: detail.description ?? "",
    quantity: detail.quantity != null ? String(detail.quantity) : "",
    unit: detail.unit ?? "",
    quotationDeadline: isoToDateInput(detail.quotation_deadline),
    requiredBefore: isoToDateInput(detail.required_before),
    addressLine1: detail.address_line_1 ?? "",
    addressLine2: detail.address_line_2 ?? "",
    city: detail.city ?? "",
    state: detail.state ?? "",
    country: detail.country?.trim() || "India",
    pincode: detail.pincode ?? "",
    productId: productId ? String(productId) : "",
    expectedPrice: detail.expected_price != null ? String(detail.expected_price) : "",
    budget: detail.budget != null ? String(detail.budget) : "",
    currency: detail.currency ?? "INR",
    paymentTerms: detail.payment_terms ?? "",
    visibility:
      detail.visibility?.toUpperCase() === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    publishNow: false,
  };
}

const FIELD_ERROR_ORDER: (keyof FormErrors)[] = [
  "title",
  "categoryId",
  "subcategoryId",
  "description",
  "quantity",
  "unit",
  "quotationDeadline",
  "addressLine1",
  "city",
  "state",
  "country",
  "pincode",
  "visibility",
  "sellerIds",
];

const FIELD_IDS: Partial<Record<keyof FormErrors, string>> = {
  categoryId: "rfq-category",
  subcategoryId: "rfq-subcategory",
  state: "rfq-state",
  city: "rfq-city",
};

type WizardStepKey = "details" | "quantity" | "delivery" | "settings";

const WIZARD_STEPS: { key: WizardStepKey; label: string; shortLabel: string }[] = [
  { key: "details", label: "Requirement Details", shortLabel: "Details" },
  { key: "quantity", label: "Quantity & Budget", shortLabel: "Budget" },
  { key: "delivery", label: "Delivery Address", shortLabel: "Delivery" },
  { key: "settings", label: "Listing Settings", shortLabel: "Settings" },
];

const ERROR_KEYS_BY_STEP: Record<WizardStepKey, (keyof FormErrors)[]> = {
  details: ["title", "categoryId", "subcategoryId", "description"],
  quantity: ["quantity", "unit", "quotationDeadline"],
  delivery: ["addressLine1", "city", "state", "country", "pincode"],
  settings: ["visibility", "sellerIds"],
};

const STEP_INDEX_BY_FIELD: Partial<Record<keyof FormErrors, number>> = {
  title: 0,
  categoryId: 0,
  subcategoryId: 0,
  description: 0,
  quantity: 1,
  unit: 1,
  quotationDeadline: 1,
  addressLine1: 2,
  city: 2,
  state: 2,
  country: 2,
  pincode: 2,
  visibility: 3,
  sellerIds: 3,
};

function validateForm(form: FormState, sellerIds: number[]): FormErrors {
  const errors: FormErrors = {};

  const title = form.title.trim();
  if (!title) errors.title = "RFQ title is required";
  else if (title.length < 2 || title.length > 200) {
    errors.title = "Title must be 2 to 200 characters";
  }

  const categoryId = Number(form.categoryId);
  if (!form.categoryId || !Number.isInteger(categoryId) || categoryId < 1) {
    errors.categoryId = "Category is required";
  }

  const subcategoryId = Number(form.subcategoryId);
  if (!form.subcategoryId || !Number.isInteger(subcategoryId) || subcategoryId < 1) {
    errors.subcategoryId = "Subcategory is required";
  }

  const description = form.description.trim();
  if (!description) errors.description = "Description is required";
  else if (description.length < 10) {
    errors.description = "Description must be at least 10 characters";
  }

  const quantity = Number(form.quantity);
  if (!form.quantity || !Number.isFinite(quantity) || quantity < 1) {
    errors.quantity = "Quantity is required and must be at least 1";
  }

  if (!form.unit.trim()) errors.unit = "Unit is required";

  if (!form.quotationDeadline) {
    errors.quotationDeadline = "Quotation deadline is required";
  }

  if (!form.addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";

  if (!form.city.trim()) errors.city = "City is required";
  if (!form.state.trim()) errors.state = "State is required";
  if (!form.country.trim()) errors.country = "Country is required";

  const pincode = form.pincode.trim();
  if (!pincode) errors.pincode = "Pincode is required";
  else if (!/^\d{6}$/.test(pincode)) errors.pincode = "Enter a valid 6-digit pincode";

  if (form.visibility === "PRIVATE" && sellerIds.length === 0) {
    errors.sellerIds = "Select at least one seller for a private RFQ";
  }

  return errors;
}

function mapApiErrorsToForm(apiErrors: Record<string, string>): FormErrors {
  const errors: FormErrors = {};
  for (const [apiField, message] of Object.entries(apiErrors)) {
    const formField = API_TO_FORM_FIELD[apiField];
    if (formField) {
      errors[formField as keyof FormErrors] = message;
    }
  }
  return errors;
}

function Section({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 rounded-xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        {title}
        {optional ? (
          <span className="ml-3 text-sm font-normal text-muted-fg">(Optional)</span>
        ) : null}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export default function CreateRfqForm({ rfqId }: { rfqId?: number } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, openAuthModal } = useAuth();
  const isEditMode = Boolean(rfqId);
  const [form, setForm] = useState<FormState>(initialForm);
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [sellerIds, setSellerIds] = useState<number[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<ApiSupplier[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [loadingRfq, setLoadingRfq] = useState(isEditMode);
  const [editBlocked, setEditBlocked] = useState<string | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesHasMore, setCategoriesHasMore] = useState(false);
  const [categoriesLoadingMore, setCategoriesLoadingMore] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [subcategories, setSubcategories] = useState<ApiSubcategory[]>([]);
  const [subcategoriesPage, setSubcategoriesPage] = useState(1);
  const [subcategoriesHasMore, setSubcategoriesHasMore] = useState(false);
  const [subcategoriesLoadingMore, setSubcategoriesLoadingMore] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);

  const lastStepIndex = WIZARD_STEPS.length - 1;

  useEffect(() => {
    if (!rfqId) return;
    const editId = rfqId;

    let cancelled = false;

    async function loadRfq() {
      setLoadingRfq(true);
      setEditBlocked(null);
      try {
        const detail = await fetchPublicRfqById(editId);
        if (cancelled) return;

        if (!detail) {
          setEditBlocked("Could not load this RFQ for editing.");
          return;
        }

        if (!isRfqDraft(detail.status)) {
          setEditBlocked("Only draft RFQs can be edited.");
          return;
        }

        setForm(mapRfqDetailToForm(detail));
        setStateId("");
        setCityId("");

        const stateName = detail.state?.trim();
        const cityName = detail.city?.trim();
        if (stateName) {
          try {
            const { results: states } = await fetchStates({
              search: stateName,
              limit: 20,
              sort_by: "name",
              sort_order: "asc",
              is_active: true,
            });
            if (cancelled) return;
            const q = stateName.toLowerCase();
            const matchedState =
              states.find((s) => s.name.toLowerCase() === q) ??
              states.find((s) => s.name.toLowerCase().startsWith(q)) ??
              states.find((s) => s.name.toLowerCase().includes(q)) ??
              null;
            if (matchedState) {
              setStateId(String(matchedState.id));
              setForm((prev) => ({ ...prev, state: matchedState.name }));

              if (cityName) {
                const { results: cities } = await fetchCities({
                  state_id: matchedState.id,
                  search: cityName,
                  limit: 20,
                  sort_by: "name",
                  sort_order: "asc",
                  is_active: true,
                });
                if (cancelled) return;
                const cq = cityName.toLowerCase();
                const matchedCity =
                  cities.find((c) => c.name.toLowerCase() === cq) ??
                  cities.find((c) => c.name.toLowerCase().startsWith(cq)) ??
                  cities.find((c) => c.name.toLowerCase().includes(cq)) ??
                  null;
                if (matchedCity) {
                  setCityId(String(matchedCity.id));
                  setForm((prev) => ({ ...prev, city: matchedCity.name }));
                }
              }
            }
          } catch {
            /* keep name-only city/state from detail */
          }
        }

        const invitedIds = detail.seller_ids ?? [];
        setSellerIds(invitedIds);
        if (invitedIds.length > 0) {
          try {
            const { results } = await fetchSuppliers({
              page: 1,
              limit: 50,
              sort_by: "company_name",
              sort_order: "asc",
            });
            const matched = results.filter((s) => invitedIds.includes(s.id));
            const missingIds = invitedIds.filter((id) => !matched.some((s) => s.id === id));
            setSelectedSellers([
              ...matched,
              ...missingIds.map((id) => ({
                id,
                company_name: `Seller #${id}`,
              })),
            ]);
          } catch {
            setSelectedSellers(
              invitedIds.map((id) => ({
                id,
                company_name: `Seller #${id}`,
              }))
            );
          }
        } else {
          setSelectedSellers([]);
        }
        setMaxReachedStepIndex(lastStepIndex);
      } catch {
        if (!cancelled) setEditBlocked("Could not load this RFQ for editing.");
      } finally {
        if (!cancelled) setLoadingRfq(false);
      }
    }

    void loadRfq();
    return () => {
      cancelled = true;
    };
  }, [rfqId, lastStepIndex]);

  useEffect(() => {
    if (isEditMode) return;
    const productId = searchParams.get("product");
    if (productId) {
      setForm((prev) => ({ ...prev, productId }));
    }
  }, [searchParams, isEditMode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingCategories(true);
      try {
        const { results, pagination } = await fetchCategories({ page: 1, limit: 20, is_active: true });
        if (!cancelled) {
          setCategories(results);
          setCategoriesPage(pagination.page || 1);
          setCategoriesHasMore(pagination.page < pagination.totalPages);
        }
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.categoryId) {
      setSubcategories([]);
      setSubcategoriesHasMore(false);
      return;
    }

    let cancelled = false;
    const categoryId = Number(form.categoryId);

    async function load() {
      setLoadingSubcategories(true);
      try {
        const { results, pagination } = await fetchSubcategories(categoryId, {
          page: 1,
          limit: 20,
          is_active: true,
        });
        if (!cancelled) {
          setSubcategories(results);
          setSubcategoriesPage(pagination.page || 1);
          setSubcategoriesHasMore(pagination.page < pagination.totalPages);
        }
      } catch {
        if (!cancelled) setSubcategories([]);
      } finally {
        if (!cancelled) setLoadingSubcategories(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [form.categoryId]);

  const loadMoreCategories = useCallback(async () => {
    if (categoriesLoadingMore || !categoriesHasMore) return;
    setCategoriesLoadingMore(true);
    try {
      const nextPage = categoriesPage + 1;
      const { results, pagination } = await fetchCategories({
        page: nextPage,
        limit: 20,
        is_active: true,
      });
      setCategories((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...results.filter((c) => !seen.has(c.id))];
      });
      setCategoriesPage(pagination.page || nextPage);
      setCategoriesHasMore(pagination.page < pagination.totalPages);
    } finally {
      setCategoriesLoadingMore(false);
    }
  }, [categoriesLoadingMore, categoriesHasMore, categoriesPage]);

  const loadMoreSubcategories = useCallback(async () => {
    if (!form.categoryId || subcategoriesLoadingMore || !subcategoriesHasMore) return;
    const categoryId = Number(form.categoryId);
    setSubcategoriesLoadingMore(true);
    try {
      const nextPage = subcategoriesPage + 1;
      const { results, pagination } = await fetchSubcategories(categoryId, {
        page: nextPage,
        limit: 20,
        is_active: true,
      });
      setSubcategories((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...results.filter((s) => !seen.has(s.id))];
      });
      setSubcategoriesPage(pagination.page || nextPage);
      setSubcategoriesHasMore(pagination.page < pagination.totalPages);
    } finally {
      setSubcategoriesLoadingMore(false);
    }
  }, [form.categoryId, subcategoriesLoadingMore, subcategoriesHasMore, subcategoriesPage]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key] && !(key === "visibility" && prev.sellerIds)) return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "visibility") delete next.sellerIds;
      return next;
    });
    if (key === "visibility" && value === "PUBLIC") {
      setSellerIds([]);
      setSelectedSellers([]);
    }
  }

  function fieldError(name: keyof FormErrors): string | undefined {
    return fieldErrors[name];
  }

  function errorClass(name: keyof FormErrors): string {
    return fieldError(name) 
      ? "border-red-300 focus:border-error focus:ring-2 focus:ring-error/20" 
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary-hover";
  }

  function scrollToErrors(errors: FormErrors) {
    scrollToFirstFormError(errors as Record<string, string>, {
      fieldOrder: FIELD_ERROR_ORDER,
      fieldIds: FIELD_IDS as Record<string, string>,
    });
  }

  function getStepErrors(stepIndex: number): FormErrors {
    const stepKey = WIZARD_STEPS[stepIndex]?.key;
    if (!stepKey) return {};

    const allErrors = validateForm(form, sellerIds);
    const relevantKeys = ERROR_KEYS_BY_STEP[stepKey];
    const stepErrors: FormErrors = {};

    for (const key of relevantKeys) {
      if (allErrors[key]) stepErrors[key] = allErrors[key];
    }

    return stepErrors;
  }

  function validateStep(stepIndex: number) {
    const stepErrors = getStepErrors(stepIndex);
    if (Object.keys(stepErrors).length > 0) {
      setFieldErrors(stepErrors);
      scrollToErrors(stepErrors);
      return false;
    }
    return true;
  }

  function goToNextStep() {
    if (submitting) return;
    if (activeStepIndex >= lastStepIndex) return;
    if (!validateStep(activeStepIndex)) return;

    const nextIndex = activeStepIndex + 1;
    // Defer step change so the same click does not land on the submit button
    // that replaces "Next" in the same layout slot.
    window.setTimeout(() => {
      setFieldErrors({});
      setActiveStepIndex(nextIndex);
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
    }, 0);
  }

  function goToPrevStep() {
    if (submitting) return;
    setActiveStepIndex((prev) => Math.max(0, prev - 1));
    setFieldErrors({});
  }

  function goToStep(stepIndex: number) {
    if (submitting) return;
    if (stepIndex < 0 || stepIndex > maxReachedStepIndex) return;
    setActiveStepIndex(stepIndex);
    setFieldErrors({});
  }

  function jumpToFieldError(errors: FormErrors) {
    const firstErrorKey = FIELD_ERROR_ORDER.find((key) => errors[key]);
    if (!firstErrorKey) return;
    const stepIndex = STEP_INDEX_BY_FIELD[firstErrorKey] ?? 0;
    setActiveStepIndex(stepIndex);
    setMaxReachedStepIndex((prev) => Math.max(prev, stepIndex));
    setTimeout(() => scrollToErrors(errors), 0);
  }

  async function submitRfq() {
    const clientErrors = validateForm(form, sellerIds);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      jumpToFieldError(clientErrors);
      return;
    }

    const payload: CreateRfqPayload = {
      title: form.title.trim(),
      category_id: Number(form.categoryId),
      subcategory_id: Number(form.subcategoryId),
      description: form.description.trim(),
      quantity: Math.floor(Number(form.quantity)),
      unit: form.unit.trim(),
      quotation_deadline: dateInputToIso(form.quotationDeadline),
      address_line_1: form.addressLine1.trim(),
      ...(form.addressLine2.trim() ? { address_line_2: form.addressLine2.trim() } : {}),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
      currency: form.currency,
      visibility: form.visibility,
      ...(form.visibility === "PRIVATE" ? { seller_ids: sellerIds } : {}),
      ...(form.paymentTerms.trim() ? { payment_terms: form.paymentTerms.trim() } : {}),
      ...(form.requiredBefore ? { required_before: dateInputToIso(form.requiredBefore) } : {}),
      ...(form.productId ? { product_id: Number(form.productId) } : {}),
      ...(form.expectedPrice ? { expected_price: Number(form.expectedPrice) } : {}),
      ...(form.budget ? { budget: Number(form.budget) } : {}),
    };

    setSubmitting(true);
    setFieldErrors({});

    try {
      if (isEditMode && rfqId) {
        await updateRfq(rfqId, payload);
        if (form.publishNow) {
          await publishRfq(rfqId);
        }
        showSuccessToast(
          form.publishNow ? "Draft updated and published" : "Draft RFQ updated"
        );
        router.push(`/buyer/rfq/${rfqId}`);
      } else {
        const created = await createRfq(payload);
        if (form.publishNow && created.id) {
          await publishRfq(created.id);
        }
        showSuccessToast(form.publishNow ? "RFQ posted successfully" : "RFQ saved as draft");
        router.push(`/buyer/rfq/${created.id}`);
      }
    } catch (err) {
      const apiErrors = mapApiErrorsToForm(getApiFieldErrors(err));
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        jumpToFieldError(apiErrors);
        return;
      }
      showErrorToast(
        formatApiValidationSummary(
          err,
          isEditMode ? "Failed to update draft RFQ" : "Failed to post requirement"
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    if (activeStepIndex !== lastStepIndex) {
      goToNextStep();
      return;
    }

    await submitRfq();
  }

  const inputClass = (name: keyof FormState) =>
    `w-full h-11 rounded-lg border bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted-fg outline-none transition-all duration-200 ${errorClass(name)}`;
  const textareaClass = (name: keyof FormState) =>
    `w-full min-h-[7.5rem] rounded-lg border bg-white px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-fg outline-none transition-all duration-200 resize-y ${errorClass(name)}`;
  const selectClass = "!h-11";
  const labelClass = "mb-2 block text-sm font-medium text-foreground";

  function FieldHint({ name }: { name: keyof FormErrors }) {
    const message = fieldError(name);
    if (!message) return null;
    return <p className="mt-2 text-sm font-medium text-error">{message}</p>;
  }

  function RequiredLabel({ children }: { children: React.ReactNode }) {
    return (
      <label className={labelClass}>
        {children} <span className="ml-1 text-error">*</span>
      </label>
    );
  }

  if (loadingRfq) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-base text-muted-fg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading draft RFQ...
      </div>
    );
  }

  if (editBlocked) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-base text-muted-fg mb-4">{editBlocked}</p>
        {rfqId ? (
          <Button
            type="button"
            onClick={() => router.push(`/buyer/rfq/${rfqId}`)}
            variant="primary"
            size="md"
          >
            Back to RFQ
          </Button>
        ) : null}
      </div>
    );
  }

  const submitLabel = isEditMode
    ? form.publishNow
      ? "Update & Publish"
      : "Update Draft"
    : form.publishNow
      ? "Post Requirement"
      : "Save Draft";

  const submitLoadingText = isEditMode ? "Updating..." : "Posting...";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
      <div className="rounded-lg border border-primary-soft bg-primary-soft/30 px-4 py-3">
        <p className="text-sm text-muted-fg">
          Fields marked with <span className="font-medium text-error">*</span> are required. Complete all steps to post your requirement.
        </p>
      </div>

      <ProductWizardStepper
        steps={WIZARD_STEPS}
        activeIndex={activeStepIndex}
        maxReachedIndex={maxReachedStepIndex}
        onStepClick={goToStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeStepIndex === 0 ? (
      <Section title="Requirement Details">
        <div data-form-field="title">
          <RequiredLabel>Requirement Title</RequiredLabel>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Bulk Industrial Steel Pipes for Construction"
              className={inputClass("title")}
              minLength={2}
              maxLength={200}
            />
          <FieldHint name="title" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div data-form-field="categoryId">
            <RequiredLabel>Category</RequiredLabel>
            <Select
              id="rfq-category"
              className={selectClass}
              value={form.categoryId}
              onChange={(e) => {
                updateField("categoryId", e.target.value);
                updateField("subcategoryId", "");
                updateField("productId", "");
              }}
              placeholder={loadingCategories ? "Loading..." : "Select category"}
              options={categories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
              disabled={loadingCategories}
              hasMore={categoriesHasMore}
              loadingMore={categoriesLoadingMore}
              onLoadMore={loadMoreCategories}
              error={!!fieldError("categoryId")}
              required
            />
            <FieldHint name="categoryId" />
          </div>
          <div data-form-field="subcategoryId">
            <RequiredLabel>Subcategory</RequiredLabel>
            <Select
              id="rfq-subcategory"
              className={selectClass}
              value={form.subcategoryId}
              onChange={(e) => {
                updateField("subcategoryId", e.target.value);
                updateField("productId", "");
              }}
              placeholder={
                !form.categoryId
                  ? "Select category first"
                  : loadingSubcategories
                    ? "Loading..."
                    : "Select subcategory"
              }
              options={subcategories.map((sub) => ({ value: String(sub.id), label: sub.name }))}
              disabled={!form.categoryId || loadingSubcategories}
              hasMore={subcategoriesHasMore}
              loadingMore={subcategoriesLoadingMore}
              onLoadMore={loadMoreSubcategories}
              error={!!fieldError("subcategoryId")}
              required
            />
            <FieldHint name="subcategoryId" />
          </div>
        </div>

        <div data-form-field="description">
          <RequiredLabel>Description</RequiredLabel>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={4}
            placeholder="Detailed specifications, quality requirements, delivery timeline, and any specific preferences (minimum 10 characters)..."
            className={textareaClass("description")}
            minLength={10}
          />
          <FieldHint name="description" />
        </div>

        <div data-form-field="productId">
          <label className={labelClass}>Linked product</label>
          <ProductSelect
            id="rfq-product"
            className={selectClass}
            value={form.productId}
            onChange={(productId) => updateField("productId", productId)}
            subcategoryId={form.subcategoryId}
          />
        </div>
      </Section>
          ) : null}

          {activeStepIndex === 1 ? (
      <Section title="Quantity & Budget">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div data-form-field="quantity">
            <RequiredLabel>Quantity</RequiredLabel>
            <input
              type="number"
              min={1}
              step={1}
              value={form.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
              className={inputClass("quantity")}
            />
            <FieldHint name="quantity" />
          </div>
          <div data-form-field="unit">
            <RequiredLabel>Unit</RequiredLabel>
            <Select
              id="rfq-unit"
              className={selectClass}
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              placeholder="Select unit"
              options={getUnitOptions(form.unit)}
              error={!!fieldError("unit")}
              searchable={false}
              required
            />
            <FieldHint name="unit" />
          </div>
          <div>
            <label className={labelClass}>Expected unit price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.expectedPrice}
              onChange={(e) => updateField("expectedPrice", e.target.value)}
              className={inputClass("expectedPrice")}
            />
          </div>
          <div>
            <label className={labelClass}>Budget</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.budget}
              onChange={(e) => updateField("budget", e.target.value)}
              className={inputClass("budget")}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div data-form-field="quotationDeadline">
            <RequiredLabel>Quotation deadline</RequiredLabel>
            <DateInput
              value={form.quotationDeadline}
              onChange={(e) => updateField("quotationDeadline", e.target.value)}
              error={!!fieldError("quotationDeadline")}
            />
            <FieldHint name="quotationDeadline" />
          </div>
          <div>
            <label className={labelClass}>Required before</label>
            <DateInput
              value={form.requiredBefore}
              onChange={(e) => updateField("requiredBefore", e.target.value)}
            />
          </div>
        </div>
      </Section>
          ) : null}

          {activeStepIndex === 2 ? (
      <Section title="Delivery Address">
        <div data-form-field="addressLine1">
          <RequiredLabel>Address line 1</RequiredLabel>
          <input
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            placeholder="Street address, building number, area"
            className={inputClass("addressLine1")}
          />
          <FieldHint name="addressLine1" />
        </div>

        <div>
          <label className={labelClass}>Address line 2</label>
          <input
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            placeholder="Landmark, suite number, floor (optional)"
            className={inputClass("addressLine2")}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div data-form-field="state">
            <RequiredLabel>State</RequiredLabel>
            <StateSelect
              id="rfq-state"
              value={stateId}
              selectedLabel={form.state}
              placeholder="Select state"
              emptyLabel="Select state"
              error={Boolean(fieldErrors.state)}
              onChange={(nextId, label) => {
                setStateId(nextId);
                setCityId("");
                setForm((prev) => ({
                  ...prev,
                  state: nextId && label ? label : "",
                  city: "",
                }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.state;
                  delete next.city;
                  return next;
                });
              }}
              className={selectClass}
            />
            <FieldHint name="state" />
          </div>
          <div data-form-field="city">
            <RequiredLabel>City</RequiredLabel>
            <CitySelect
              id="rfq-city"
              value={cityId}
              selectedLabel={form.city}
              stateId={stateId}
              placeholder={stateId ? "Select city" : "Select state first"}
              emptyLabel="Select city"
              disabled={!stateId}
              error={Boolean(fieldErrors.city)}
              onChange={(nextId, label) => {
                setCityId(nextId);
                setForm((prev) => ({
                  ...prev,
                  city: nextId && label ? label : "",
                }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.city;
                  return next;
                });
              }}
              className={selectClass}
            />
            <FieldHint name="city" />
          </div>
          <div data-form-field="country">
            <RequiredLabel>Country</RequiredLabel>
            <input
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={inputClass("country")}
            />
            <FieldHint name="country" />
          </div>
          <div data-form-field="pincode">
            <RequiredLabel>Pincode</RequiredLabel>
            <input
              value={form.pincode}
              onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="6-digit pincode"
              className={inputClass("pincode")}
            />
            <FieldHint name="pincode" />
          </div>
        </div>
      </Section>
          ) : null}

          {activeStepIndex === 3 ? (
      <Section title="Listing Settings">
        <div data-form-field="visibility">
          <RequiredLabel>Visibility</RequiredLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateField("visibility", "PUBLIC")}
              className={`group relative rounded-lg border-2 p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ${
                form.visibility === "PUBLIC"
                  ? "border-primary bg-primary-soft/50"
                  : "border-border bg-white hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Public</p>
                  <p className="mt-1 text-sm text-muted-fg">
                    Visible to all sellers in the marketplace
                  </p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 transition-all ${
                  form.visibility === "PUBLIC"
                    ? "border-primary bg-primary"
                    : "border-border group-hover:border-primary/50"
                }`}>
                  {form.visibility === "PUBLIC" && (
                    <div className="h-full w-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => updateField("visibility", "PRIVATE")}
              className={`group relative rounded-lg border-2 p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ${
                form.visibility === "PRIVATE"
                  ? "border-primary bg-primary-soft/50"
                  : "border-border bg-white hover:border-primary/50 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Private</p>
                  <p className="mt-1 text-sm text-muted-fg">
                    Invite specific sellers only
                  </p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 transition-all ${
                  form.visibility === "PRIVATE"
                    ? "border-primary bg-primary"
                    : "border-border group-hover:border-primary/50"
                }`}>
                  {form.visibility === "PRIVATE" && (
                    <div className="h-full w-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </button>
          </div>
          <FieldHint name="visibility" />
        </div>

        {form.visibility === "PRIVATE" ? (
          <div data-form-field="sellerIds" className="rounded-lg border border-primary-soft bg-primary-soft/20 p-4">
            <RequiredLabel>Invite sellers</RequiredLabel>
            <p className="mb-3 text-sm text-muted-fg">
              Search and select sellers who can see and quote on this RFQ.
            </p>
            <SellerMultiSelect
              selectedIds={sellerIds}
              selectedSellers={selectedSellers}
              error={Boolean(fieldError("sellerIds"))}
              onChange={(ids, sellers) => {
                setSellerIds(ids);
                setSelectedSellers(sellers);
                setFieldErrors((prev) => {
                  if (!prev.sellerIds) return prev;
                  const next = { ...prev };
                  delete next.sellerIds;
                  return next;
                });
              }}
            />
            <FieldHint name="sellerIds" />
          </div>
        ) : null}

        <div>
          <label className={labelClass}>Payment terms</label>
            <input
              value={form.paymentTerms}
              onChange={(e) => updateField("paymentTerms", e.target.value)}
              placeholder="e.g., 50% advance, 50% on delivery"
              className={inputClass("paymentTerms")}
            />
        </div>

        <div className="rounded-lg border border-border bg-muted p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => updateField("publishNow", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Publish immediately
              </p>
              <p className="mt-1 text-sm text-muted-fg">
                Make your RFQ visible to sellers right away so they can start quoting
              </p>
            </div>
          </label>
        </div>
      </Section>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-border bg-white/95 px-4 py-4 backdrop-blur-sm sm:relative sm:z-auto sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            {activeStepIndex > 0 ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                onClick={goToPrevStep}
                disabled={submitting}
                className="sm:w-auto sm:min-w-[120px]"
              >
                Back
              </Button>
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
            {activeStepIndex < lastStepIndex ? (
              <Button
                type="button"
                fullWidth
                size="lg"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToNextStep}
                disabled={submitting}
                className="!bg-primary hover:!bg-primary-hover sm:w-auto sm:min-w-[120px]"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                variant="accent"
                fullWidth
                size="lg"
                loading={submitting}
                loadingText={submitLoadingText}
                onClick={() => void submitRfq()}
                className="sm:w-auto sm:min-w-[160px]"
              >
                {submitLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
