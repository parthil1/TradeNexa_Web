"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { FormField } from "@/components/common/FormField";
import { Textarea } from "@/components/common/Textarea";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";
import {
  Building2,
  Factory,
  FileText,
  Globe,
  ImagePlus,
  Landmark,
  Loader2,
  MapPin,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";

const INITIAL_FORM = {
  companyName: "",
  industry: "",
  gstNumber: "",
  address: "",
  country: "India",
  panNumber: "",
  cinNumber: "",
  iecNumber: "",
  businessDescription: "",
  profileImageFile: null as File | null,
  companyLogoFile: null as File | null,
  companyBannerFile: null as File | null,
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
        className={`h-11 w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
          error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
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
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
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
  onChange,
  className = "",
  error,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  error?: boolean;
  variant?: "square" | "banner";
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputId = React.useId();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const borderClass = error
    ? "border-red-400"
    : "border-slate-200 hover:border-primary/40";

  if (previewUrl && file) {
    return (
      <div
        className={`relative h-36 w-full overflow-hidden rounded-xl border bg-white ${borderClass} ${className}`}
      >
        <label
          htmlFor={inputId}
          className="group relative block h-full w-full cursor-pointer"
          aria-label={`Change ${label}`}
        >
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors group-hover:bg-slate-900/30">
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              Click to change
            </span>
          </div>
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onChange(null);
          }}
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
      className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-slate-50/80 px-3 text-center transition-colors hover:bg-primary/5 ${borderClass} ${className}`}
    >
      <ImagePlus className="h-6 w-6 shrink-0 text-primary" />
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

export default function CompleteProfileModal() {
  const {
    isCompleteProfileOpen,
    completeProfileRole,
    completeProfileState,
    skipCompleteProfile,
    completeProfileAction,
  } = useAuth();

  const role: UserRole = completeProfileRole || "buyer";
  const showBuyerFields = role === "buyer" || role === "both";
  const showSellerFields = role === "seller" || role === "both";
  const showSellerOnlyFields = role === "seller";

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(INITIAL_FORM);

  const MAX_IMAGE_SIZE_MB = 5;

  const updateForm = (patch: Partial<typeof INITIAL_FORM>) => {
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

  const title =
    role === "seller"
      ? "Complete Seller Profile"
      : role === "both"
        ? "Complete Business Profile"
        : "Complete Buyer Profile";

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.companyName.trim()) next.companyName = "Company name is required";

    if (showBuyerFields) {
      if (!form.industry.trim()) next.industry = "Industry is required";
      if (!form.address.trim()) next.address = "Address is required";
      if (!form.profileImageFile) next.profileImageFile = "Profile image is required";
    }

    if (showSellerFields) {
      if (!form.gstNumber.trim()) next.gstNumber = "GST number is required";
      if (!form.panNumber.trim()) next.panNumber = "PAN number is required";
      if (!form.businessDescription.trim()) {
        next.businessDescription = "Business description is required";
      }
      if (!form.companyLogoFile) next.companyLogoFile = "Logo image is required";
      if (!form.companyBannerFile) next.companyBannerFile = "Banner image is required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await completeProfileAction({ role, data: form });
  };

  if (!isCompleteProfileOpen) return null;

  const profileFooter = (
    <div className="space-y-3">
      <button
        type="submit"
        form="complete-profile-form"
        disabled={completeProfileState.loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-300"
      >
        {completeProfileState.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            Save Profile
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <button
        type="button"
        onClick={skipCompleteProfile}
        className="w-full text-center text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
      >
        Skip for now
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isCompleteProfileOpen}
      onClose={skipCompleteProfile}
      title={<span className="font-bold text-slate-950">{title}</span>}
      bodyClassName="px-6 py-6"
      footer={profileFooter}
      maxWidth="md"
    >
      <form id="complete-profile-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-center text-sm leading-relaxed text-slate-500">
          Tell us more about your business to get tailored recommendations.
        </p>

        {showBuyerFields && (
          <ImageUploadField
            label="Logo / Profile Image"
            htmlFor="cp-profile-image"
            required
            align="center"
            error={errors.profileImageFile}
          >
            <UploadTile
              label="Add Logo / Profile"
              file={form.profileImageFile}
              onChange={(file) =>
                handleImageChange(
                  file,
                  (validFile) => updateForm({ profileImageFile: validFile }),
                  "profileImageFile"
                )
              }
              error={!!errors.profileImageFile}
              className="w-full max-w-[220px]"
            />
          </ImageUploadField>
        )}

        {showSellerFields && (
          <div className="grid grid-cols-2 gap-3">
            <ImageUploadField
              label="Logo"
              htmlFor="cp-company-logo"
              required
              error={errors.companyLogoFile}
            >
              <UploadTile
                label="Upload Logo"
                file={form.companyLogoFile}
                onChange={(file) =>
                  handleImageChange(
                    file,
                    (validFile) => updateForm({ companyLogoFile: validFile }),
                    "companyLogoFile"
                  )
                }
                error={!!errors.companyLogoFile}
              />
            </ImageUploadField>
            <ImageUploadField
              label="Banner"
              htmlFor="cp-company-banner"
              required
              error={errors.companyBannerFile}
            >
              <UploadTile
                label="Upload Banner"
                file={form.companyBannerFile}
                onChange={(file) =>
                  handleImageChange(
                    file,
                    (validFile) => updateForm({ companyBannerFile: validFile }),
                    "companyBannerFile"
                  )
                }
                error={!!errors.companyBannerFile}
              />
            </ImageUploadField>
          </div>
        )}

        <div className="space-y-4">
          <FormField label="Company Name" htmlFor="cp-company" required error={errors.companyName}>
            <IconInput
              id="cp-company"
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
              <FormField label="Industry" htmlFor="cp-industry" required error={errors.industry}>
                <IconInput
                  id="cp-industry"
                  icon={Factory}
                  placeholder="e.g. Textiles, Electronics"
                  value={form.industry}
                  error={!!errors.industry}
                  onChange={(e) => updateForm({ industry: e.target.value })}
                />
              </FormField>

              <FormField label="Address" htmlFor="cp-address" required error={errors.address}>
                <IconInput
                  id="cp-address"
                  icon={MapPin}
                  placeholder="Enter physical address"
                  value={form.address}
                  error={!!errors.address}
                  onChange={(e) => updateForm({ address: e.target.value })}
                />
              </FormField>

              <FormField label="Country" htmlFor="cp-country">
                <IconInput
                  id="cp-country"
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
            htmlFor="cp-gst"
            required={showSellerFields}
            error={errors.gstNumber}
          >
            <IconInput
              id="cp-gst"
              icon={FileText}
              placeholder={role === "buyer" ? "GSTIN (Optional)" : "GSTIN (Required)"}
              value={form.gstNumber}
              error={!!errors.gstNumber}
              onChange={(e) => updateForm({ gstNumber: e.target.value })}
            />
          </FormField>

          {showSellerFields && (
            <>
              <FormField label="PAN Number" htmlFor="cp-pan" required error={errors.panNumber}>
                <IconInput
                  id="cp-pan"
                  icon={Landmark}
                  placeholder="Enter PAN Card Number"
                  value={form.panNumber}
                  error={!!errors.panNumber}
                  onChange={(e) => updateForm({ panNumber: e.target.value })}
                />
              </FormField>

              {showSellerOnlyFields && (
                <>
                  <FormField label="CIN (Optional)" htmlFor="cp-cin">
                    <IconInput
                      id="cp-cin"
                      icon={FileText}
                      placeholder="CIN (Optional)"
                      value={form.cinNumber}
                      onChange={(e) => updateForm({ cinNumber: e.target.value })}
                    />
                  </FormField>

                  <FormField label="IEC (Optional)" htmlFor="cp-iec">
                    <IconInput
                      id="cp-iec"
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
                htmlFor="cp-description"
                required
                error={errors.businessDescription}
              >
                <Textarea
                  id="cp-description"
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

        {completeProfileState.error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
            {completeProfileState.error}
          </div>
        )}
      </form>
    </Modal>
  );
}
