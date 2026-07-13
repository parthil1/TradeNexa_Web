"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import type { ApiQuotation } from "@/types/rfq";
import { updateQuotation } from "@/services/rfqService";
import { formatApiValidationSummary, getApiFieldErrors } from "@/utils/apiErrors";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import {
  buildQuotationPayload,
  mapQuotationApiErrorsToForm,
  QuotationFormActions,
  QuotationFormFields,
  QuotationTotalSummary,
  quotationToFormState,
  QUOTATION_FIELD_ERROR_ORDER,
  useQuotationFormState,
  validateQuotationForm,
  type QuotationFormViewModel,
} from "@/components/rfq/SubmitQuotationForm";

export const UPDATE_QUOTATION_FORM_ID = "update-quotation-form";

interface UpdateQuotationFormProps {
  quotation: ApiQuotation;
  onUpdated?: (updated: ApiQuotation) => void;
  onCancel?: () => void;
}

interface UpdateQuotationFormModalProps extends UpdateQuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

function useUpdateQuotationForm({
  quotation,
  onUpdated,
}: UpdateQuotationFormProps): QuotationFormViewModel {
  const vm = useQuotationFormState({
    initialValues: quotationToFormState(quotation),
    lockedUnit: quotation.unit,
  });
  const { form, submitting, setSubmitting, setFieldErrors, ...rest } = vm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const clientErrors = validateQuotationForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      scrollToFirstFormError(clientErrors as Record<string, string>, {
        fieldOrder: QUOTATION_FIELD_ERROR_ORDER,
      });
      return;
    }

    const payload = buildQuotationPayload(form);

    setSubmitting(true);
    setFieldErrors({});

    try {
      const updated = await updateQuotation(quotation.id, payload);
      showSuccessToast("Quotation updated");
      onUpdated?.(updated);
    } catch (err) {
      const apiErrors = mapQuotationApiErrorsToForm(getApiFieldErrors(err));
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        scrollToFirstFormError(apiErrors as Record<string, string>, {
          fieldOrder: QUOTATION_FIELD_ERROR_ORDER,
        });
        return;
      }
      showErrorToast(formatApiValidationSummary(err, "Failed to update quotation"));
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

function UpdateQuotationForm(props: UpdateQuotationFormProps) {
  const vm = useUpdateQuotationForm(props);

  return (
    <form onSubmit={(e) => void vm.handleSubmit(e)} noValidate className="space-y-5">
      <QuotationFormFields vm={vm} hideHeader />
      <QuotationTotalSummary liveTotal={vm.liveTotal} />
      <QuotationFormActions
        submitting={vm.submitting}
        onCancel={props.onCancel}
        submitLabel="Save changes"
      />
    </form>
  );
}

export function UpdateQuotationFormModal({
  isOpen,
  onClose,
  quotation,
  onUpdated,
}: UpdateQuotationFormModalProps) {
  const vm = useUpdateQuotationForm({
    quotation,
    onUpdated: (updated) => {
      onUpdated?.(updated);
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
          <p className="text-lg font-extrabold text-foreground">Update quotation</p>
          <p className="mt-0.5 truncate text-sm font-medium text-muted-fg">
            Quote #{quotation.id}
            {quotation.quantity != null
              ? ` · ${quotation.quantity} ${quotation.unit ?? ""}`
              : ""}
          </p>
        </div>
      }
      footer={
        <div className="space-y-3">
          <QuotationTotalSummary liveTotal={vm.liveTotal} compact />
          <QuotationFormActions
            formId={UPDATE_QUOTATION_FORM_ID}
            submitting={vm.submitting}
            onCancel={onClose}
            submitLabel="Save changes"
          />
        </div>
      }
    >
      <form
        id={UPDATE_QUOTATION_FORM_ID}
        onSubmit={(e) => void vm.handleSubmit(e)}
        noValidate
        className="space-y-5"
      >
        <QuotationFormFields vm={vm} hideHeader />
      </form>
    </Modal>
  );
}

export default UpdateQuotationForm;
