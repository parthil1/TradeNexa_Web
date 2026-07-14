"use client";

import React, { useEffect, useRef, useState } from "react";
import { FormField } from "@/components/common/FormField";
import { Textarea } from "@/components/common/Textarea";
import StateSelect from "@/components/location/StateSelect";
import CitySelect from "@/components/location/CitySelect";
import type { CompleteProfileFormData, UserRole } from "@/types/auth";
import { useOptionalGeoLocation } from "@/context/GeoLocationContext";
import { fetchCities, fetchStates } from "@/services/locationService";
import { isGeoCacheFresh, readGeoLastLocation } from "@/utils/geoLocationStorage";
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
  city: "",
  state: "",
  pincode: "",
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
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
      <input
        id={id}
        className={`h-10 w-full rounded-lg border bg-card pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-placeholder outline-none transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25 ${
          error ? "border-error/40 bg-error-soft focus:border-error focus:ring-error/20" : "border-border hover:border-border-hover"
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
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>
      <div className={align === "center" ? "flex justify-center" : ""}>{children}</div>
      {error && (
        <p
          className={`flex items-center gap-1 text-xs font-medium text-error ${
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
  const borderClass = error ? "border-error/50" : "border-border hover:border-primary/40";
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
        className={`relative h-36 w-full overflow-hidden rounded-xl border bg-muted ${borderClass} ${className}`}
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
          <div className="absolute inset-0 flex items-center justify-center bg-navy/0 transition-colors group-hover:bg-navy/30">
            <span className="rounded-lg bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              Click to change
            </span>
          </div>
        </label>
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-2 top-2 z-10 rounded-lg bg-card/95 p-1 text-muted-fg shadow-sm transition-colors hover:bg-card hover:text-error"
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
      className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted px-3 text-center transition-colors hover:bg-primary-soft ${borderClass} ${className}`}
    >
      <ImagePlus className="h-6 w-6 shrink-0 text-primary" />
      <span className="text-xs font-semibold leading-tight text-foreground">{label}</span>
      <span className="text-[11px] leading-tight text-muted-fg">PNG, JPG up to 5MB</span>
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
  /** Prefill location selects from profile `state_id` / `city_id` when present. */
  initialStateId?: string | null;
  initialCityId?: string | null;
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
  initialStateId = null,
  initialCityId = null,
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
  const [form, setForm] = useState<CompleteProfileFormData>(
    () => initialValues ?? EMPTY_COMPLETE_PROFILE_FORM
  );
  const [stateId, setStateId] = useState(() => String(initialStateId ?? "").trim());
  const [cityId, setCityId] = useState(() => String(initialCityId ?? "").trim());
  const geo = useOptionalGeoLocation();
  const geoPrefillDone = useRef(false);
  const locationHydratedRef = useRef(false);

  const MAX_IMAGE_SIZE_MB = 5;
  const id = (key: string) => `${fieldIdPrefix}-${key}`;

  // Prefill from geo when profile has no saved state yet.
  useEffect(() => {
    if (geoPrefillDone.current || stateId || form.state?.trim()) return;
    if (initialValues?.state?.trim()) return;

    const apply = (
      nextStateId: number,
      nextCityId: number,
      stateName: string,
      cityName: string
    ) => {
      geoPrefillDone.current = true;
      setStateId(String(nextStateId));
      setCityId(String(nextCityId));
      setForm((prev) => ({
        ...prev,
        state: stateName || prev.state,
        city: cityName || prev.city,
      }));
    };

    const cached = readGeoLastLocation();
    if (cached && isGeoCacheFresh(cached)) {
      apply(
        cached.state_id,
        cached.city_id,
        cached.state_name?.trim() || "",
        cached.city_name?.trim() || ""
      );
      return;
    }

    if (geo?.stateId != null && geo.cityId != null) {
      apply(geo.stateId, geo.cityId, geo.stateName?.trim() || "", geo.cityName?.trim() || "");
    }
  }, [
    stateId,
    form.state,
    initialValues?.state,
    geo?.stateId,
    geo?.cityId,
    geo?.stateName,
    geo?.cityName,
  ]);

  useEffect(() => {
    if (!initialValues) return;

    const stateName = initialValues.state?.trim() || "";
    const cityName = initialValues.city?.trim() || "";
    const presetStateId = String(initialStateId ?? "").trim();
    const presetCityId = String(initialCityId ?? "").trim();

    setForm(initialValues);

    // Profile payload nests ids under address: state_id / city_id (e.g. city_id: 4).
    if (presetStateId && presetCityId) {
      setStateId(presetStateId);
      setCityId(presetCityId);
      locationHydratedRef.current = true;
      return;
    }

    if (presetStateId) {
      setStateId(presetStateId);
    }

    if (locationHydratedRef.current) return;

    let cancelled = false;

    function matchByName<T extends { name: string }>(items: T[], needle: string): T | null {
      const q = needle.trim().toLowerCase();
      if (!q || items.length === 0) return null;
      return (
        items.find((item) => item.name.toLowerCase() === q) ??
        items.find((item) => item.name.toLowerCase().startsWith(q)) ??
        items.find((item) => item.name.toLowerCase().includes(q)) ??
        items.find((item) => q.includes(item.name.toLowerCase())) ??
        null
      );
    }

    async function resolveLocationIds() {
      try {
        let matchedStateId = presetStateId ? Number(presetStateId) : NaN;

        if (!presetStateId) {
          if (!stateName) return;
          const { results: states } = await fetchStates({
            search: stateName,
            limit: 50,
            sort_by: "name",
            sort_order: "asc",
            is_active: true,
          });
          if (cancelled) return;
          const matchedState = matchByName(states, stateName);
          if (!matchedState) return;
          matchedStateId = matchedState.id;
          setStateId(String(matchedState.id));
          setForm((prev) => ({ ...prev, state: matchedState.name }));
        }

        if (!cityName || !Number.isFinite(matchedStateId) || matchedStateId <= 0) return;

        let matchedCity =
          matchByName(
            (
              await fetchCities({
                state_id: matchedStateId,
                search: cityName,
                limit: 50,
                sort_by: "name",
                sort_order: "asc",
                is_active: true,
              })
            ).results,
            cityName
          ) ?? null;

        if (!matchedCity) {
          matchedCity = matchByName(
            (
              await fetchCities({
                state_id: matchedStateId,
                limit: 100,
                sort_by: "name",
                sort_order: "asc",
                is_active: true,
              })
            ).results,
            cityName
          );
        }

        if (cancelled || !matchedCity) return;
        setCityId(String(matchedCity.id));
        setForm((prev) => ({ ...prev, city: matchedCity!.name }));
        locationHydratedRef.current = true;
      } catch {
        /* keep name-only city/state from profile */
      }
    }

    void resolveLocationIds();
    return () => {
      cancelled = true;
    };
  }, [initialValues, initialStateId, initialCityId]);

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
      if (!form.state.trim() || !stateId.trim()) next.state = "State is required";
      if (!form.city.trim() || !cityId.trim()) next.city = "City is required";
      const pincode = form.pincode.trim();
      if (!pincode) next.pincode = "Pincode is required";
      else if (!/^\d{6}$/.test(pincode)) next.pincode = "Enter a valid 6-digit pincode";
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
                "state",
                "city",
                "pincode",
                "gstNumber",
                "panNumber",
                "businessDescription",
              ]
            : ["companyName", "industry", "address", "state", "city", "pincode", "gstNumber"];

      scrollToFirstFormError(next, {
        fieldOrder,
        fieldIds: {
          companyName: id("company"),
          industry: id("industry"),
          address: id("address"),
          state: id("state"),
          city: id("city"),
          pincode: id("pincode"),
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
    // Send location IDs via the existing city/state fields for the API layer.
    await onSubmit({
      ...form,
      city: cityId.trim(),
      state: stateId.trim(),
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      {showIntro ? (
        <p className="text-sm leading-relaxed text-muted-fg">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="State" htmlFor={id("state")} required error={errors.state}>
                <StateSelect
                  id={id("state")}
                  value={stateId}
                  selectedLabel={form.state}
                  placeholder="Select state"
                  emptyLabel="Select state"
                  error={Boolean(errors.state)}
                  onChange={(nextId, label) => {
                    // Only clear city when the user actually changes state.
                    if (nextId !== stateId) {
                      setCityId("");
                      updateForm({
                        state: nextId && label ? label : "",
                        city: "",
                      });
                    } else if (label) {
                      updateForm({ state: label });
                    }
                    setStateId(nextId);
                    setErrors((prev) => ({ ...prev, state: "", city: "" }));
                  }}
                />
              </FormField>

              <FormField label="City" htmlFor={id("city")} required error={errors.city}>
                <CitySelect
                  id={id("city")}
                  value={cityId}
                  selectedLabel={form.city}
                  stateId={stateId}
                  placeholder={stateId ? "Select city" : "Select state first"}
                  emptyLabel="Select city"
                  disabled={!stateId}
                  error={Boolean(errors.city)}
                  onChange={(nextId, label) => {
                    setCityId(nextId);
                    updateForm({ city: nextId && label ? label : "" });
                    setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                />
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Pincode" htmlFor={id("pincode")} required error={errors.pincode}>
                <IconInput
                  id={id("pincode")}
                  icon={MapPin}
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="6-digit pincode"
                  value={form.pincode}
                  error={!!errors.pincode}
                  onChange={(e) =>
                    updateForm({
                      pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    })
                  }
                />
              </FormField>

              <FormField label="Country" htmlFor={id("country")}>
                <IconInput
                  id={id("country")}
                  icon={Globe}
                  value={form.country}
                  readOnly
                  className="cursor-not-allowed bg-muted text-foreground"
                />
              </FormField>
            </div>
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
        <div className="rounded-lg border border-error/20 bg-error-soft p-3 text-xs font-medium text-error">{error}</div>
      ) : null}

      {!hideSubmitButton ? (
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted"
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
