"use client";

import React, { useEffect, useState } from "react";
import { FormField } from "@/components/common/FormField";
import { Textarea } from "@/components/common/Textarea";
import type { CompleteProfileFormData, UserRole } from "@/types/auth";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import {
  Building2,
  Factory,
  FileText,
  Globe,
  ImagePlus,
  Landmark,
  Loader2,
  MapPin,
  AlertCircle,
  X,
} from "lucide-react";

export const EMPTY_COMPLETE_PROFILE_FORM: CompleteProfileFormData = {
  companyName: "",
  industry: "",
  gstNumber: "",
  address: "",
  country: "India",
  panNumber: "",
  cinNumber: "",
  iecNumber: "",
  businessDescription: "",
  profileImageFile: null,
  companyLogoFile: null,
  companyBannerFile: null,
  profileImageUrl: "",
  companyLogoUrl: "",
  companyBannerUrl: "",
};

function IconInput({
  id,
  icon: Icon,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        className={`h-11 w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"
        } ${className}`}
        {...props}
      />
    </div>
  );
}

function ImageUploadField({
  label,
  htmlFor,
  required,
  error,
  align = "stretch",
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  align?: "center" | "stretch";
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className={align === "center" ? "flex justify-center" : ""}>{children}</div>
      {error && (
        <p
          className={`flex items-center gap-1 text-xs font-medium text-red-500 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function UploadTile({
  label,
  file,
  existingUrl,
  onChange,
  onClearExisting,
  fit = "cover",
  className = "",
  error,
}: {
  label: string;
  file: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  onClearExisting?: () => void;
  fit?: "cover" | "contain";
  className?: string;
  error?: boolean;
}) {
  const inputId = React.useId();
  const blobPreview = React.useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  React.useEffect(() => {
    return () => {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
    };
  }, [blobPreview]);

  const previewUrl = blobPreview ?? (existingUrl?.trim() ? existingUrl : null);
  const borderClass = error ? "border-red-400" : "border-slate-200 hover:border-blue-500/40";
  const imageFitClass =
    fit === "contain" ? "object-contain object-center p-2" : "object-cover object-center";

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    onClearExisting?.();
  }

  if (previewUrl) {
    return (
      <div
        className={`relative h-36 w-full overflow-hidden rounded-xl border bg-slate-50 ${borderClass} ${className}`}
      >
        <label
          htmlFor={inputId}
          className="group relative block h-full w-full cursor-pointer"
          aria-label={`Change ${label}`}
        >
          <img
            src={previewUrl}
            alt={label}
            className={`h-full w-full ${imageFitClass}`}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/30">
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              Click to change
            </span>
          </div>
        </label>
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-2 top-2 z-10 rounded-lg bg-white/95 p-1 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-red-500"
          aria-label={`Remove ${label}`}
        >
          <X className="h-4 w-4" />
        </button>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    );
  }

  return (
    <label
      htmlFor={inputId}
      className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-slate-50/80 px-3 text-center transition-colors hover:bg-blue-50/80 ${borderClass} ${className}`}
    >
      <ImagePlus className="h-6 w-6 shrink-0 text-blue-500" />
      <span className="text-xs font-semibold leading-tight text-slate-700">{label}</span>
      <span className="text-[11px] leading-tight text-slate-400">PNG, JPG up to 5MB</span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

interface CompleteProfileFormProps {
  role: UserRole;
  initialValues?: CompleteProfileFormData;
  onSubmit: (data: CompleteProfileFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  fieldIdPrefix?: string;
  formId?: string;
  showIntro?: boolean;
  hideSubmitButton?: boolean;
}

export default function CompleteProfileForm({
  role,
  initialValues,
  onSubmit,
  loading = false,
  error = null,
  fieldIdPrefix = "cp",
  formId = "complete-profile-form",
  showIntro = true,
  hideSubmitButton = false,
}: CompleteProfileFormProps) {
  const showBuyerFields = role === "buyer" || role === "both";
  const showSellerFields = role === "seller" || role === "both";
  const showSellerOnlyFields = role === "seller";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<CompleteProfileFormData>(EMPTY_COMPLETE_PROFILE_FORM);

  const MAX_IMAGE_SIZE_MB = 5;
  const id = (key: string) => `${fieldIdPrefix}-${key}`;

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    }
  }, [initialValues]);

  const updateForm = (patch: Partial<CompleteProfileFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleImageChange = (
    file: File | null,
    onValid: (file: File | null) => void,
    errorKey: string
  ) => {
    if (!file) {
      onValid(null);
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: `Image must be under ${MAX_IMAGE_SIZE_MB}MB`,
      }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, [errorKey]: "Please upload a valid image file" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    onValid(file);
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.companyName.trim()) next.companyName = "Company name is required";

    if (showBuyerFields) {
      if (!form.industry.trim()) next.industry = "Industry is required";
      if (!form.address.trim()) next.address = "Address is required";
    }

    if (showSellerFields) {
      if (!form.gstNumber.trim()) next.gstNumber = "GST number is required";
      if (!form.panNumber.trim()) next.panNumber = "PAN number is required";
      if (!form.businessDescription.trim()) {
        next.businessDescription = "Business description is required";
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const fieldOrder =
        role === "seller"
          ? ["companyName", "gstNumber", "panNumber", "businessDescription"]
          : role === "both"
            ? [
                "companyName",
                "industry",
                "address",
                "gstNumber",
                "panNumber",
                "businessDescription",
              ]
            : ["companyName", "industry", "address", "gstNumber"];

      scrollToFirstFormError(next, {
        fieldOrder,
        fieldIds: {
          companyName: id("company"),
          industry: id("industry"),
          address: id("address"),
          gstNumber: id("gst"),
          panNumber: id("pan"),
          businessDescription: id("description"),
        },
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      {showIntro ? (
        <p className="text-sm leading-relaxed text-slate-600">
          Update your business details. Fields match your account profile on TradeNexa.
        </p>
      ) : null}

      {showBuyerFields && (
        <ImageUploadField
          label="Logo / Profile Image"
          htmlFor={id("profile-image")}
          align="center"
          error={errors.profileImageFile}
        >
          <UploadTile
            label="Add Logo / Profile"
            file={form.profileImageFile}
            existingUrl={form.profileImageUrl}
            fit="contain"
            onChange={(file) =>
              handleImageChange(
                file,
                (validFile) => updateForm({ profileImageFile: validFile }),
                "profileImageFile"
              )
            }
            onClearExisting={() => updateForm({ profileImageUrl: "" })}
            error={!!errors.profileImageFile}
            className="w-full max-w-[220px]"
          />
        </ImageUploadField>
      )}

      {showSellerFields && (
        <div className="grid grid-cols-2 gap-3">
          <ImageUploadField label="Logo" htmlFor={id("company-logo")} error={errors.companyLogoFile}>
            <UploadTile
              label="Upload Logo"
              file={form.companyLogoFile}
              existingUrl={form.companyLogoUrl}
              fit="contain"
              onChange={(file) =>
                handleImageChange(
                  file,
                  (validFile) => updateForm({ companyLogoFile: validFile }),
                  "companyLogoFile"
                )
              }
              onClearExisting={() => updateForm({ companyLogoUrl: "" })}
              error={!!errors.companyLogoFile}
            />
          </ImageUploadField>
          <ImageUploadField label="Banner" htmlFor={id("company-banner")} error={errors.companyBannerFile}>
            <UploadTile
              label="Upload Banner"
              file={form.companyBannerFile}
              existingUrl={form.companyBannerUrl}
              fit="cover"
              onChange={(file) =>
                handleImageChange(
                  file,
                  (validFile) => updateForm({ companyBannerFile: validFile }),
                  "companyBannerFile"
                )
              }
              onClearExisting={() => updateForm({ companyBannerUrl: "" })}
              error={!!errors.companyBannerFile}
            />
          </ImageUploadField>
        </div>
      )}

      <div className="space-y-4">
        <FormField label="Company Name" htmlFor={id("company")} required error={errors.companyName}>
          <IconInput
            id={id("company")}
            icon={Building2}
            placeholder="Enter company name"
            value={form.companyName}
            error={!!errors.companyName}
            onChange={(e) => {
              updateForm({ companyName: e.target.value });
              if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: "" }));
            }}
          />
        </FormField>

        {showBuyerFields && (
          <>
            <FormField label="Industry" htmlFor={id("industry")} required error={errors.industry}>
              <IconInput
                id={id("industry")}
                icon={Factory}
                placeholder="e.g. Textiles, Electronics"
                value={form.industry}
                error={!!errors.industry}
                onChange={(e) => updateForm({ industry: e.target.value })}
              />
            </FormField>

            <FormField label="Address" htmlFor={id("address")} required error={errors.address}>
              <IconInput
                id={id("address")}
                icon={MapPin}
                placeholder="Enter physical address"
                value={form.address}
                error={!!errors.address}
                onChange={(e) => updateForm({ address: e.target.value })}
              />
            </FormField>

            <FormField label="Country" htmlFor={id("country")}>
              <IconInput
                id={id("country")}
                icon={Globe}
                value={form.country}
                readOnly
                className="cursor-not-allowed bg-slate-50 text-slate-700"
              />
            </FormField>
          </>
        )}

        <FormField
          label={role === "buyer" ? "GST Number (Optional)" : "GST Number"}
          htmlFor={id("gst")}
          required={showSellerFields}
          error={errors.gstNumber}
        >
          <IconInput
            id={id("gst")}
            icon={FileText}
            placeholder={role === "buyer" ? "GSTIN (Optional)" : "GSTIN (Required)"}
            value={form.gstNumber}
            error={!!errors.gstNumber}
            onChange={(e) => updateForm({ gstNumber: e.target.value })}
          />
        </FormField>

        {showSellerFields && (
          <>
            <FormField label="PAN Number" htmlFor={id("pan")} required error={errors.panNumber}>
              <IconInput
                id={id("pan")}
                icon={Landmark}
                placeholder="Enter PAN Card Number"
                value={form.panNumber}
                error={!!errors.panNumber}
                onChange={(e) => updateForm({ panNumber: e.target.value })}
              />
            </FormField>

            {showSellerOnlyFields && (
              <>
                <FormField label="CIN (Optional)" htmlFor={id("cin")}>
                  <IconInput
                    id={id("cin")}
                    icon={FileText}
                    placeholder="CIN (Optional)"
                    value={form.cinNumber}
                    onChange={(e) => updateForm({ cinNumber: e.target.value })}
                  />
                </FormField>

                <FormField label="IEC (Optional)" htmlFor={id("iec")}>
                  <IconInput
                    id={id("iec")}
                    icon={FileText}
                    placeholder="IEC (Optional)"
                    value={form.iecNumber}
                    onChange={(e) => updateForm({ iecNumber: e.target.value })}
                  />
                </FormField>
              </>
            )}

            <FormField
              label="Business Description"
              htmlFor={id("description")}
              required
              error={errors.businessDescription}
            >
              <Textarea
                id={id("description")}
                rows={4}
                placeholder="Describe your business operations..."
                value={form.businessDescription}
                error={!!errors.businessDescription}
                onChange={(e) => updateForm({ businessDescription: e.target.value })}
              />
            </FormField>
          </>
        )}
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>
      ) : null}

      {!hideSubmitButton ? (
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      ) : null}
    </form>
  );
}
